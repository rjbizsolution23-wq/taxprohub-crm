/**
 * ═══════════════════════════════════════════════════════════════════════
 * CLOUDFLARE PAGES FUNCTIONS — Tax Pro Hub University Platform API v1
 * ═══════════════════════════════════════════════════════════════════════
 * Single edge catch-all Worker serving:
 *
 *   AUTH      POST /api/auth/signup | login | logout | change-password
 *             GET  /api/auth/me
 *   DATA      GET  /api/v1/bootstrap                    (tenant snapshot in 1 call)
 *             GET  /api/v1/:entity?q=&limit=&offset=     (list, tenant-scoped)
 *             POST /api/v1/:entity                      (create)
 *             GET  /api/v1/:entity/:id
 *             PUT  /api/v1/:entity/:id                  (upsert — used by the
 *                                                        frontend optimistic sync)
 *             DELETE /api/v1/:entity/:id
 *   INTEGRATIONS (unchanged contract)
 *             POST /api/sms/send            → Twilio
 *             POST /api/email/send          → Resend | MailChannels
 *             POST /api/stripe/checkout     → Stripe Checkout
 *             POST /api/stripe/connect      → Stripe Connect transfer
 *             POST /api/stripe/webhook      → signed event intake
 *             POST /api/video/session       → Cloudflare Calls
 *             POST /api/llm/chat            → OpenAI-compatible proxy
 *             POST /api/payouts/accrue      → D1 payouts ledger
 *             POST /api/referrals/link      → tracked referral link
 *             GET  /api/bank/status         → bank product feeds
 *             GET  /api/keys, POST /api/keys, DELETE /api/keys
 *             POST /api/tenants/provision   → real D1 tenant provisioning
 *             POST /api/import              → bulk contact import
 *             GET  /api/health              → integration status board
 *
 * Sealed in D1 (binding DB) + KV (binding LEDGER). Every endpoint degrades
 * gracefully: missing binding/keys return `configured:false` so the UI can
 * show exactly what needs to be connected.
 *
 * SECRETS (wrangler pages secret put NAME):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   CF_CALLS_APP_ID, CF_CALLS_APP_SECRET
 *   OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
 *   RESEND_API_KEY (optional; MailChannels fallback), MAIL_FROM
 *   SESSION_SECRET (optional pepper used for password hashing)
 */

interface Env {
  DB?: D1Database;
  LEDGER?: KVNamespace;
  DOCS?: R2Bucket;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  CF_CALLS_APP_ID?: string;
  CF_CALLS_APP_SECRET?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  SESSION_SECRET?: string;
  CRON_SECRET?: string;
  EFILE_PROVIDER_URL?: string;
  EFILE_PROVIDER_KEY?: string;
  PORTAL_BASE_URL?: string;
}

type Ctx = { request: Request; env: Env; params: { route?: string[] } };

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const PBKDF2_ITERATIONS = 210_000;

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

const json = (data: unknown, status = 200, request?: Request) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  };
  const origin = request?.headers.get('Origin');
  // Same-origin/reflected CORS; integration endpoints may be called cross-app.
  headers['Access-Control-Allow-Origin'] = origin || '*';
  if (origin) headers['Vary'] = 'Origin';
  return new Response(JSON.stringify(data), { status, headers });
};

const notConfigured = (integration: string, needs: string[]) =>
  json({ ok: false, configured: false, integration, needs, hint: needs[0] }, 501);

const bad = (error: string, status = 400) => json({ ok: false, error }, status);

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const randHex = (bytes = 32) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
  .map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ── Password hashing: PBKDF2-SHA256 (WebCrypto, native speed) ── */
async function hashPassword(password: string, pepper = ''): Promise<string> {
  const salt = randHex(16);
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password + pepper), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS },
    material, 256,
  );
  const hash = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

async function verifyPassword(password: string, stored: string, pepper = ''): Promise<boolean> {
  try {
    const [alg, iterStr, salt, hash] = stored.split('$');
    if (alg !== 'pbkdf2') return false;
    const material = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password + pepper), 'PBKDF2', false, ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: Number(iterStr) },
      material, 256,
    );
    const candidate = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return candidate === hash;
  } catch {
    return false;
  }
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* ── Session token extraction: Authorization: Bearer … or cookie ── */
function tokenFromRequest(request: Request): string {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)tph_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function createSession(env: Env, userId: string, tenantId: string, request: Request) {
  const token = randHex(32);
  const hash = await sha256(token);
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB!.prepare(
    `INSERT INTO sessions (id, user_id, tenant_id, token_hash, expires_at, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(uuid(), userId, tenantId, hash, expires,
    request.headers.get('CF-Connecting-IP') || '', request.headers.get('User-Agent') || '', nowIso()).run();
  return { token, expiresAt: expires };
}

interface Authed {
  user: Record<string, unknown>;
  tenant: Record<string, unknown>;
  sessionId: string;
}

async function auth(env: Env, request: Request): Promise<Authed | null> {
  if (!env.DB) return null;
  const token = tokenFromRequest(request);
  if (!token) return null;
  const hash = await sha256(token);
  const now = nowIso();
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.user_id, s.tenant_id, u.name, u.email, u.role, u.status
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'`,
  ).bind(hash, now).first<Record<string, unknown>>();
  if (!row) return null;
  const tenantRow = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(row.tenant_id).first<Record<string, unknown>>();
  if (!tenantRow) return null;
  return {
    sessionId: String(row.session_id),
    user: { id: row.user_id, tenantId: row.tenant_id, email: row.email, name: row.name, role: row.role, createdAt: undefined },
    tenant: rowToTenant(tenantRow),
  };
}

function rowToTenant(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    businessName: row.business_name,
    businessAddress: row.business_address,
    email: row.email,
    phone: row.phone,
    logo: row.logo,
    domain: row.domain,
    colors: safeJson(row.colors, {}),
    status: row.status,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

async function audit(env: Env, entry: { tenantId?: string; userId?: string; action: string; resource?: string; resourceId?: string; details?: unknown; request?: Request }) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, user_id, action, resource, resource_id, details, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(uuid(), entry.tenantId || '', entry.userId || '', entry.action, entry.resource || '',
      entry.resourceId || '', JSON.stringify(entry.details || {}),
      entry.request?.headers.get('CF-Connecting-IP') || '', nowIso()).run();
  } catch { /* never break the primary request on audit failure */ }
}

/* ═══════════════════════ ENTITY REGISTRY ═══════════════════════ */

type EntityDef = {
  table: string;
  json: string[];
  numeric: string[];
  bool: string[];
  text: string[];
};

const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const ENTITIES: Record<string, EntityDef> = {
  contacts: {
    table: 'contacts',
    text: ['id', 'tenant_id', 'first_name', 'last_name', 'email', 'phone', 'company', 'source', 'status', 'assigned_to', 'pipeline_id', 'stage_id'],
    json: ['tags', 'custom_fields', 'notes', 'activities', 'created_at', 'updated_at'],
    numeric: ['value'],
    bool: [],
  },
  deals: {
    table: 'deals',
    text: ['id', 'tenant_id', 'name', 'title', 'contact_id', 'contact_name', 'spouse_name', 'pipeline_id', 'stage_id', 'expected_close_date', 'assigned_to', 'owner_id', 'owner_name', 'source', 'filing_complexity', 'fee_structure', 'reviewer_name', 'deadline_countdown_days', 'document_completeness', 'software_stack', 'onboarding_status', 'health_score', 'irs_notice_type', 'tax_years_involved', 'resolution_type', 'poa_expired', 'sol_date', 'cancellation_window_status', 'funding_goal', 'custom_domain', 'first_revenue_date', 'ai_stage_suggestion', 'ai_renewal_risk', 'commission_plan'],
    json: ['tags', 'ai_rationale', 'commission_splits', 'created_at', 'updated_at'],
    numeric: ['value', 'probability', 'estimated_refund', 'estimated_balance_due', 'amount_in_dispute', 'estimated_savings', 'revenue_share_percent', 'monthly_rev_share_owed', 'manager_override_percent', 'dependents_count', 'returns_count', 'days_in_stage', 'sla_days', 'mrr_amount', 'transactions_per_month', 'setup_progress', 'projected_volume', 'score_start', 'score_current', 'negative_items_disputed', 'clawback_window_days', 'ai_score'],
    bool: ['cleanup_project', 'croa_disclosure_sent'],
  },
  appointments: {
    table: 'appointments',
    text: ['id', 'tenant_id', 'title', 'description', 'start_time', 'end_time', 'location', 'type', 'status', 'contact_id', 'assigned_to', 'meeting_link'],
    json: ['reminders', 'created_at', 'updated_at'],
    numeric: [],
    bool: [],
  },
  campaigns: {
    table: 'campaigns',
    text: ['id', 'tenant_id', 'name', 'type', 'status', 'subject', 'content', 'scheduled_at', 'sent_at', 'completed_at', 'audience', 'goal', 'source_template_id'],
    json: ['sequence', 'created_at', 'updated_at'],
    numeric: ['recipient_count', 'sent_count', 'opened_count', 'clicked_count'],
    bool: [],
  },
  workflows: {
    table: 'workflows',
    text: ['id', 'tenant_id', 'name'],
    json: ['trigger', 'actions', 'created_at', 'updated_at'],
    numeric: [],
    bool: ['is_active'],
  },
  funnels: {
    table: 'funnels',
    text: ['id', 'tenant_id', 'name', 'domain'],
    json: ['steps', 'stats', 'created_at', 'updated_at'],
    numeric: [],
    bool: ['published'],
  },
  websites: {
    table: 'websites',
    text: ['id', 'tenant_id', 'name', 'domain'],
    json: ['pages', 'theme', 'created_at', 'updated_at'],
    numeric: [],
    bool: ['published'],
  },
  forms: {
    table: 'forms',
    text: ['id', 'tenant_id', 'name', 'slug'],
    json: ['fields', 'settings', 'submissions', 'created_at', 'updated_at'],
    numeric: [],
    bool: [],
  },
  'blog-posts': {
    table: 'blog_posts',
    text: ['id', 'tenant_id', 'title', 'slug', 'content', 'excerpt', 'featured_image', 'author_id', 'author_name', 'status', 'published_at', 'scheduled_at'],
    json: ['tags', 'created_at', 'updated_at'],
    numeric: [],
    bool: [],
  },
  preparers: {
    table: 'preparers',
    text: ['id', 'tenant_id', 'first_name', 'last_name', 'email', 'phone', 'avatar', 'role', 'status', 'ptin', 'efin', 'pay_structure', 'circular230_status'],
    json: ['credentials', 'assigned_client_ids', 'assigned_deal_ids', 'payout_ledger', 'performance', 'created_at', 'updated_at'],
    numeric: ['payout_rate', 'ce_credits'],
    bool: [],
  },
  payouts: {
    table: 'payouts',
    text: ['id', 'tenant_id', 'preparer_id', 'preparer_name', 'deal_id', 'deal_title', 'method', 'status', 'reference_number', 'payment_date', 'description', 'notes'],
    json: ['created_at', 'updated_at'],
    numeric: ['amount', 'base_amount', 'commission_amount'],
    bool: [],
  },
  tasks: {
    table: 'tasks',
    text: ['id', 'tenant_id', 'title', 'description', 'contact_id', 'deal_id', 'assignee', 'priority', 'status', 'due_at', 'source'],
    json: ['tags', 'created_at', 'updated_at'],
    numeric: [],
    bool: [],
  },
  pipelines: {
    table: 'pipelines',
    text: ['id', 'tenant_id', 'name', 'color'],
    json: ['stages', 'created_at', 'updated_at'],
    numeric: [],
    bool: ['is_default'],
  },
};

const ENTITY_NAMES = Object.keys(ENTITIES);
export const isEntity = (name: string): name is keyof typeof ENTITIES => ENTITY_NAMES.includes(name);

/** Map a client payload (camelCase) into DB column values. */
function payloadToRow(entity: string, body: Record<string, unknown>, tenantId: string): Record<string, unknown> {
  const def = ENTITIES[entity];
  const row: Record<string, unknown> = {};
  for (const col of def.text) {
    const key = camel(col);
    // Accept camelCase, snake_case, and the frontend's subAccountId alias.
    const value = col === 'tenant_id'
      ? (body.tenantId ?? body.subAccountId ?? body.tenant_id ?? '')
      : (body[key] ?? body[col] ?? '');
    row[col] = value === undefined || value === null ? '' : String(value);
  }
  for (const col of def.numeric) {
    const key = camel(col);
    const value = body[key] ?? body[col];
    row[col] = value === undefined || value === null ? 0 : Number(value) || 0;
  }
  for (const col of def.bool) {
    const key = camel(col);
    const value = body[key] ?? body[col];
    row[col] = value ? 1 : 0;
  }
  for (const col of def.json) {
    const key = camel(col);
    const value = body[key] ?? body[col];
    row[col] = value === undefined || value === null ? (col === 'created_at' || col === 'updated_at' ? nowIso() : []) : JSON.stringify(value);
  }
  row.tenant_id = tenantId;
  return row;
}

function rowToPayload(entity: string, row: Record<string, unknown>): Record<string, unknown> {
  const def = ENTITIES[entity];
  const out: Record<string, unknown> = {};
  for (const col of def.text) {
    // Frontend expects subAccountId; external API callers get it too.
    out[camel(col) === 'tenantId' ? 'subAccountId' : camel(col)] = row[col] ?? '';
  }
  for (const col of def.numeric) {
    out[camel(col)] = Number(row[col] ?? 0);
  }
  for (const col of def.bool) {
    out[camel(col)] = !!row[col];
  }
  for (const col of def.json) {
    out[camel(col)] = safeJson(row[col], col === 'created_at' || col === 'updated_at' ? nowIso() : []);
  }
  return out;
}

/* ═══════════════════════════ AUTH ═══════════════════════════ */

async function handleSignup(env: Env, request: Request, body: Record<string, unknown>) {
  if (!env.DB) return notConfigured('database', ['Create the D1 database: npm run cf:setup / wrangler d1 create taxprohub-crm']);
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.fullName || body.name || '').trim();
  const businessName = String(body.businessName || body.businessName || 'Tax Pro Hub Practice').trim();
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '');
  const plan = String(body.plan || 'starter');

  if (!emailOk(email)) return bad('A valid email address is required.');
  if (name.length < 2) return bad('Please enter your full name.');
  if (password.length < 8) return bad('Password must be at least 8 characters.');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return bad('An account with this email already exists. Try signing in instead.', 409);

  const tenantId = `t_${randHex(6)}`;
  const userId = `u_${randHex(6)}`;
  const t = nowIso();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO tenants (id, name, business_name, business_address, email, phone, logo, domain, colors, status, plan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    ).bind(tenantId, businessName, businessName, String(body.businessAddress || ''), email, phone, '', '',
      JSON.stringify({ primary: '#D4AF37', secondary: '#111111', accent: '#FFD700', background: '#030712', text: '#F1F5F9' }),
      plan, t, t),
    env.DB.prepare(
      `INSERT INTO users (id, tenant_id, email, name, role, password_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', ?, 'active', ?, ?)`,
    ).bind(userId, tenantId, email, name, await hashPassword(password, env.SESSION_SECRET), t, t),
    env.DB.prepare(
      `INSERT INTO pipelines (id, tenant_id, name, color, is_default, stages, created_at, updated_at)
       VALUES (?, ?, 'Default Pipeline', '#D4AF37', 1, ?, ?, ?)`,
    ).bind(`p_${randHex(6)}`, tenantId, JSON.stringify([
      { id: 'stage-1', name: 'New Lead', position: 0 },
      { id: 'stage-2', name: 'Contacted', position: 1 },
      { id: 'stage-3', name: 'Qualified', position: 2 },
      { id: 'stage-4', name: 'Proposal', position: 3 },
      { id: 'stage-5', name: 'Negotiation', position: 4 },
      { id: 'stage-6', name: 'Closed Won', position: 5 },
      { id: 'stage-7', name: 'Closed Lost', position: 6 },
    ]), t, t),
  ]);

  const session = await createSession(env, userId, tenantId, request);
  await audit(env, { tenantId, userId, action: 'tenant.signup', resource: 'tenants', resourceId: tenantId, request });

  return json({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: { id: userId, tenantId, email, name, role: 'admin', createdAt: t },
    tenant: { id: tenantId, name: businessName, businessName, businessAddress: String(body.businessAddress || ''), email, phone, colors: { primary: '#D4AF37', secondary: '#111111', accent: '#FFD700', background: '#030712', text: '#F1F5F9' }, status: 'active', plan, createdAt: t, updatedAt: t },
  });
}

async function handleLogin(env: Env, request: Request, body: Record<string, unknown>) {
  if (!env.DB) return notConfigured('database', ['Create the D1 database: npm run cf:setup / wrangler d1 create taxprohub-crm']);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!emailOk(email) || !password) return bad('Email and password are required.');

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND status = ?',
  ).bind(email, 'active').first<Record<string, unknown>>();
  if (!user) return bad('Invalid email or password.', 401);

  const ok = await verifyPassword(password, String(user.password_hash), env.SESSION_SECRET);
  if (!ok) return bad('Invalid email or password.', 401);

  // Second factor, when the account has TOTP enabled.
  const mfa = await env.DB.prepare('SELECT * FROM user_mfa WHERE user_id = ? AND enabled = 1')
    .bind(user.id).first<Record<string, any>>().catch(() => null);
  if (mfa) {
    const code = String(body.code || body.mfaCode || '').trim();
    if (!code) return json({ ok: false, error: 'mfa_required', hint: 'Enter the 6-digit code from your authenticator app.' }, 401);
    let passed = await verifyTotp(env, String(user.id), String(mfa.secret), code, Number(mfa.last_used_step || 0));
    if (!passed) {
      // Fall back to a one-time backup code.
      const hashes = safeJson<string[]>(mfa.backup_codes, []);
      const supplied = await sha256(code.toUpperCase());
      if (hashes.includes(supplied)) {
        passed = true;
        await env.DB.prepare('UPDATE user_mfa SET backup_codes = ?, updated_at = ? WHERE user_id = ?')
          .bind(JSON.stringify(hashes.filter((h) => h !== supplied)), nowIso(), user.id).run();
        await audit(env, { tenantId: String(user.tenant_id), userId: String(user.id), action: 'mfa.backup_code_used', resource: 'users', resourceId: String(user.id), request });
      }
    }
    if (!passed) return json({ ok: false, error: 'invalid_mfa_code' }, 401);
  }

  const session = await createSession(env, String(user.id), String(user.tenant_id), request);
  const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(user.tenant_id).first<Record<string, unknown>>();

  return json({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: { id: user.id, tenantId: user.tenant_id, email: user.email, name: user.name, role: user.role, createdAt: user.created_at },
    tenant: tenant ? rowToTenant(tenant) : null,
  });
}

async function handleMe(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  return json({ ok: true, user: a.user, tenant: a.tenant });
}

async function handleLogout(env: Env, request: Request) {
  if (!env.DB) return notConfigured('database', ['D1 binding required']);
  const a = await auth(env, request);
  if (a) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(a.sessionId).run();
  return json({ ok: true });
}

async function handleChangePassword(env: Env, request: Request, body: Record<string, unknown>) {
  if (!env.DB) return notConfigured('database', ['D1 binding required']);
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(a.user.id).first<Record<string, unknown>>();
  if (!user) return bad('User not found', 404);
  const ok = await verifyPassword(String(body.current || ''), String(user.password_hash), env.SESSION_SECRET);
  if (!ok) return bad('Current password is incorrect.', 400);
  if (String(body.next || '').length < 8) return bad('New password must be at least 8 characters.');
  await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(await hashPassword(String(body.next), env.SESSION_SECRET), nowIso(), a.user.id).run();
  return json({ ok: true });
}

/* ═══════════════════════ BOOTSTRAP + CRUD ═══════════════════════ */

async function handleBootstrap(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const tenantId = String(a.tenant.id);

  const q = async (entity: string) => {
    const def = ENTITIES[entity];
    const rows = await env.DB!.prepare(`SELECT * FROM ${def.table} WHERE tenant_id = ? ORDER BY created_at DESC`)
      .bind(tenantId).all<Record<string, unknown>>();
    return (rows.results || []).map((r) => rowToPayload(entity, r));
  };

  const [pipelines, contacts, deals, appointments, campaigns, workflows, funnels, websites, forms, blogPosts, preparers, payouts] = await Promise.all([
    q('pipelines'), q('contacts'), q('deals'), q('appointments'), q('campaigns'), q('workflows'),
    q('funnels'), q('websites'), q('forms'), q('blog-posts'), q('preparers'), q('payouts'),
  ]);

  return json({
    ok: true,
    user: a.user,
    tenant: a.tenant,
    pipelines, contacts, deals, appointments, campaigns, workflows, funnels, websites, forms,
    blogPosts, preparers, payouts,
    backend: 'cloudflare-pages-d1',
    timestamp: nowIso(),
  });
}

async function listEntity(env: Env, request: Request, entity: string, url: URL) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const def = ENTITIES[entity];
  const tenantId = String(a.tenant.id);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 500, 1), 1000);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();

  let where = 'WHERE tenant_id = ?';
  const args: unknown[] = [tenantId];
  let order = 'ORDER BY updated_at DESC';

  if (q) {
    const searchCols = def.text.filter((c) => !['id', 'tenant_id'].includes(c)).slice(0, 8);
    where += ' AND (' + searchCols.map((c) => `LOWER(${c}) LIKE ?`).join(' OR ') + ')';
    for (let i = 0; i < searchCols.length; i++) args.push(`%${q}%`);
  }

  const countRow = await env.DB!.prepare(`SELECT COUNT(*) AS n FROM ${def.table} ${where}`).bind(...args).first<{ n: number }>();
  const rows = await env.DB!.prepare(`SELECT * FROM ${def.table} ${where} ${order} LIMIT ? OFFSET ?`)
    .bind(...args, limit, offset).all<Record<string, unknown>>();

  return json({
    ok: true,
    items: (rows.results || []).map((r) => rowToPayload(entity, r)),
    total: countRow?.n || 0,
    limit,
    offset,
  });
}

async function upsertEntity(env: Env, request: Request, entity: string, id: string | null, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const def = ENTITIES[entity];
  const tenantId = String(a.tenant.id);
  const rowId = id || String(body.id || `e_${randHex(8)}`);

  const row = { ...payloadToRow(entity, body, tenantId), id: rowId };
  if (!row.created_at) row.created_at = nowIso();
  row.updated_at = nowIso();
  row.tenant_id = tenantId;

  const cols = Object.keys(row);
  const placeholders = cols.map((c) => `?`).join(', ');
  const updates = cols.filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`).join(', ');

  await env.DB!.prepare(
    `INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates}`,
  ).bind(...cols.map((c) => row[c])).run();

  const saved = await env.DB!.prepare(`SELECT * FROM ${def.table} WHERE id = ? AND tenant_id = ?`)
    .bind(rowId, tenantId).first<Record<string, unknown>>();
  await audit(env, { tenantId, userId: String(a.user.id), action: id ? 'entity.update' : 'entity.create', resource: entity, resourceId: rowId, request });

  return saved ? json({ ok: true, item: rowToPayload(entity, saved) }) : bad('Upsert failed', 500);
}

async function getEntity(env: Env, request: Request, entity: string, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const def = ENTITIES[entity];
  const row = await env.DB!.prepare(`SELECT * FROM ${def.table} WHERE id = ? AND tenant_id = ?`)
    .bind(id, String(a.tenant.id)).first<Record<string, unknown>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  return json({ ok: true, item: rowToPayload(entity, row) });
}

async function deleteEntity(env: Env, request: Request, entity: string, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const def = ENTITIES[entity];
  await env.DB!.prepare(`DELETE FROM ${def.table} WHERE id = ? AND tenant_id = ?`)
    .bind(id, String(a.tenant.id)).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'entity.delete', resource: entity, resourceId: id, request });
  return json({ ok: true, deleted: id });
}

/* ═══════════════════════════ TWILIO SMS ═══════════════════════════ */
async function sendSMS(env: Env, to: string, body: string) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER)
    return notConfigured('twilio', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM_NUMBER, Body: body }),
    },
  );
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, sid: data.sid, status: data.status, error: res.ok ? undefined : data.message }, res.ok ? 200 : 502);
}

/* ═══════════════════════════ EMAIL ═══════════════════════════ */
async function sendEmail(env: Env, payload: { to: string; subject: string; html?: string; text?: string }) {
  const from = env.MAIL_FROM || 'no-reply@example.com';
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text }),
    });
    const data = await res.json() as Record<string, unknown>;
    return json({ ok: res.ok, provider: 'resend', id: data.id, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
  }
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: from },
      subject: payload.subject,
      content: [{ type: payload.html ? 'text/html' : 'text/plain', value: payload.html || payload.text || '' }],
    }),
  });
  return json({ ok: res.ok, provider: 'mailchannels', status: res.status }, res.ok ? 200 : 502);
}

/* ═══════════════════════════ STRIPE ═══════════════════════════ */
async function stripeCheckout(env: Env, body: { amountCents: number; description: string; successUrl: string; cancelUrl: string; customerEmail?: string }) {
  if (!env.STRIPE_SECRET_KEY) return notConfigured('stripe', ['STRIPE_SECRET_KEY']);
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(body.amountCents),
    'line_items[0][price_data][product_data][name]': body.description,
    'line_items[0][quantity]': '1',
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
  });
  if (body.customerEmail) params.set('customer_email', body.customerEmail);
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, url: data.url, sessionId: data.id, error: res.ok ? undefined : (data.error as any)?.message }, res.ok ? 200 : 502);
}

async function stripeConnectTransfer(env: Env, body: { amountCents: number; connectedAccountId: string; description: string }) {
  if (!env.STRIPE_SECRET_KEY) return notConfigured('stripe', ['STRIPE_SECRET_KEY']);
  const res = await fetch('https://api.stripe.com/v1/transfers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      amount: String(body.amountCents),
      currency: 'usd',
      destination: body.connectedAccountId,
      description: body.description,
    }),
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, transferId: data.id, error: res.ok ? undefined : (data.error as any)?.message }, res.ok ? 200 : 502);
}

async function stripeWebhook(env: Env, request: Request) {
  const sig = request.headers.get('stripe-signature');
  const payload = await request.text();
  if (env.STRIPE_WEBHOOK_SECRET && sig) {
    const parts = Object.fromEntries(sig.split(',').map((p) => p.split('=') as [string, string]));
    const signedPayload = `${parts.t}.${payload}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (expected !== parts.v1) return json({ ok: false, error: 'signature_mismatch' }, 400);
  }
  const event = JSON.parse(payload);
  if (env.LEDGER) await env.LEDGER.put(`stripe-event:${event.id}`, payload, { expirationTtl: 60 * 60 * 24 * 30 });

  // Reconcile checkout completions against the invoice ledger.
  if (env.DB && (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')) {
    const sessionId = String(event.data?.object?.id || '');
    const intent = String(event.data?.object?.payment_intent || '');
    if (sessionId) {
      const inv = await env.DB.prepare('SELECT id, tenant_id FROM invoices WHERE stripe_session_id = ?')
        .bind(sessionId).first<Record<string, unknown>>();
      if (inv) {
        await markInvoicePaid(env, String(inv.tenant_id), String(inv.id), intent);
        await audit(env, { tenantId: String(inv.tenant_id), action: 'invoice.paid', resource: 'invoices', resourceId: String(inv.id), details: { sessionId } });
      }
    }
  }
  return json({ ok: true, received: event.type });
}

/* ════════════════════ CLOUDFLARE CALLS (video) ════════════════════ */
async function createVideoSession(env: Env) {
  if (!env.CF_CALLS_APP_ID || !env.CF_CALLS_APP_SECRET)
    return notConfigured('cloudflare_calls', ['CF_CALLS_APP_ID', 'CF_CALLS_APP_SECRET']);
  const res = await fetch(
    `https://rtc.live.cloudflare.com/v1/apps/${env.CF_CALLS_APP_ID}/sessions/new`,
    { method: 'POST', headers: { Authorization: `Bearer ${env.CF_CALLS_APP_SECRET}` } },
  );
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, sessionId: (data as any).sessionId, appId: env.CF_CALLS_APP_ID, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
}

/* ═══════════════════════════ LLM PROXY ═══════════════════════════ */
async function llmChat(env: Env, body: { messages: unknown[]; model?: string; max_completion_tokens?: number }) {
  if (!env.OPENAI_API_KEY) return notConfigured('openai_compatible', ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL']);
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: body.model || env.OPENAI_MODEL || 'gpt-5-mini',
      messages: body.messages,
      max_completion_tokens: body.max_completion_tokens || 4096,
    }),
  });
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

/* ═══════════════ LEDGER (payouts / referrals / keys) ═══════════════ */
async function accruePayout(env: Env, request: Request, body: { preparerId: string; dealId: string; amountCents: number; note?: string; tenantId?: string; preparerName?: string; dealTitle?: string }) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  const now = nowIso();
  const entry = {
    id: `pay_${Date.now()}_${randHex(4)}`,
    preparerId: body.preparerId,
    preparerName: body.preparerName || '',
    dealId: body.dealId,
    dealTitle: body.dealTitle || '',
    amount: (body.amountCents || 0) / 100,
    baseAmount: (body.amountCents || 0) / 100,
    commissionAmount: (body.amountCents || 0) / 100,
    method: 'stripe',
    status: 'pending',
    referenceNumber: `TPH-${Date.now()}`,
    paymentDate: now,
    description: body.note || 'Preparer payout accrual',
    tenantId: String(a.tenant.id),
  };

  if (env.DB) {
    await upsertEntity(env, request, 'payouts', entry.id, { ...entry, subAccountId: String(a.tenant.id) });
    return json({ ok: true, persisted: 'd1', entry });
  }
  if (env.LEDGER) {
    await env.LEDGER.put(`payout:${entry.id}`, JSON.stringify({ ...entry, tenantId: String(a.tenant.id) }));
    return json({ ok: true, persisted: 'kv', entry });
  }
  return json({ ok: true, persisted: 'none', entry, hint: 'Bind D1 (DB) or KV (LEDGER) for durable persistence' });
}

async function referralLink(env: Env, body: { contactId: string; baseUrl?: string }) {
  const code = btoa(`${body.contactId}:${Date.now()}`).replace(/[+/=]/g, '').slice(0, 10);
  const link = `${body.baseUrl || 'https://tax-pro-hub-university.pages.dev'}/#/r/${code}`;
  if (env.LEDGER) await env.LEDGER.put(`referral:${code}`, JSON.stringify({ contactId: body.contactId, createdAt: nowIso() }));
  return json({ ok: true, code, link });
}

/* ═══════════════════════════ HEALTH ═══════════════════════════ */
function health(env: Env) {
  return json({
    ok: true,
    platform: 'cloudflare-pages-functions',
    version: 'v2',
    timestamp: nowIso(),
    integrations: {
      database_d1: !!env.DB,
      kv_ledger: !!env.LEDGER,
      r2_document_vault: !!env.DOCS,
      cron_engine: !!env.CRON_SECRET,
      compliance_agents: COMPLIANCE_AGENTS.length,
      esign_engine: true,
      efile_provider: !!env.EFILE_PROVIDER_URL,
      mfa_totp: true,
      plan_enforcement: true,
      invoicing: !!env.STRIPE_SECRET_KEY,
      twilio_sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER),
      stripe: !!env.STRIPE_SECRET_KEY,
      stripe_webhooks: !!env.STRIPE_WEBHOOK_SECRET,
      cloudflare_calls_video: !!(env.CF_CALLS_APP_ID && env.CF_CALLS_APP_SECRET),
      llm: !!env.OPENAI_API_KEY,
      email_resend: !!env.RESEND_API_KEY,
      email_mailchannels_fallback: true,
    },
    setup: {
      database: 'npm run cf:setup  (creates D1 + KV, applies migrations, updates wrangler.toml)',
      twilio: 'wrangler pages secret put TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER',
      stripe: 'wrangler pages secret put STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET',
      video: 'Create a Calls app at dash.cloudflare.com → Calls, then set CF_CALLS_APP_ID / CF_CALLS_APP_SECRET',
      llm: 'wrangler pages secret put OPENAI_API_KEY (+ OPENAI_BASE_URL for any compatible provider)',
    },
  });
}


/* ═══════════════ SECURE DOCUMENT VAULT (R2 + D1 index) ═══════════════ */

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB per object

const fileRowToPayload = (row: Record<string, unknown>) => ({
  id: row.id,
  subAccountId: row.tenant_id,
  contactId: row.contact_id || null,
  dealId: row.deal_id || null,
  name: row.name,
  folder: row.folder,
  docType: row.doc_type,
  taxYear: row.tax_year || null,
  contentType: row.content_type,
  size: Number(row.size || 0),
  sha256: row.sha256 || null,
  uploadedBy: row.uploaded_by || null,
  status: row.status,
  metadata: safeJson(row.metadata, {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  downloadUrl: `/api/v1/files/${row.id}/download`,
});

async function listFiles(env: Env, request: Request, url: URL) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['Create the D1 database: npm run cf:setup']);

  const contactId = url.searchParams.get('contactId');
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(Number(url.searchParams.get('limit') || 200), 500);
  const offset = Number(url.searchParams.get('offset') || 0);

  const where: string[] = ['tenant_id = ?'];
  const binds: unknown[] = [a.tenant.id];
  if (contactId) { where.push('contact_id = ?'); binds.push(contactId); }
  if (q) { where.push('(name LIKE ? OR folder LIKE ? OR doc_type LIKE ?)'); binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  const rows = await env.DB.prepare(
    `SELECT * FROM files WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  ).bind(...binds, limit, offset).all<Record<string, unknown>>();

  return json({ ok: true, items: (rows.results || []).map(fileRowToPayload), count: (rows.results || []).length });
}

async function uploadFile(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DOCS) return notConfigured('r2_document_vault', ['Create the R2 bucket: npm run cf:setup (or wrangler r2 bucket create taxprohub-docs)']);
  if (!env.DB) return notConfigured('database', ['Create the D1 database: npm run cf:setup']);

  const contentType = request.headers.get('Content-Type') || '';
  let blob: Blob | null = null;
  let name = 'upload.bin';
  let meta: Record<string, string> = {};

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const f = form.get('file');
    if (!(f instanceof File)) return bad('file_field_required');
    blob = f;
    name = f.name || name;
    form.forEach((v, k) => { if (k !== 'file' && typeof v === 'string') meta[k] = v; });
  } else {
    // Raw binary upload: metadata travels in X-File-* headers / query string.
    const url = new URL(request.url);
    blob = await request.blob();
    name = request.headers.get('X-File-Name') || url.searchParams.get('name') || name;
    url.searchParams.forEach((v, k) => { if (k !== 'name') meta[k] = v; });
  }

  const size = blob.size;
  if (!size) return bad('empty_file');
  if (size > MAX_UPLOAD_BYTES) return bad('file_too_large_max_50mb', 413);

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');

  const id = uuid();
  const safeName = name.replace(/[^\w.\- ]+/g, '_').slice(0, 180);
  const key = `tenants/${a.tenant.id}/${id}/${safeName}`;

  await env.DOCS.put(key, bytes, {
    httpMetadata: { contentType: blob.type || 'application/octet-stream', contentDisposition: `attachment; filename="${safeName}"` },
    customMetadata: { tenantId: String(a.tenant.id), uploadedBy: String(a.user.id), sha256: checksum },
  });

  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO files (id, tenant_id, contact_id, deal_id, name, folder, doc_type, tax_year,
                        content_type, size, r2_key, sha256, uploaded_by, status, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stored', ?, ?, ?)`,
  ).bind(
    id, a.tenant.id, meta.contactId || null, meta.dealId || null, safeName,
    meta.folder || 'General', meta.docType || 'Other', meta.taxYear || null,
    blob.type || 'application/octet-stream', size, key, checksum, a.user.id,
    JSON.stringify(meta), now, now,
  ).run();

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'file.upload', resource: 'files', resourceId: id, details: { name: safeName, size }, request });

  const row = await env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(id).first<Record<string, unknown>>();
  return json({ ok: true, item: row ? fileRowToPayload(row) : { id, name: safeName } }, 201);
}

async function downloadFile(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DOCS || !env.DB) return notConfigured('r2_document_vault', ['npm run cf:setup creates the R2 bucket + D1 database']);

  const row = await env.DB.prepare('SELECT * FROM files WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, unknown>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);

  const obj = await env.DOCS.get(String(row.r2_key));
  if (!obj) return json({ ok: false, error: 'object_missing_in_r2' }, 410);

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'file.download', resource: 'files', resourceId: id, request });

  return new Response(obj.body, {
    headers: {
      'Content-Type': String(row.content_type || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename="${String(row.name).replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

async function deleteFile(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const row = await env.DB.prepare('SELECT * FROM files WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, unknown>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);

  if (env.DOCS) { try { await env.DOCS.delete(String(row.r2_key)); } catch { /* orphan cleanup happens on lifecycle rule */ } }
  await env.DB.prepare('DELETE FROM files WHERE id = ? AND tenant_id = ?').bind(id, a.tenant.id).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'file.delete', resource: 'files', resourceId: id, request });
  return json({ ok: true, deleted: id });
}



/** Engine-safe wrappers: provider/network failures become results, not crashes. */
async function safeSendEmail(env: Env, payload: { to: string; subject: string; html?: string; text?: string }) {
  try {
    const res = await sendEmail(env, payload);
    const body = await res.clone().json().catch(() => ({})) as Record<string, unknown>;
    return { ok: res.status < 400 && body.ok !== false, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: { error: String(e).slice(0, 200) } };
  }
}

async function safeSendSMS(env: Env, to: string, body: string) {
  try {
    const res = await sendSMS(env, to, body);
    const data = await res.clone().json().catch(() => ({})) as Record<string, unknown>;
    return { ok: res.status < 400 && data.ok !== false, status: res.status, body: data };
  } catch (e) {
    return { ok: false, status: 0, body: { error: String(e).slice(0, 200) } };
  }
}

/* ══════════ DELIVERY ENGINE — campaigns, workflows, cron worker ══════════ */

/** {{contact.firstName}} style merge tags resolved against a contact row. */
function renderTemplate(tpl: string, contact: Record<string, unknown> | null, tenant: Record<string, unknown>) {
  const map: Record<string, string> = {
    'contact.firstName': String(contact?.first_name || 'there'),
    'contact.lastName': String(contact?.last_name || ''),
    'contact.email': String(contact?.email || ''),
    'contact.company': String(contact?.company || ''),
    'business.name': String(tenant?.business_name || tenant?.name || ''),
    'business.email': String(tenant?.email || ''),
    'business.phone': String(tenant?.phone || ''),
  };
  return String(tpl || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => map[key] ?? '');
}

/** Materialize a campaign into per-recipient rows so sends are resumable. */
async function scheduleCampaign(env: Env, request: Request, campaignId: string, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const campaign = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND tenant_id = ?')
    .bind(campaignId, a.tenant.id).first<Record<string, unknown>>();
  if (!campaign) return json({ ok: false, error: 'campaign_not_found' }, 404);

  const sendAt = String(body.sendAt || nowIso());
  const explicitIds = Array.isArray(body.contactIds) ? body.contactIds.map(String) : null;
  const tag = body.tag ? String(body.tag) : null;

  let query = 'SELECT * FROM contacts WHERE tenant_id = ?';
  const binds: unknown[] = [a.tenant.id];
  if (explicitIds?.length) {
    query += ` AND id IN (${explicitIds.map(() => '?').join(',')})`;
    binds.push(...explicitIds);
  }
  if (tag) { query += ' AND tags LIKE ?'; binds.push(`%${tag}%`); }
  const contacts = await env.DB.prepare(query).bind(...binds).all<Record<string, unknown>>();
  const audience = contacts.results || [];
  if (!audience.length) return json({ ok: false, error: 'empty_audience' }, 400);

  const type = String(campaign.type || 'email');
  const channels = type === 'both' ? ['email', 'sms'] : [type === 'sms' ? 'sms' : 'email'];

  const runId = uuid();
  const now = nowIso();
  const rows: { id: string; channel: string; address: string; contactId: string }[] = [];
  for (const c of audience) {
    for (const channel of channels) {
      const address = channel === 'email' ? String(c.email || '') : String(c.phone || '');
      if (!address) continue;
      rows.push({ id: uuid(), channel, address, contactId: String(c.id) });
    }
  }
  if (!rows.length) return json({ ok: false, error: 'no_reachable_recipients' }, 400);

  // Monthly send ceiling for the tenant's plan.
  const emailCount = rows.filter((r) => r.channel === 'email').length;
  const smsCount = rows.length - emailCount;
  if (emailCount) { const blocked = await enforceLimit(env, a.tenant, 'emailsPerMonth', emailCount); if (blocked) return blocked; }
  if (smsCount) { const blocked = await enforceLimit(env, a.tenant, 'smsPerMonth', smsCount); if (blocked) return blocked; }

  await env.DB.prepare(
    `INSERT INTO campaign_runs (id, tenant_id, campaign_id, status, scheduled_at, total, sent, failed, created_by, created_at)
     VALUES (?, ?, ?, 'scheduled', ?, ?, 0, 0, ?, ?)`,
  ).bind(runId, a.tenant.id, campaignId, sendAt, rows.length, a.user.id, now).run();

  const stmt = env.DB.prepare(
    `INSERT INTO campaign_recipients (id, tenant_id, run_id, campaign_id, contact_id, channel, address, status, scheduled_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`,
  );
  await env.DB.batch(rows.map((r) => stmt.bind(r.id, a.tenant.id, runId, campaignId, r.contactId, r.channel, r.address, sendAt, now)));

  await env.DB.prepare('UPDATE campaigns SET status = ?, scheduled_at = ?, recipient_count = ?, updated_at = ? WHERE id = ? AND tenant_id = ?')
    .bind('scheduled', sendAt, rows.length, now, campaignId, a.tenant.id).run();

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'campaign.schedule', resource: 'campaigns', resourceId: campaignId, details: { runId, recipients: rows.length, sendAt }, request });
  return json({ ok: true, runId, recipients: rows.length, scheduledAt: sendAt, note: 'Queued. The cron tick delivers due recipients.' }, 201);
}

async function campaignStats(env: Env, request: Request, campaignId: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const runs = await env.DB.prepare('SELECT * FROM campaign_runs WHERE campaign_id = ? AND tenant_id = ? ORDER BY created_at DESC')
    .bind(campaignId, a.tenant.id).all<Record<string, unknown>>();
  const totals = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n FROM campaign_recipients WHERE campaign_id = ? AND tenant_id = ? GROUP BY status`,
  ).bind(campaignId, a.tenant.id).all<Record<string, unknown>>();
  const byStatus: Record<string, number> = {};
  (totals.results || []).forEach((r) => { byStatus[String(r.status)] = Number(r.n); });
  return json({ ok: true, runs: runs.results || [], byStatus });
}

/** Enroll a contact into a workflow — the cron tick advances it step by step. */
async function enrollWorkflow(env: Env, request: Request, workflowId: string, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const wf = await env.DB.prepare('SELECT * FROM workflows WHERE id = ? AND tenant_id = ?')
    .bind(workflowId, a.tenant.id).first<Record<string, unknown>>();
  if (!wf) return json({ ok: false, error: 'workflow_not_found' }, 404);

  const contactIds = Array.isArray(body.contactIds) ? body.contactIds.map(String)
    : body.contactId ? [String(body.contactId)] : [];
  if (!contactIds.length) return json({ ok: false, error: 'contact_required' }, 400);

  const now = nowIso();
  const stmt = env.DB.prepare(
    `INSERT INTO workflow_runs (id, tenant_id, workflow_id, contact_id, status, step_index, next_run_at, context, log, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', 0, ?, '{}', '[]', ?, ?)`,
  );
  const ids = contactIds.map(() => uuid());
  await env.DB.batch(contactIds.map((cid, i) => stmt.bind(ids[i], a.tenant.id, workflowId, cid, now, now, now)));
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'workflow.enroll', resource: 'workflows', resourceId: workflowId, details: { contacts: contactIds.length }, request });
  return json({ ok: true, enrolled: contactIds.length, runIds: ids }, 201);
}

/** Execute one workflow action. Returns a delay in minutes when it must wait. */
async function runWorkflowAction(
  env: Env,
  action: Record<string, any>,
  ctx: { tenantId: string; contact: Record<string, unknown> | null; tenant: Record<string, unknown> },
): Promise<{ log: string; delayMinutes?: number }> {
  const cfg = action.config || {};
  const type = String(action.type || '');
  const contact = ctx.contact;

  switch (type) {
    case 'delay':
      return { log: `delay ${cfg.delayMinutes || 60}m`, delayMinutes: Number(cfg.delayMinutes || 60) };

    case 'send_email': {
      const to = String(contact?.email || '');
      if (!to) return { log: 'send_email skipped — contact has no email' };
      const res = await safeSendEmail(env, {
        to,
        subject: renderTemplate(String(cfg.subject || 'Update from your tax team'), contact, ctx.tenant),
        text: renderTemplate(String(cfg.body || cfg.message || ''), contact, ctx.tenant),
      });
      return { log: `send_email → ${to} (${res.ok ? 'sent' : 'failed'})` };
    }

    case 'send_sms': {
      const to = String(contact?.phone || '');
      if (!to) return { log: 'send_sms skipped — contact has no phone' };
      const res = await safeSendSMS(env, to, renderTemplate(String(cfg.message || ''), contact, ctx.tenant));
      return { log: `send_sms → ${to} (${res.ok ? 'sent' : 'failed'})` };
    }

    case 'add_tag': {
      if (!contact || !env.DB) return { log: 'add_tag skipped' };
      const tags = safeJson<string[]>(contact.tags, []);
      const tag = String(cfg.tag || '');
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        await env.DB.prepare('UPDATE contacts SET tags = ?, updated_at = ? WHERE id = ? AND tenant_id = ?')
          .bind(JSON.stringify(tags), nowIso(), contact.id, ctx.tenantId).run();
      }
      return { log: `add_tag ${tag}` };
    }

    case 'create_task': {
      if (!env.DB) return { log: 'create_task skipped' };
      await env.DB.prepare(
        `INSERT INTO tasks (id, tenant_id, title, description, contact_id, priority, status, source, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'To-Do', 'workflow', '[]', ?, ?)`,
      ).bind(uuid(), ctx.tenantId, renderTemplate(String(cfg.taskName || cfg.title || 'Workflow task'), contact, ctx.tenant),
        renderTemplate(String(cfg.description || ''), contact, ctx.tenant),
        contact?.id || null, String(cfg.priority || 'medium'), nowIso(), nowIso()).run();
      return { log: `create_task "${renderTemplate(String(cfg.taskName || cfg.title || 'Workflow task'), contact, ctx.tenant)}"` };
    }

    case 'webhook': {
      const url = String(cfg.url || '');
      if (!url) return { log: 'webhook skipped — no url' };
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact, tenantId: ctx.tenantId, at: nowIso() }),
        });
        return { log: `webhook ${url} → ${res.status}` };
      } catch (e) {
        return { log: `webhook ${url} → error ${String(e).slice(0, 80)}` };
      }
    }

    default:
      return { log: `unsupported action "${type}" — skipped` };
  }
}

/**
 * CRON TICK — drains due campaign recipients and advances due workflow runs.
 * Auth: `X-Cron-Secret: $CRON_SECRET` header, or an authenticated admin session.
 * Wire it to a Cloudflare Cron Trigger / any scheduler hitting POST /api/cron/tick.
 */
async function cronTick(env: Env, request: Request) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const secret = request.headers.get('X-Cron-Secret') || '';
  const authorized = (env.CRON_SECRET && secret === env.CRON_SECRET) || !!(await auth(env, request));
  if (!authorized) return json({ ok: false, error: 'unauthenticated', hint: 'Send X-Cron-Secret or a bearer session' }, 401);

  const now = nowIso();
  const BATCH = 50;
  const result = { campaignsSent: 0, campaignsFailed: 0, workflowsAdvanced: 0, workflowsCompleted: 0 };

  /* ── campaigns ── */
  const due = await env.DB.prepare(
    `SELECT * FROM campaign_recipients WHERE status = 'queued' AND scheduled_at <= ? ORDER BY scheduled_at LIMIT ?`,
  ).bind(now, BATCH).all<Record<string, unknown>>();

  for (const r of due.results || []) {
    const campaign = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(r.campaign_id).first<Record<string, unknown>>();
    const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(r.tenant_id).first<Record<string, unknown>>() || {};
    const contact = r.contact_id
      ? await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(r.contact_id).first<Record<string, unknown>>()
      : null;

    let ok = false; let error = ''; let providerId = '';
    try {
      if (!campaign) {
        error = 'campaign_deleted';
      } else if (r.channel === 'email') {
        const res = await safeSendEmail(env, {
          to: String(r.address),
          subject: renderTemplate(String(campaign.subject || campaign.name || 'Update'), contact, tenant),
          text: renderTemplate(String(campaign.content || ''), contact, tenant),
        });
        ok = res.ok; error = ok ? '' : JSON.stringify(res.body).slice(0, 300);
      } else {
        const res = await safeSendSMS(env, String(r.address), renderTemplate(String(campaign.content || ''), contact, tenant));
        ok = res.ok; providerId = String(res.body?.sid || ''); error = ok ? '' : JSON.stringify(res.body).slice(0, 300);
      }
    } catch (e) {
      ok = false; error = String(e).slice(0, 300);
    }

    await env.DB.prepare('UPDATE campaign_recipients SET status = ?, sent_at = ?, error = ?, provider_id = ? WHERE id = ?')
      .bind(ok ? 'sent' : 'failed', now, error, providerId, r.id).run();
    await env.DB.prepare(
      `UPDATE campaign_runs SET status = 'sending', started_at = COALESCE(started_at, ?), sent = sent + ?, failed = failed + ? WHERE id = ?`,
    ).bind(now, ok ? 1 : 0, ok ? 0 : 1, r.run_id).run();
    if (ok) {
      result.campaignsSent++;
      await bumpUsage(env, String(r.tenant_id), r.channel === 'email' ? 'emails' : 'sms', 1);
    } else result.campaignsFailed++;
  }

  // Close finished runs and roll counters onto the campaign record.
  const openRuns = await env.DB.prepare(`SELECT * FROM campaign_runs WHERE status IN ('scheduled','sending')`).all<Record<string, unknown>>();
  for (const run of openRuns.results || []) {
    const remaining = await env.DB.prepare(`SELECT COUNT(*) AS n FROM campaign_recipients WHERE run_id = ? AND status = 'queued'`)
      .bind(run.id).first<Record<string, unknown>>();
    if (Number(remaining?.n || 0) === 0 && Number(run.total || 0) > 0) {
      await env.DB.prepare(`UPDATE campaign_runs SET status = 'complete', completed_at = ? WHERE id = ?`).bind(now, run.id).run();
      await env.DB.prepare(
        `UPDATE campaigns SET status = 'sent', sent_at = ?, sent_count = ?, updated_at = ? WHERE id = ?`,
      ).bind(now, Number(run.sent || 0), now, run.campaign_id).run();
    }
  }

  /* ── workflows ── */
  const runs = await env.DB.prepare(
    `SELECT * FROM workflow_runs WHERE status IN ('active','waiting') AND (next_run_at IS NULL OR next_run_at <= ?) ORDER BY next_run_at LIMIT ?`,
  ).bind(now, BATCH).all<Record<string, unknown>>();

  for (const run of runs.results || []) {
    const wf = await env.DB.prepare('SELECT * FROM workflows WHERE id = ?').bind(run.workflow_id).first<Record<string, unknown>>();
    if (!wf || Number(wf.is_active) === 0) {
      await env.DB.prepare(`UPDATE workflow_runs SET status = 'cancelled', updated_at = ? WHERE id = ?`).bind(now, run.id).run();
      continue;
    }
    const actions = safeJson<Record<string, any>[]>(wf.actions, []);
    const idx = Number(run.step_index || 0);
    if (idx >= actions.length) {
      await env.DB.prepare(`UPDATE workflow_runs SET status = 'complete', updated_at = ? WHERE id = ?`).bind(now, run.id).run();
      result.workflowsCompleted++;
      continue;
    }

    const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(run.tenant_id).first<Record<string, unknown>>() || {};
    const contact = run.contact_id
      ? await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(run.contact_id).first<Record<string, unknown>>()
      : null;

    let outcome: { log: string; delayMinutes?: number };
    try {
      outcome = await runWorkflowAction(env, actions[idx], { tenantId: String(run.tenant_id), contact, tenant });
    } catch (e) {
      outcome = { log: `action error: ${String(e).slice(0, 120)}` };
    }
    const log = safeJson<string[]>(run.log, []);
    log.push(`${now} · step ${idx + 1}/${actions.length} · ${outcome.log}`);

    const nextIndex = idx + 1;
    const finished = nextIndex >= actions.length;
    const nextAt = outcome.delayMinutes
      ? new Date(Date.now() + outcome.delayMinutes * 60_000).toISOString()
      : now;

    await env.DB.prepare(
      `UPDATE workflow_runs SET step_index = ?, status = ?, next_run_at = ?, log = ?, updated_at = ? WHERE id = ?`,
    ).bind(nextIndex, finished ? 'complete' : (outcome.delayMinutes ? 'waiting' : 'active'), nextAt, JSON.stringify(log.slice(-50)), now, run.id).run();

    result.workflowsAdvanced++;
    if (finished) result.workflowsCompleted++;
  }

  /* ── daily compliance sweep (once per tenant per 20h) ── */
  let complianceRuns = 0;
  const tenants = await env.DB.prepare('SELECT id FROM tenants').all<Record<string, unknown>>();
  for (const tn of tenants.results || []) {
    const last = await env.DB.prepare('SELECT started_at FROM compliance_runs WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 1')
      .bind(tn.id).first<Record<string, unknown>>();
    const dueAt = last?.started_at ? new Date(String(last.started_at)).getTime() + 20 * 3_600_000 : 0;
    if (Date.now() >= dueAt) {
      try {
        const sweep = await runComplianceSweep(env, String(tn.id), 'cron');
        complianceRuns++;
        await sendComplianceDigest(env, String(tn.id), sweep);
      } catch { /* keep the tick alive */ }
    }
  }

  // housekeeping: expire stale signing links, purge dead sessions
  let expiredSignatures = 0;
  try {
    const res = await env.DB.prepare(
      `UPDATE signature_requests SET status = 'expired', updated_at = ? WHERE status IN ('sent','viewed') AND expires_at < ?`,
    ).bind(now, now).run();
    expiredSignatures = Number((res as any)?.meta?.changes || 0);
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(new Date(Date.now() - 7 * 86400000).toISOString()).run();
    await env.DB.prepare('DELETE FROM portal_tokens WHERE expires_at < ?').bind(new Date(Date.now() - 86400000).toISOString()).run();
  } catch { /* housekeeping is best-effort */ }

  return json({ ok: true, at: now, ...result, complianceRuns, expiredSignatures });
}

/* ══════════════ CLIENT PORTAL — passwordless magic-link access ══════════════ */

const PORTAL_LINK_TTL_MIN = 30;
const PORTAL_SESSION_TTL_H = 12;

async function portalRequestLink(env: Env, request: Request, body: Record<string, unknown>) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const email = String(body.email || '').trim().toLowerCase();
  const tenantId = String(body.tenantId || '').trim();
  if (!email) return bad('email_required');

  let query = 'SELECT * FROM contacts WHERE lower(email) = ?';
  const binds: unknown[] = [email];
  if (tenantId) { query += ' AND tenant_id = ?'; binds.push(tenantId); }
  const contact = await env.DB.prepare(query).bind(...binds).first<Record<string, unknown>>();

  // Always answer 200 — never leak whether an address is on file.
  if (!contact) return json({ ok: true, sent: true });

  const token = randHex(32);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO portal_tokens (id, tenant_id, contact_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(uuid(), contact.tenant_id, contact.id, await sha256(token),
    new Date(now + PORTAL_LINK_TTL_MIN * 60_000).toISOString(), nowIso()).run();

  const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(contact.tenant_id).first<Record<string, unknown>>() || {};
  const base = env.PORTAL_BASE_URL || new URL(request.url).origin;
  const link = `${base}/#/portal?token=${token}`;

  const mail = await safeSendEmail(env, {
    to: email,
    subject: `Your secure document portal link — ${tenant.business_name || tenant.name || 'Tax Pro Hub'}`,
    text: `Hello ${contact.first_name || ''},\n\nUse this secure link to open your client portal. It expires in ${PORTAL_LINK_TTL_MIN} minutes and can only be used once:\n\n${link}\n\nIf you didn't request it, ignore this email.\n\n${tenant.business_name || tenant.name || ''}`,
  });

  await audit(env, { tenantId: String(contact.tenant_id), action: 'portal.link_requested', resource: 'contacts', resourceId: String(contact.id), details: { delivered: mail.ok }, request });
  // `delivered` tells the operator whether the mail provider accepted it; the
  // response never reveals whether the address exists.
  return json({ ok: true, sent: true, delivered: mail.ok });
}

async function portalVerify(env: Env, request: Request, body: Record<string, unknown>) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const token = String(body.token || '');
  if (!token) return bad('token_required');

  const hash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT * FROM portal_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
  ).bind(hash, nowIso()).first<Record<string, unknown>>();
  if (!row) return json({ ok: false, error: 'invalid_or_expired_link' }, 401);

  await env.DB.prepare('UPDATE portal_tokens SET used_at = ? WHERE id = ?').bind(nowIso(), row.id).run();

  const sessionToken = randHex(32);
  await env.DB.prepare(
    `INSERT INTO portal_sessions (id, tenant_id, contact_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(uuid(), row.tenant_id, row.contact_id, await sha256(sessionToken),
    new Date(Date.now() + PORTAL_SESSION_TTL_H * 3_600_000).toISOString(), nowIso()).run();

  await audit(env, { tenantId: String(row.tenant_id), action: 'portal.login', resource: 'contacts', resourceId: String(row.contact_id), request });
  return json({ ok: true, token: sessionToken, expiresInHours: PORTAL_SESSION_TTL_H });
}

async function portalAuth(env: Env, request: Request) {
  if (!env.DB) return null;
  const token = tokenFromRequest(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT * FROM portal_sessions WHERE token_hash = ? AND expires_at > ?`,
  ).bind(await sha256(token), nowIso()).first<Record<string, unknown>>();
  if (!row) return null;
  const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(row.contact_id).first<Record<string, unknown>>();
  if (!contact) return null;
  return { tenantId: String(row.tenant_id), contact };
}

async function portalMe(env: Env, request: Request) {
  const p = await portalAuth(env, request);
  if (!p) return json({ ok: false, error: 'unauthenticated' }, 401);
  const tenant = await env.DB!.prepare('SELECT * FROM tenants WHERE id = ?').bind(p.tenantId).first<Record<string, unknown>>() || {};
  const deals = await env.DB!.prepare('SELECT id, name, stage_id, value, updated_at FROM deals WHERE contact_id = ? AND tenant_id = ?')
    .bind(p.contact.id, p.tenantId).all<Record<string, unknown>>();
  const appts = await env.DB!.prepare(
    'SELECT id, title, start_time, status, location FROM appointments WHERE contact_id = ? AND tenant_id = ? ORDER BY start_time',
  ).bind(p.contact.id, p.tenantId).all<Record<string, unknown>>();
  const files = await env.DB!.prepare('SELECT * FROM files WHERE contact_id = ? AND tenant_id = ? ORDER BY created_at DESC')
    .bind(p.contact.id, p.tenantId).all<Record<string, unknown>>();

  const invoices = await env.DB!.prepare(
    `SELECT id, number, description, amount_cents, status, due_at, checkout_url, paid_at FROM invoices
     WHERE contact_id = ? AND tenant_id = ? ORDER BY created_at DESC`,
  ).bind(p.contact.id, p.tenantId).all<Record<string, unknown>>();
  const signatures = await env.DB!.prepare(
    `SELECT id, title, doc_type, status, expires_at, signed_at FROM signature_requests
     WHERE contact_id = ? AND tenant_id = ? ORDER BY created_at DESC`,
  ).bind(p.contact.id, p.tenantId).all<Record<string, unknown>>();

  return json({
    ok: true,
    invoices: invoices.results || [],
    signatures: signatures.results || [],
    contact: {
      id: p.contact.id, firstName: p.contact.first_name, lastName: p.contact.last_name,
      email: p.contact.email, phone: p.contact.phone, status: p.contact.status,
    },
    practice: { name: tenant.business_name || tenant.name, email: tenant.email, phone: tenant.phone, colors: safeJson(tenant.colors, {}) },
    deals: deals.results || [],
    appointments: appts.results || [],
    files: (files.results || []).map(fileRowToPayload),
  });
}

/** Client-side upload straight into the tenant's R2 vault, tagged to the contact. */
async function portalUpload(env: Env, request: Request) {
  const p = await portalAuth(env, request);
  if (!p) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DOCS || !env.DB) return notConfigured('r2_document_vault', ['npm run cf:setup creates the R2 bucket']);

  const form = await request.formData();
  const f = form.get('file');
  if (!(f instanceof File)) return bad('file_field_required');
  if (f.size > MAX_UPLOAD_BYTES) return bad('file_too_large_max_50mb', 413);

  const bytes = new Uint8Array(await f.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = uuid();
  const safeName = (f.name || 'upload.bin').replace(/[^\w.\- ]+/g, '_').slice(0, 180);
  const key = `tenants/${p.tenantId}/${id}/${safeName}`;

  await env.DOCS.put(key, bytes, {
    httpMetadata: { contentType: f.type || 'application/octet-stream' },
    customMetadata: { tenantId: p.tenantId, contactId: String(p.contact.id), sha256: checksum, source: 'client-portal' },
  });
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO files (id, tenant_id, contact_id, name, folder, doc_type, content_type, size, r2_key, sha256, uploaded_by, status, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'Client Uploads', ?, ?, ?, ?, ?, ?, 'stored', ?, ?, ?)`,
  ).bind(id, p.tenantId, p.contact.id, safeName, String(form.get('docType') || 'Client Upload'),
    f.type || 'application/octet-stream', f.size, key, checksum, `portal:${p.contact.id}`,
    JSON.stringify({ source: 'client-portal' }), now, now).run();

  await audit(env, { tenantId: p.tenantId, action: 'portal.upload', resource: 'files', resourceId: id, details: { name: safeName, size: f.size }, request });
  const row = await env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(id).first<Record<string, unknown>>();
  return json({ ok: true, item: row ? fileRowToPayload(row) : { id, name: safeName } }, 201);
}

async function portalDownload(env: Env, request: Request, id: string) {
  const p = await portalAuth(env, request);
  if (!p) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DOCS || !env.DB) return notConfigured('r2_document_vault', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM files WHERE id = ? AND tenant_id = ? AND contact_id = ?')
    .bind(id, p.tenantId, p.contact.id).first<Record<string, unknown>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  const obj = await env.DOCS.get(String(row.r2_key));
  if (!obj) return json({ ok: false, error: 'object_missing_in_r2' }, 410);
  return new Response(obj.body, {
    headers: {
      'Content-Type': String(row.content_type || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename="${String(row.name).replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}


/* ═════════════ COMPLIANCE COMMAND CENTER — chief + 20 specialists ═════════════
 * Every agent runs a real query against the tenant's own D1 records and emits
 * deterministic findings (stable `fingerprint` → dedupe + auto-resolve).
 * The chief orchestrator runs the roster, scores the practice and writes a run
 * record. Nothing here is simulated: an empty practice scores 100 with 0 findings.
 */

interface Finding {
  fingerprint: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  entityType?: string;
  entityId?: string;
  remediation: string;
  deepLink?: string;
}

interface AgentDef {
  key: string;
  name: string;
  domain: string;
  authority: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  run: (db: D1Database, tenantId: string, env: Env) => Promise<Finding[]>;
}

const all = async (db: D1Database, sql: string, ...binds: unknown[]) =>
  ((await db.prepare(sql).bind(...binds).all<Record<string, any>>()).results || []);

const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const YEARS = (n: number) => new Date(Date.now() - n * 365.25 * 86400000).toISOString();

const COMPLIANCE_AGENTS: AgentDef[] = [
  {
    key: 'circular230',
    name: 'Circular 230 Practice Standards',
    domain: 'Practitioner conduct',
    authority: '31 CFR Part 10 (Treasury Circular 230)',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, circular230_status, status FROM preparers WHERE tenant_id = ?`, t);
      return rows.filter((p) => p.status === 'active' && p.circular230_status !== 'verified').map((p) => ({
        fingerprint: `circular230:unverified:${p.id}`,
        severity: 'high' as const,
        title: `${p.first_name} ${p.last_name} is not Circular 230 verified`,
        detail: `Active preparer with circular230_status="${p.circular230_status || 'unset'}". Practitioners must satisfy Circular 230 duties before representing taxpayers.`,
        entityType: 'preparer', entityId: String(p.id),
        remediation: 'Confirm credentials (EA/CPA/attorney/AFSP) and set Circular 230 status to verified on the preparer record.',
        deepLink: `#/preparers/${p.id}`,
      }));
    },
  },
  {
    key: 'ptin_efin',
    name: 'PTIN / EFIN Registration',
    domain: 'Preparer registration',
    authority: 'IRC §6109(a)(4); Rev. Proc. 2010-41; Pub 3112',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, ptin, efin, role, status FROM preparers WHERE tenant_id = ?`, t);
      const out: Finding[] = [];
      for (const p of rows) {
        if (p.status !== 'active') continue;
        const ptin = String(p.ptin || '');
        if (!ptin) {
          out.push({
            fingerprint: `ptin:missing:${p.id}`, severity: 'critical',
            title: `${p.first_name} ${p.last_name} has no PTIN on file`,
            detail: 'Anyone paid to prepare federal returns must hold a current PTIN.',
            entityType: 'preparer', entityId: String(p.id),
            remediation: 'Record the preparer’s current-year PTIN (format P########).',
            deepLink: `#/preparers/${p.id}`,
          });
        } else if (!/^P\d{8}$/.test(ptin)) {
          out.push({
            fingerprint: `ptin:malformed:${p.id}`, severity: 'medium',
            title: `PTIN format looks invalid for ${p.first_name} ${p.last_name}`,
            detail: `Stored value "${ptin}" does not match the P######## pattern.`,
            entityType: 'preparer', entityId: String(p.id),
            remediation: 'Correct the PTIN on the preparer record.',
            deepLink: `#/preparers/${p.id}`,
          });
        }
      }
      const efinHolders = rows.filter((p) => String(p.efin || '').length > 0);
      if (rows.length > 0 && efinHolders.length === 0) {
        out.push({
          fingerprint: 'efin:none-on-file', severity: 'high',
          title: 'No EFIN recorded for the practice',
          detail: 'E-filing more than 10 returns requires an Electronic Filing Identification Number.',
          remediation: 'Add the firm’s EFIN to the responsible official’s preparer record.',
          deepLink: '#/preparers',
        });
      }
      return out;
    },
  },
  {
    key: 'ce_credits',
    name: 'Continuing Education Tracking',
    domain: 'Credential maintenance',
    authority: 'Circular 230 §10.6(e); AFSP Rev. Proc. 2014-42',
    cadence: 'weekly',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, ce_credits, role, status FROM preparers WHERE tenant_id = ?`, t);
      return rows.filter((p) => p.status === 'active' && Number(p.ce_credits || 0) < 15).map((p) => ({
        fingerprint: `ce:below-threshold:${p.id}`,
        severity: Number(p.ce_credits || 0) === 0 ? ('high' as const) : ('medium' as const),
        title: `${p.first_name} ${p.last_name} is below the CE threshold (${Number(p.ce_credits || 0)} hrs)`,
        detail: 'AFSP requires 18 hours; EAs require 72 hours over three years with a 16-hour annual minimum. 15 hours is the platform warning floor.',
        entityType: 'preparer', entityId: String(p.id),
        remediation: 'Log completed CE certificates and update the preparer’s credit total before filing season.',
        deepLink: `#/preparers/${p.id}`,
      }));
    },
  },
  {
    key: 'wisp_4557',
    name: 'WISP — Written Information Security Plan',
    domain: 'Data security plan',
    authority: 'IRS Pub 4557; FTC Safeguards Rule 16 CFR 314',
    cadence: 'monthly',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, created_at FROM files WHERE tenant_id = ? AND (lower(name) LIKE '%wisp%' OR lower(doc_type) LIKE '%wisp%' OR lower(name) LIKE '%security plan%')`, t);
      if (rows.length === 0) {
        return [{
          fingerprint: 'wisp:missing', severity: 'critical',
          title: 'No Written Information Security Plan on file',
          detail: 'Every paid preparer must create, maintain and follow a WISP. Absence is an FTC Safeguards violation and blocks PTIN renewal attestation.',
          remediation: 'Upload the signed WISP to the document vault (name it "WISP <year>").',
          deepLink: '#/documents',
        }];
      }
      const newest = rows.map((r) => String(r.created_at)).sort().pop()!;
      if (newest < YEARS(1)) {
        return [{
          fingerprint: 'wisp:stale', severity: 'high',
          title: 'WISP has not been reviewed in over 12 months',
          detail: `Most recent WISP document dates from ${new Date(newest).toLocaleDateString()}. Annual review and update is required.`,
          remediation: 'Review, re-date and re-upload the WISP; record the review in the vault.',
          deepLink: '#/documents',
        }];
      }
      return [];
    },
  },
  {
    key: 'glba_safeguards',
    name: 'GLBA Safeguards Controls',
    domain: 'Technical safeguards',
    authority: 'Gramm-Leach-Bliley Act; 16 CFR 314.4',
    cadence: 'daily',
    run: async (_db, _t, env) => {
      const out: Finding[] = [];
      if (!env.SESSION_SECRET) out.push({
        fingerprint: 'glba:no-session-pepper', severity: 'high',
        title: 'Password hashing pepper (SESSION_SECRET) is not configured',
        detail: 'Safeguards Rule requires encryption of customer information and secure authentication. Without SESSION_SECRET, password hashes lack a server-side pepper.',
        remediation: 'wrangler pages secret put SESSION_SECRET (long random value), then redeploy.',
        deepLink: '#/settings',
      });
      if (!env.DOCS) out.push({
        fingerprint: 'glba:no-encrypted-vault', severity: 'high',
        title: 'Encrypted document vault (R2) is not provisioned',
        detail: 'Client documents must be stored with access controls and encryption at rest.',
        remediation: 'Run npm run cf:setup to create the R2 bucket and bind it as DOCS.',
        deepLink: '#/settings',
      });
      return out;
    },
  },
  {
    key: 'engagement_letters',
    name: 'Engagement Letter Coverage',
    domain: 'Client agreements',
    authority: 'AICPA SSTS No. 1; malpractice-carrier requirement',
    cadence: 'daily',
    run: async (db, t) => {
      const deals = await all(db, `SELECT d.id, d.name, d.contact_id, d.stage_id, d.value FROM deals d WHERE d.tenant_id = ? AND d.value > 0`, t);
      const out: Finding[] = [];
      for (const d of deals) {
        if (!d.contact_id) continue;
        const letters = await all(db, `SELECT id FROM files WHERE tenant_id = ? AND contact_id = ? AND (lower(name) LIKE '%engagement%' OR lower(doc_type) LIKE '%engagement%')`, t, d.contact_id);
        if (letters.length === 0) {
          out.push({
            fingerprint: `engagement:missing:${d.id}`, severity: 'high',
            title: `No engagement letter for "${d.name}"`,
            detail: `Billable engagement worth $${Number(d.value || 0).toLocaleString()} has no signed engagement letter in the vault.`,
            entityType: 'deal', entityId: String(d.id),
            remediation: 'Generate and countersign the engagement letter, then upload it against the client record.',
            deepLink: `#/contacts/${d.contact_id}`,
          });
        }
      }
      return out;
    },
  },
  {
    key: 'due_diligence_8867',
    name: 'Refundable Credit Due Diligence',
    domain: 'EITC / CTC / AOTC / HOH',
    authority: 'IRC §6695(g); Form 8867; Treas. Reg. §1.6695-2',
    cadence: 'daily',
    run: async (db, t) => {
      const deals = await all(db, `SELECT id, name, contact_id, tags FROM deals WHERE tenant_id = ?`, t);
      const flagged = deals.filter((d) => /eitc|ctc|aotc|hoh|head of household|child tax/i.test(String(d.tags || '') + ' ' + String(d.name || '')));
      const out: Finding[] = [];
      for (const d of flagged) {
        const docs = await all(db, `SELECT id FROM files WHERE tenant_id = ? AND contact_id = ? AND (lower(name) LIKE '%8867%' OR lower(doc_type) LIKE '%8867%' OR lower(name) LIKE '%due diligence%')`, t, d.contact_id);
        if (docs.length === 0) {
          out.push({
            fingerprint: `8867:missing:${d.id}`, severity: 'critical',
            title: `Form 8867 checklist missing for "${d.name}"`,
            detail: 'Refundable-credit returns require a completed Form 8867 and retained substantiation. Penalty is $600 per credit per return (indexed).',
            entityType: 'deal', entityId: String(d.id),
            remediation: 'Complete Form 8867, retain the substantiating documents, and upload both to the client vault.',
            deepLink: `#/contacts/${d.contact_id}`,
          });
        }
      }
      return out;
    },
  },
  {
    key: 'tcpa_sms',
    name: 'TCPA / SMS Consent',
    domain: 'Outbound messaging',
    authority: '47 U.S.C. §227; 47 CFR 64.1200; CTIA guidelines',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, phone, tags FROM contacts WHERE tenant_id = ? AND phone IS NOT NULL AND phone != ''`, t);
      const unconsented = rows.filter((c) => !/consent|opt-?in|sms-ok/i.test(String(c.tags || '')));
      if (unconsented.length === 0) return [];
      return [{
        fingerprint: 'tcpa:missing-consent-cohort', severity: 'high',
        title: `${unconsented.length} contact${unconsented.length === 1 ? '' : 's'} have a phone number but no recorded SMS consent`,
        detail: 'Prior express written consent is required before sending marketing SMS. Statutory damages run $500–$1,500 per message.',
        entityType: 'contacts', entityId: unconsented.slice(0, 25).map((c) => c.id).join(','),
        remediation: 'Capture opt-in through a form or portal checkbox and tag the contact "SMS-Consent" before including them in SMS campaigns.',
        deepLink: '#/contacts',
      }];
    },
  },
  {
    key: 'can_spam',
    name: 'CAN-SPAM Email Requirements',
    domain: 'Email marketing',
    authority: '15 U.S.C. §7704; 16 CFR Part 316',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, type, content FROM campaigns WHERE tenant_id = ? AND type IN ('email','both')`, t);
      const out: Finding[] = [];
      for (const c of rows) {
        const body = String(c.content || '').toLowerCase();
        const missing: string[] = [];
        if (!/unsubscribe|opt.?out|manage preferences/.test(body)) missing.push('unsubscribe mechanism');
        if (!/\b\d{1,6}\s+[\w.]+\s+(st|street|ave|avenue|rd|road|blvd|hwy|nm|suite|ste)\b/i.test(String(c.content || ''))) missing.push('physical postal address');
        if (missing.length) {
          out.push({
            fingerprint: `canspam:${c.id}`, severity: 'high',
            title: `Campaign "${c.name}" is missing ${missing.join(' and ')}`,
            detail: 'Every commercial email must include a clear opt-out mechanism and the sender’s valid physical postal address. Penalties reach $53,088 per email.',
            entityType: 'campaign', entityId: String(c.id),
            remediation: 'Add an unsubscribe link and the firm’s mailing address to the campaign footer before sending.',
            deepLink: `#/campaigns/${c.id}`,
          });
        }
      }
      return out;
    },
  },
  {
    key: 'croa_credit_repair',
    name: 'CROA Credit-Repair Disclosures',
    domain: 'Credit repair services',
    authority: 'Credit Repair Organizations Act, 15 U.S.C. §1679',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, contact_id, tags, croa_disclosure_sent, cancellation_window_status FROM deals WHERE tenant_id = ?`, t);
      const credit = rows.filter((d) => /credit|dispute|croa|score/i.test(String(d.tags || '') + ' ' + String(d.name || '')));
      const out: Finding[] = [];
      for (const d of credit) {
        if (!Number(d.croa_disclosure_sent)) out.push({
          fingerprint: `croa:disclosure:${d.id}`, severity: 'critical',
          title: `CROA disclosure not sent for "${d.name}"`,
          detail: '"Consumer Credit File Rights Under State and Federal Law" must be delivered in writing before any contract is signed. Contracts without it are void.',
          entityType: 'deal', entityId: String(d.id),
          remediation: 'Send the CROA disclosure statement, obtain the signed acknowledgment, and mark the disclosure flag on the deal.',
          deepLink: `#/credit-repair`,
        });
        if (!String(d.cancellation_window_status || '')) out.push({
          fingerprint: `croa:cancellation:${d.id}`, severity: 'high',
          title: `3-day cancellation window not tracked for "${d.name}"`,
          detail: 'Consumers may cancel without penalty within 3 business days; no fee may be collected before services are fully performed.',
          entityType: 'deal', entityId: String(d.id),
          remediation: 'Record the cancellation-window status and hold billing until it closes.',
          deepLink: `#/credit-repair`,
        });
      }
      return out;
    },
  },
  {
    key: 'boi_fincen',
    name: 'Beneficial Ownership (BOI) Reporting',
    domain: 'Entity clients',
    authority: 'Corporate Transparency Act; 31 CFR 1010.380',
    cadence: 'weekly',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, company, tags FROM contacts WHERE tenant_id = ? AND company IS NOT NULL AND company != ''`, t);
      const entities = rows.filter((c) => /llc|inc|corp|ltd|lp\b|pllc/i.test(String(c.company || '')));
      const untracked = entities.filter((c) => !/boi|fincen|beneficial/i.test(String(c.tags || '')));
      if (!untracked.length) return [];
      return [{
        fingerprint: 'boi:untracked-cohort', severity: 'medium',
        title: `${untracked.length} entity client${untracked.length === 1 ? '' : 's'} have no BOI reporting status`,
        detail: 'Reporting companies must file beneficial ownership information with FinCEN. Track filing status even when the firm does not prepare the report.',
        entityType: 'contacts', entityId: untracked.slice(0, 25).map((c) => c.id).join(','),
        remediation: 'Tag each entity client with BOI-Filed, BOI-Exempt or BOI-Pending after confirming its status.',
        deepLink: '#/contacts',
      }];
    },
  },
  {
    key: 'data_retention',
    name: 'Records Retention Schedule',
    domain: 'Document lifecycle',
    authority: 'IRC §6107(b); Pub 4557 retention guidance',
    cadence: 'weekly',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, created_at FROM files WHERE tenant_id = ? AND created_at < ?`, t, YEARS(7));
      if (!rows.length) return [];
      return [{
        fingerprint: 'retention:past-schedule', severity: 'medium',
        title: `${rows.length} document${rows.length === 1 ? '' : 's'} exceed the 7-year retention schedule`,
        detail: 'Records past their retention period should be securely destroyed unless a legal hold applies — retaining PII longer than necessary increases breach exposure.',
        entityType: 'files', entityId: rows.slice(0, 25).map((r) => r.id).join(','),
        remediation: 'Review the listed documents, apply legal holds where required, and securely delete the remainder from the vault.',
        deepLink: '#/documents',
      }];
    },
  },
  {
    key: 'pii_exposure',
    name: 'PII / SSN Exposure Scanner',
    domain: 'Sensitive data hygiene',
    authority: 'FTC Safeguards Rule; state breach statutes',
    cadence: 'daily',
    run: async (db, t) => {
      const out: Finding[] = [];
      const contacts = await all(db, `SELECT id, first_name, last_name, notes, custom_fields FROM contacts WHERE tenant_id = ?`, t);
      for (const c of contacts) {
        const blob = `${c.notes || ''} ${c.custom_fields || ''}`;
        if (SSN_RE.test(blob)) out.push({
          fingerprint: `pii:ssn-in-notes:${c.id}`, severity: 'critical',
          title: `Possible SSN stored in free-text notes for ${c.first_name} ${c.last_name}`,
          detail: 'Taxpayer identification numbers must not live in unstructured notes; they belong in encrypted document storage or a masked field.',
          entityType: 'contact', entityId: String(c.id),
          remediation: 'Remove the identifier from notes and store the source document in the encrypted vault instead.',
          deepLink: `#/contacts/${c.id}`,
        });
      }
      const campaigns = await all(db, `SELECT id, name, content FROM campaigns WHERE tenant_id = ?`, t);
      for (const c of campaigns) {
        if (SSN_RE.test(String(c.content || ''))) out.push({
          fingerprint: `pii:ssn-in-campaign:${c.id}`, severity: 'critical',
          title: `Possible SSN inside campaign "${c.name}"`,
          detail: 'Marketing content containing taxpayer identifiers would transmit PII in cleartext email/SMS.',
          entityType: 'campaign', entityId: String(c.id),
          remediation: 'Strip the identifier from the campaign body immediately and rotate any exposed data.',
          deepLink: `#/campaigns/${c.id}`,
        });
      }
      return out;
    },
  },
  {
    key: 'efile_security',
    name: 'E-file Security Six',
    domain: 'Endpoint & transmission security',
    authority: 'IRS Security Summit "Security Six"; Pub 4557',
    cadence: 'monthly',
    run: async (db, t, env) => {
      const out: Finding[] = [];
      if (!env.LEDGER) out.push({
        fingerprint: 'efile:no-audit-ledger', severity: 'medium',
        title: 'Durable audit ledger (KV) not bound',
        detail: 'Security Six requires activity logging that survives application restarts.',
        remediation: 'Bind the LEDGER KV namespace via npm run cf:setup.',
        deepLink: '#/settings',
      });
      const keys = await all(db, `SELECT id, created_at FROM api_keys WHERE tenant_id = ?`, t);
      const stale = keys.filter((k) => String(k.created_at) < YEARS(1));
      if (stale.length) out.push({
        fingerprint: 'efile:stale-api-keys', severity: 'medium',
        title: `${stale.length} API key${stale.length === 1 ? '' : 's'} older than 12 months`,
        detail: 'Long-lived credentials should be rotated at least annually.',
        entityType: 'api_keys', entityId: stale.map((k) => k.id).join(','),
        remediation: 'Rotate the listed API keys and revoke the old values.',
        deepLink: '#/developer',
      });
      return out;
    },
  },
  {
    key: 'aml_form8300',
    name: 'Large Cash / Form 8300',
    domain: 'AML reporting',
    authority: 'IRC §6050I; 31 U.S.C. §5331; Form 8300',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, value, tags FROM deals WHERE tenant_id = ? AND value >= 10000`, t);
      const cash = rows.filter((d) => /cash|wire|money order|cashier/i.test(String(d.tags || '')));
      return cash.filter((d) => !/8300|reported/i.test(String(d.tags || ''))).map((d) => ({
        fingerprint: `aml:8300:${d.id}`, severity: 'high' as const,
        title: `Form 8300 may be required for "${d.name}"`,
        detail: `Cash-tagged transaction of $${Number(d.value).toLocaleString()} meets or exceeds the $10,000 reporting threshold. Filing is due within 15 days of receipt.`,
        entityType: 'deal', entityId: String(d.id),
        remediation: 'File Form 8300 with FinCEN, notify the payer by January 31, and tag the deal "8300-Reported".',
        deepLink: '#/pipelines',
      }));
    },
  },
  {
    key: 'state_registration',
    name: 'State Preparer Registration',
    domain: 'State licensing',
    authority: 'CA CTEC, NY NYTPRIN, OR Board of Tax Practitioners, MD, CT',
    cadence: 'monthly',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, first_name, last_name, credentials, status FROM preparers WHERE tenant_id = ? AND status = 'active'`, t);
      return rows.filter((p) => {
        const creds = String(p.credentials || '').toUpperCase();
        return !/CTEC|NYTPRIN|OBTP|CPA|EA|ATTORNEY|BAR/.test(creds);
      }).map((p) => ({
        fingerprint: `state:registration:${p.id}`, severity: 'medium' as const,
        title: `${p.first_name} ${p.last_name} has no state registration or federal credential recorded`,
        detail: 'CA, NY, OR, MD and CT require state registration for unenrolled preparers. Record CTEC/NYTPRIN/OBTP numbers or the federal credential that exempts them.',
        entityType: 'preparer', entityId: String(p.id),
        remediation: 'Add the state registration number (or CPA/EA/attorney credential) to the preparer record.',
        deepLink: `#/preparers/${p.id}`,
      }));
    },
  },
  {
    key: 'privacy_notice',
    name: 'Privacy Notice & §7216 Consent',
    domain: 'Disclosure consent',
    authority: 'IRC §7216; Treas. Reg. §301.7216-3; GLBA privacy notice',
    cadence: 'monthly',
    run: async (db, t) => {
      const docs = await all(db, `SELECT id FROM files WHERE tenant_id = ? AND (lower(name) LIKE '%privacy%' OR lower(doc_type) LIKE '%privacy%' OR lower(name) LIKE '%7216%')`, t);
      if (docs.length) return [];
      return [{
        fingerprint: 'privacy:no-notice', severity: 'high',
        title: 'No privacy notice or §7216 consent template on file',
        detail: 'Using or disclosing taxpayer return information for anything beyond preparation requires prior written consent in the §7216 format. A GLBA privacy notice must also be provided annually.',
        remediation: 'Upload the firm privacy notice and the §7216 consent template to the vault, and attach the consent to marketing intake.',
        deepLink: '#/documents',
      }];
    },
  },
  {
    key: 'breach_response',
    name: 'Incident Response Readiness',
    domain: 'Breach preparedness',
    authority: 'FTC Safeguards §314.4(h); IRS Pub 5293',
    cadence: 'monthly',
    run: async (db, t) => {
      const out: Finding[] = [];
      const plan = await all(db, `SELECT id FROM files WHERE tenant_id = ? AND (lower(name) LIKE '%incident%' OR lower(name) LIKE '%breach%' OR lower(doc_type) LIKE '%incident%')`, t);
      if (!plan.length) out.push({
        fingerprint: 'breach:no-plan', severity: 'high',
        title: 'No documented incident response plan',
        detail: 'The Safeguards Rule requires a written incident response plan naming who reports a breach to the IRS Stakeholder Liaison, state agencies and affected clients.',
        remediation: 'Upload the incident response plan (name it "Incident Response Plan <year>").',
        deepLink: '#/documents',
      });
      const fails = await all(db, `SELECT COUNT(*) AS n FROM audit_logs WHERE tenant_id = ? AND action LIKE '%failed%' AND created_at > ?`, t, new Date(Date.now() - 86400000).toISOString());
      const n = Number(fails[0]?.n || 0);
      if (n >= 10) out.push({
        fingerprint: 'breach:auth-anomaly', severity: 'high',
        title: `${n} failed authentication events in the last 24 hours`,
        detail: 'Elevated failure volume can indicate credential stuffing against the practice portal.',
        remediation: 'Review the audit log, rotate exposed credentials and consider enabling IP throttling.',
        deepLink: '#/settings',
      });
      return out;
    },
  },
  {
    key: 'access_review',
    name: 'Least-Privilege Access Review',
    domain: 'Identity governance',
    authority: 'FTC Safeguards §314.4(c)(1); SOC 2 CC6.1',
    cadence: 'monthly',
    run: async (db, t) => {
      const out: Finding[] = [];
      const admins = await all(db, `SELECT id, email, role, created_at FROM users WHERE tenant_id = ? AND role = 'admin'`, t);
      if (admins.length > 3) out.push({
        fingerprint: 'access:too-many-admins', severity: 'medium',
        title: `${admins.length} accounts hold full admin rights`,
        detail: 'Administrative access should be limited to the smallest workable group and reviewed periodically.',
        entityType: 'users', entityId: admins.map((u) => u.id).join(','),
        remediation: 'Downgrade non-essential admins to preparer or staff roles.',
        deepLink: '#/settings',
      });
      const stale = await all(db, `SELECT id, user_id, created_at FROM sessions WHERE tenant_id = ? AND expires_at < ?`, t, nowIso());
      if (stale.length > 50) out.push({
        fingerprint: 'access:stale-sessions', severity: 'low',
        title: `${stale.length} expired sessions have not been purged`,
        detail: 'Expired session rows should be cleared on a schedule to limit residual data.',
        remediation: 'Run the session cleanup (the cron tick prunes them automatically once enabled).',
        deepLink: '#/settings',
      });
      return out;
    },
  },
  {
    key: 'client_portal_security',
    name: 'Client Portal Access Hygiene',
    domain: 'Portal security',
    authority: 'Pub 4557 secure client communication',
    cadence: 'daily',
    run: async (db, t) => {
      const out: Finding[] = [];
      const openTokens = await all(db, `SELECT id, created_at FROM portal_tokens WHERE tenant_id = ? AND used_at IS NULL AND expires_at > ?`, t, nowIso());
      if (openTokens.length > 25) out.push({
        fingerprint: 'portal:token-flood', severity: 'medium',
        title: `${openTokens.length} unused portal sign-in links are outstanding`,
        detail: 'A large pool of live magic links widens the window for interception.',
        remediation: 'Investigate the source of link requests; expire unused links if the volume is unexpected.',
        deepLink: '#/settings',
      });
      const emailless = await all(db, `SELECT COUNT(*) AS n FROM contacts WHERE tenant_id = ? AND (email IS NULL OR email = '')`, t);
      const n = Number(emailless[0]?.n || 0);
      if (n > 0) out.push({
        fingerprint: 'portal:no-email-cohort', severity: 'low',
        title: `${n} client${n === 1 ? '' : 's'} cannot use the secure portal (no email on file)`,
        detail: 'Clients without an email address are likely receiving documents through less secure channels.',
        remediation: 'Collect email addresses so document exchange happens inside the encrypted portal.',
        deepLink: '#/contacts',
      });
      return out;
    },
  },
  {
    key: 'unsecured_delivery',
    name: 'Secure Delivery Enforcement',
    domain: 'Document transmission',
    authority: 'Pub 4557; GLBA §314.4(c)(3)',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, content FROM campaigns WHERE tenant_id = ?`, t);
      const risky = rows.filter((c) => /attach(ed|ment)|see attached|pdf attached/i.test(String(c.content || '')));
      return risky.map((c) => ({
        fingerprint: `delivery:attachment:${c.id}`, severity: 'medium' as const,
        title: `Campaign "${c.name}" references emailed attachments`,
        detail: 'Taxpayer documents should be exchanged through the encrypted portal rather than email attachments.',
        entityType: 'campaign', entityId: String(c.id),
        remediation: 'Replace attachment language with a secure portal link.',
        deepLink: `#/campaigns/${c.id}`,
      }));
    },
  },
  {
    key: 'sla_deadlines',
    name: 'Filing Deadline & SLA Watch',
    domain: 'Engagement timeliness',
    authority: 'Circular 230 §10.22 (diligence as to accuracy)',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, name, days_in_stage, sla_days, contact_id FROM deals WHERE tenant_id = ? AND sla_days > 0`, t);
      return rows.filter((d) => Number(d.days_in_stage || 0) > Number(d.sla_days || 0)).map((d) => ({
        fingerprint: `sla:breach:${d.id}`, severity: 'medium' as const,
        title: `"${d.name}" has exceeded its SLA (${d.days_in_stage}d in stage vs ${d.sla_days}d target)`,
        detail: 'Stalled engagements risk missed deadlines and diligence findings.',
        entityType: 'deal', entityId: String(d.id),
        remediation: 'Advance the engagement or reset expectations with the client in writing.',
        deepLink: '#/pipelines',
      }));
    },
  },
  {
    key: 'audit_trail',
    name: 'Audit Trail Integrity',
    domain: 'Evidence & logging',
    authority: 'SOC 2 CC7.2; Safeguards §314.4(d)',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT COUNT(*) AS n FROM audit_logs WHERE tenant_id = ? AND created_at > ?`, t, new Date(Date.now() - 7 * 86400000).toISOString());
      const writes = await all(db, `SELECT COUNT(*) AS n FROM contacts WHERE tenant_id = ? AND updated_at > ?`, t, new Date(Date.now() - 7 * 86400000).toISOString());
      if (Number(writes[0]?.n || 0) > 0 && Number(rows[0]?.n || 0) === 0) {
        return [{
          fingerprint: 'audit:no-events', severity: 'high',
          title: 'Records changed this week but no audit events were written',
          detail: 'Audit logging appears to be failing, which breaks evidence requirements for breach investigations.',
          remediation: 'Verify the D1 binding and that audit_logs writes are succeeding.',
          deepLink: '#/settings',
        }];
      }
      return [];
    },
  },
  {
    key: 'efile_rejection_aging',
    name: 'E-file Rejection Perfection Window',
    domain: 'Filing lifecycle',
    authority: 'IRS Pub 1345 (5-day perfection period for 1040 rejects)',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, return_type, tax_year, reject_codes, perfection_deadline FROM efile_submissions WHERE tenant_id = ? AND status = 'rejected'`, t);
      return rows.filter((r) => r.perfection_deadline && String(r.perfection_deadline) < new Date(Date.now() + 2 * 86400000).toISOString()).map((r) => ({
        fingerprint: `efile:perfection:${r.id}`,
        severity: (String(r.perfection_deadline) < nowIso() ? 'critical' : 'high') as 'critical' | 'high',
        title: `Rejected ${r.return_type} (TY${r.tax_year}) is at or past its perfection deadline`,
        detail: `Reject codes ${safeJson<string[]>(r.reject_codes, []).join(', ') || 'unspecified'}. After the perfection window closes the return is no longer treated as timely filed when retransmitted.`,
        entityType: 'efile_submission', entityId: String(r.id),
        remediation: 'Correct the reject codes and retransmit, or paper-file with proof of timely e-file attempt.',
        deepLink: '#/efile',
      }));
    },
  },
  {
    key: 'bank_product_disclosures',
    name: 'Bank Product Disclosure Control',
    domain: 'Refund advance / RT',
    authority: 'Truth in Lending (Reg Z); bank program agreements; Circular 230 §10.27',
    cadence: 'daily',
    run: async (db, t) => {
      const rows = await all(db, `SELECT id, product_type, status, disclosure_signed_id FROM bank_products WHERE tenant_id = ?`, t);
      return rows.filter((r) => !r.disclosure_signed_id && ['approved', 'funded', 'settled'].includes(String(r.status))).map((r) => ({
        fingerprint: `bank:disclosure:${r.id}`,
        severity: 'critical' as const,
        title: `${String(r.product_type).replace(/_/g, ' ')} advanced without a signed disclosure on file`,
        detail: 'Fee and APR disclosures must be delivered and acknowledged before a refund-advance or refund-transfer product is funded.',
        entityType: 'bank_product', entityId: String(r.id),
        remediation: 'Obtain the signed disclosure now and attach it to the client record; report the gap to the bank partner if funding already occurred.',
        deepLink: '#/efile',
      }));
    },
  },
  {
    key: 'backup_continuity',
    name: 'Backup & Continuity',
    domain: 'Business continuity',
    authority: 'Safeguards §314.4(h); Pub 4557 continuity guidance',
    cadence: 'weekly',
    run: async (db, t, env) => {
      const out: Finding[] = [];
      if (!env.DOCS) out.push({
        fingerprint: 'continuity:no-object-store', severity: 'high',
        title: 'No durable object store bound for document backups',
        detail: 'Client files must survive a workstation loss.',
        remediation: 'Provision R2 (npm run cf:setup) so documents are stored off-device.',
        deepLink: '#/settings',
      });
      const docCount = await all(db, `SELECT COUNT(*) AS n FROM files WHERE tenant_id = ?`, t);
      const contactCount = await all(db, `SELECT COUNT(*) AS n FROM contacts WHERE tenant_id = ?`, t);
      if (Number(contactCount[0]?.n || 0) >= 10 && Number(docCount[0]?.n || 0) === 0) out.push({
        fingerprint: 'continuity:no-documents', severity: 'medium',
        title: 'Client roster exists but no documents are stored in the vault',
        detail: 'Documents are likely living on local drives or in email, outside backup and access control.',
        remediation: 'Migrate client documents into the encrypted vault.',
        deepLink: '#/documents',
      });
      return out;
    },
  },
];

const SEVERITY_WEIGHT: Record<string, number> = { critical: 12, high: 6, medium: 3, low: 1 };

/** Ensure the 20-agent roster exists for this tenant (idempotent). */
async function ensureComplianceRoster(env: Env, tenantId: string) {
  const now = nowIso();
  const stmt = env.DB!.prepare(
    `INSERT INTO compliance_agents (id, tenant_id, agent_key, name, domain, authority, cadence, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
     ON CONFLICT(tenant_id, agent_key) DO UPDATE SET name = excluded.name, domain = excluded.domain,
       authority = excluded.authority, cadence = excluded.cadence, updated_at = excluded.updated_at`,
  );
  await env.DB!.batch(COMPLIANCE_AGENTS.map((a) =>
    stmt.bind(uuid(), tenantId, a.key, a.name, a.domain, a.authority, a.cadence, now, now)));
}

/** Chief Compliance Orchestrator — runs the roster and reconciles findings. */
async function runComplianceSweep(env: Env, tenantId: string, trigger: 'manual' | 'cron' = 'manual', onlyAgent?: string) {
  const db = env.DB!;
  await ensureComplianceRoster(env, tenantId);

  const runId = uuid();
  const startedAt = nowIso();
  const roster = onlyAgent ? COMPLIANCE_AGENTS.filter((a) => a.key === onlyAgent) : COMPLIANCE_AGENTS;

  await db.prepare(
    `INSERT INTO compliance_runs (id, tenant_id, trigger, started_at, agents_run) VALUES (?, ?, ?, ?, 0)`,
  ).bind(runId, tenantId, trigger, startedAt).run();

  const seen = new Set<string>();
  let opened = 0;
  const perAgent: Record<string, number> = {};

  for (const agent of roster) {
    const t0 = Date.now();
    let findings: Finding[] = [];
    try {
      findings = await agent.run(db, tenantId, env);
    } catch (e) {
      findings = [{
        fingerprint: `agent-error:${agent.key}`,
        severity: 'low',
        title: `${agent.name} could not complete its check`,
        detail: String(e).slice(0, 240),
        remediation: 'Re-run the sweep; if it persists the underlying table may be missing a migration.',
      }];
    }

    for (const f of findings) {
      seen.add(f.fingerprint);
      const existing = await db.prepare('SELECT id, status FROM compliance_findings WHERE tenant_id = ? AND fingerprint = ?')
        .bind(tenantId, f.fingerprint).first<Record<string, unknown>>();
      if (existing) {
        await db.prepare(
          `UPDATE compliance_findings SET last_seen = ?, severity = ?, title = ?, detail = ?, remediation = ?, deep_link = ?,
             status = CASE WHEN status = 'waived' THEN 'waived' ELSE 'open' END WHERE id = ?`,
        ).bind(nowIso(), f.severity, f.title, f.detail, f.remediation, f.deepLink || '', existing.id).run();
      } else {
        opened++;
        await db.prepare(
          `INSERT INTO compliance_findings (id, tenant_id, agent_key, fingerprint, severity, title, detail, authority,
             entity_type, entity_id, remediation, deep_link, status, first_seen, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        ).bind(uuid(), tenantId, agent.key, f.fingerprint, f.severity, f.title, f.detail, agent.authority,
          f.entityType || '', f.entityId || '', f.remediation, f.deepLink || '', nowIso(), nowIso()).run();
      }
    }

    perAgent[agent.key] = findings.length;
    await db.prepare(
      `UPDATE compliance_agents SET last_run_at = ?, last_duration_ms = ?, open_findings = ?, checks_run = checks_run + 1, updated_at = ?
       WHERE tenant_id = ? AND agent_key = ?`,
    ).bind(nowIso(), Date.now() - t0, findings.length, nowIso(), tenantId, agent.key).run();
  }

  // Auto-resolve anything the agents no longer report (full sweeps only).
  let resolved = 0;
  if (!onlyAgent) {
    const open = await db.prepare(`SELECT id, fingerprint FROM compliance_findings WHERE tenant_id = ? AND status = 'open'`)
      .bind(tenantId).all<Record<string, unknown>>();
    for (const row of open.results || []) {
      if (!seen.has(String(row.fingerprint))) {
        await db.prepare(`UPDATE compliance_findings SET status = 'resolved', resolved_at = ? WHERE id = ?`)
          .bind(nowIso(), row.id).run();
        resolved++;
      }
    }
  }

  // Score = 100 minus weighted open findings, floored at 0.
  const openRows = await db.prepare(`SELECT severity, COUNT(*) AS n FROM compliance_findings WHERE tenant_id = ? AND status = 'open' GROUP BY severity`)
    .bind(tenantId).all<Record<string, unknown>>();
  let penalty = 0;
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of openRows.results || []) {
    const sev = String(r.severity); const n = Number(r.n);
    bySeverity[sev] = n;
    penalty += (SEVERITY_WEIGHT[sev] || 1) * n;
  }
  const score = Math.max(0, 100 - penalty);

  await db.prepare(
    `UPDATE compliance_runs SET completed_at = ?, agents_run = ?, findings_opened = ?, findings_resolved = ?, score = ?, summary = ? WHERE id = ?`,
  ).bind(nowIso(), roster.length, opened, resolved, score, JSON.stringify({ perAgent, bySeverity }), runId).run();

  return { runId, agentsRun: roster.length, opened, resolved, score, bySeverity, perAgent };
}


/** Daily compliance digest — emailed to tenant admins after each cron sweep. */
async function sendComplianceDigest(env: Env, tenantId: string, sweep: { score: number; opened: number; resolved: number; bySeverity: Record<string, number> }) {
  if (!env.DB) return;
  const admins = await env.DB.prepare(`SELECT email, name FROM users WHERE tenant_id = ? AND role = 'admin' AND status = 'active'`)
    .bind(tenantId).all<Record<string, unknown>>();
  const recipients = (admins.results || []).map((u) => String(u.email)).filter(Boolean);
  if (!recipients.length) return;

  const tenant = await env.DB.prepare('SELECT name, business_name FROM tenants WHERE id = ?').bind(tenantId).first<Record<string, unknown>>() || {};
  const critical = await env.DB.prepare(
    `SELECT title, agent_key, remediation FROM compliance_findings WHERE tenant_id = ? AND status = 'open'
     ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END LIMIT 10`,
  ).bind(tenantId).all<Record<string, unknown>>();

  const lines = [
    `Daily compliance digest — ${tenant.business_name || tenant.name || 'your practice'}`,
    `${new Date().toLocaleDateString()}`,
    '',
    `Compliance score: ${sweep.score}/100`,
    `Open findings — critical ${sweep.bySeverity.critical || 0} · high ${sweep.bySeverity.high || 0} · medium ${sweep.bySeverity.medium || 0} · low ${sweep.bySeverity.low || 0}`,
    `New today: ${sweep.opened} · auto-resolved: ${sweep.resolved}`,
    '',
    'Top priorities:',
    ...(critical.results || []).map((f, i) => `  ${i + 1}. [${f.agent_key}] ${f.title}\n     Fix: ${f.remediation}`),
    '',
    'Open the Compliance Command Center to resolve or waive each item.',
  ];
  const body = lines.join('\n');
  const subject = `Compliance ${sweep.score}/100 — ${sweep.bySeverity.critical || 0} critical, ${sweep.bySeverity.high || 0} high`;

  let delivered = false;
  for (const to of recipients.slice(0, 10)) {
    const res = await safeSendEmail(env, { to, subject, text: body });
    delivered = delivered || res.ok;
  }
  await env.DB.prepare(
    `INSERT INTO digests (id, tenant_id, kind, sent_to, subject, body, delivered, created_at) VALUES (?, ?, 'compliance_daily', ?, ?, ?, ?, ?)`,
  ).bind(uuid(), tenantId, recipients.join(','), subject, body, delivered ? 1 : 0, nowIso()).run();
}

async function complianceOverview(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const tenantId = String(a.tenant.id);
  await ensureComplianceRoster(env, tenantId);

  const agents = await env.DB.prepare('SELECT * FROM compliance_agents WHERE tenant_id = ? ORDER BY agent_key').bind(tenantId).all<Record<string, unknown>>();
  const findings = await env.DB.prepare(
    `SELECT * FROM compliance_findings WHERE tenant_id = ? AND status != 'resolved'
     ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, last_seen DESC LIMIT 300`,
  ).bind(tenantId).all<Record<string, unknown>>();
  const runs = await env.DB.prepare('SELECT * FROM compliance_runs WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 10').bind(tenantId).all<Record<string, unknown>>();

  const open = (findings.results || []).filter((f) => f.status === 'open');
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  open.forEach((f) => { bySeverity[String(f.severity)] = (bySeverity[String(f.severity)] || 0) + 1; });
  const penalty = Object.entries(bySeverity).reduce((sum, [sev, n]) => sum + (SEVERITY_WEIGHT[sev] || 1) * n, 0);

  return json({
    ok: true,
    chief: {
      name: 'Chief Compliance Orchestrator',
      supervises: COMPLIANCE_AGENTS.length,
      score: Math.max(0, 100 - penalty),
      lastRun: (runs.results || [])[0]?.started_at || null,
      cadence: 'daily (cron tick) + on demand',
    },
    agents: agents.results || [],
    findings: findings.results || [],
    runs: runs.results || [],
    bySeverity,
  });
}

async function complianceRun(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const res = await runComplianceSweep(env, String(a.tenant.id), 'manual', body.agentKey ? String(body.agentKey) : undefined);
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'compliance.sweep', resource: 'compliance', details: res, request });
  return json({ ok: true, ...res });
}

async function complianceFindingAction(env: Env, request: Request, id: string, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const status = String(body.status || 'resolved');
  if (!['open', 'resolved', 'waived'].includes(status)) return bad('invalid_status');
  await env.DB.prepare(
    `UPDATE compliance_findings SET status = ?, resolved_at = ?, waived_by = ?, waive_reason = ? WHERE id = ? AND tenant_id = ?`,
  ).bind(status, status === 'open' ? null : nowIso(), status === 'waived' ? String(a.user.id) : null,
    status === 'waived' ? String(body.reason || '') : null, id, a.tenant.id).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: `compliance.finding.${status}`, resource: 'compliance_findings', resourceId: id, request });
  return json({ ok: true, id, status });
}


/* ══════════════ LIVE STREAM (Server-Sent Events) ══════════════
 * GET /api/stream?token=<session token>
 * EventSource cannot set headers, so the session token may ride in the query
 * string. Emits: hello → snapshot every 5s → audit events as they land.
 */
async function liveStream(env: Env, request: Request) {
  const url = new URL(request.url);
  const qsToken = url.searchParams.get('token') || '';
  const bearer = tokenFromRequest(request);
  const probe = new Request(request.url, { headers: { Authorization: `Bearer ${bearer || qsToken}` } });
  const a = await auth(env, probe);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const tenantId = String(a.tenant.id);
  const db = env.DB;
  const encoder = new TextEncoder();
  let cursor = nowIso();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send('hello', { tenant: a.tenant.name, user: a.user.email, at: nowIso() });

      const snapshot = async () => {
        const one = async (sql: string, ...b: unknown[]) =>
          Number((await db.prepare(sql).bind(...b).first<Record<string, unknown>>())?.n || 0);
        return {
          at: nowIso(),
          contacts: await one('SELECT COUNT(*) AS n FROM contacts WHERE tenant_id = ?', tenantId),
          deals: await one('SELECT COUNT(*) AS n FROM deals WHERE tenant_id = ?', tenantId),
          documents: await one('SELECT COUNT(*) AS n FROM files WHERE tenant_id = ?', tenantId),
          openTasks: await one(`SELECT COUNT(*) AS n FROM tasks WHERE tenant_id = ? AND status != 'Done'`, tenantId),
          queuedSends: await one(`SELECT COUNT(*) AS n FROM campaign_recipients WHERE tenant_id = ? AND status = 'queued'`, tenantId),
          activeWorkflows: await one(`SELECT COUNT(*) AS n FROM workflow_runs WHERE tenant_id = ? AND status IN ('active','waiting')`, tenantId),
          openFindings: await one(`SELECT COUNT(*) AS n FROM compliance_findings WHERE tenant_id = ? AND status = 'open'`, tenantId),
          criticalFindings: await one(`SELECT COUNT(*) AS n FROM compliance_findings WHERE tenant_id = ? AND status = 'open' AND severity = 'critical'`, tenantId),
        };
      };

      send('snapshot', await snapshot());

      // 5-second heartbeat for ~10 minutes, then the client reconnects.
      for (let i = 0; i < 120 && !closed; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        if (closed) break;
        try {
          const events = await db.prepare(
            `SELECT action, resource, resource_id, created_at FROM audit_logs
             WHERE tenant_id = ? AND created_at > ? ORDER BY created_at LIMIT 25`,
          ).bind(tenantId, cursor).all<Record<string, unknown>>();
          for (const e of events.results || []) {
            cursor = String(e.created_at);
            send('activity', e);
          }
          send('snapshot', await snapshot());
        } catch (err) {
          send('error', { message: String(err).slice(0, 120) });
          break;
        }
      }
      if (!closed) { send('bye', { at: nowIso() }); controller.close(); }
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}


/* ═════════════ E-SIGNATURE (ESIGN Act / UETA compliant) ═════════════
 * Tamper-evident: the exact document text presented to the signer is hashed
 * (SHA-256) at creation and re-verified at signing. Every touch is written to
 * signature_events with IP + user agent, producing an audit certificate that
 * satisfies 15 U.S.C. §7001(a) and UETA §12 record-retention requirements.
 */

const SIGN_TTL_DAYS = 14;

const ESIGN_DISCLOSURE =
  'By typing your name below you agree to sign this record electronically under the ' +
  'Electronic Signatures in Global and National Commerce Act (15 U.S.C. §7001) and applicable ' +
  'state UETA. You may request a paper copy at no charge and may withdraw consent before signing ' +
  'by contacting the practice. Your typed name, the time, your IP address and a hash of the exact ' +
  'document shown to you are recorded as the signature certificate.';

function renderStandardDocument(kind: string, ctx: { contact: any; tenant: any; deal: any }) {
  const client = `${ctx.contact?.first_name || ''} ${ctx.contact?.last_name || ''}`.trim() || 'Client';
  const firm = ctx.tenant?.business_name || ctx.tenant?.name || 'the Firm';
  const year = new Date().getFullYear();
  const fee = ctx.deal?.value ? `$${Number(ctx.deal.value).toLocaleString()}` : 'the agreed fee';

  switch (kind) {
    case 'form_8879':
      return [
        `IRS e-file Signature Authorization (Form 8879) — Tax Year ${year - 1}`,
        '',
        `Taxpayer: ${client}`,
        `Electronic Return Originator: ${firm}`,
        '',
        'Under penalties of perjury, I declare that I have examined a copy of my electronic individual',
        'income tax return and accompanying schedules and statements for the tax year stated above, and',
        'to the best of my knowledge and belief, it is true, correct, and complete.',
        '',
        'I consent to allow my intermediate service provider, transmitter, or electronic return originator',
        'to send my return to the IRS and to receive from the IRS (a) an acknowledgement of receipt or',
        'reason for rejection of the transmission, (b) the reason for any delay in processing the return',
        'or refund, and (c) the date of any refund.',
        '',
        'I authorize the ERO named above to enter or generate my PIN as my signature on my electronically',
        'filed income tax return.',
      ].join('\n');

    case 'consent_7216':
      return [
        `Consent to Use and Disclose Tax Return Information — §7216`,
        '',
        `Federal law requires this consent form be provided to you. Unless authorized by law, ${firm}`,
        'cannot use, without your consent, your tax return information for purposes other than the',
        'preparation and filing of your tax return.',
        '',
        'You are not required to complete this form. If we obtain your signature on this form by',
        'conditioning our services on your consent, your consent will not be valid. Your consent is',
        'valid for the amount of time you specify; if you do not specify a duration, it is valid for one year.',
        '',
        `I, ${client}, authorize ${firm} to use the information I provide during the preparation of my`,
        'return for the purpose of offering additional financial, bookkeeping, advisory and lending',
        'services, and to disclose that information to affiliated service providers for those purposes.',
      ].join('\n');

    case 'bank_disclosure':
      return [
        'Bank Product Disclosure and Consent',
        '',
        `Client: ${client}`,
        `Provided by: ${firm}`,
        '',
        'A refund transfer or refund advance is an optional product. You are NOT required to purchase it',
        'to have your return prepared or electronically filed. You may receive your refund directly from',
        'the IRS at no cost, typically within 21 days of acceptance for direct deposit.',
        '',
        'FEES. Tax preparation fees, bank product fees and any transmitter or technology fees will be',
        'deducted from your refund before the remaining balance is disbursed to you. The itemized fee',
        'schedule accompanying this disclosure forms part of this agreement.',
        '',
        'ADVANCE PRODUCTS. A refund advance is a loan secured by your anticipated refund. Approval is',
        'determined by the bank, not by this firm. If your refund is less than expected, you remain',
        'responsible to the bank under its loan agreement.',
        '',
        'TIMING. Disbursement occurs only after the IRS funds the refund; neither this firm nor the bank',
        'controls IRS processing times.',
        '',
        'I acknowledge that I received, read and understood this disclosure before applying.',
      ].join('\n');

    case 'croa_disclosure':
      return [
        'Consumer Credit File Rights Under State and Federal Law',
        '',
        'You have a right to dispute inaccurate information in your credit report by contacting the credit',
        'bureau directly. However, neither you nor any credit repair company or credit repair organization',
        'has the right to have accurate, current, and verifiable information removed from your credit report.',
        '',
        'You have a right to obtain a copy of your credit report from a credit bureau. You may be charged a',
        'reasonable fee. There is no fee, however, if you have been turned down for credit, employment,',
        'insurance, or a rental dwelling because of information in your credit report within the preceding',
        '60 days.',
        '',
        'You have a right to cancel your contract with any credit repair organization for any reason within',
        '3 business days from the date you signed it.',
        '',
        `Provided by ${firm}.`,
      ].join('\n');

    default:
      return [
        `Engagement Letter — ${firm}`,
        '',
        `Client: ${client}`,
        `Engagement: ${ctx.deal?.name || 'Tax and advisory services'}`,
        `Fee: ${fee}`,
        '',
        `This letter confirms the terms of the engagement between ${client} and ${firm}.`,
        '',
        'SCOPE. We will prepare the returns and perform the advisory services described above based on',
        'information you provide. We will not audit or verify the data you submit, although we may ask for',
        'clarification of some information.',
        '',
        'RESPONSIBILITIES. You are responsible for the accuracy and completeness of the records and',
        'representations provided, and for maintaining documentation supporting all items reported.',
        '',
        'FEES. Fees are due upon delivery unless otherwise agreed. Additional work outside this scope will',
        'be billed separately after written approval.',
        '',
        'RECORD RETENTION. We retain engagement records for seven years, after which they are securely destroyed.',
        '',
        'PRIVACY. We are required to keep your information confidential under Circular 230, IRC §7216 and',
        'the Gramm-Leach-Bliley Act.',
      ].join('\n');
  }
}

async function createSignatureRequest(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const contactId = String(body.contactId || '');
  if (!contactId) return bad('contactId_required');
  const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?')
    .bind(contactId, a.tenant.id).first<Record<string, any>>();
  if (!contact) return json({ ok: false, error: 'contact_not_found' }, 404);
  const email = String(body.signerEmail || contact.email || '');
  if (!email) return bad('signer_email_required');

  const deal = body.dealId
    ? await env.DB.prepare('SELECT * FROM deals WHERE id = ? AND tenant_id = ?').bind(body.dealId, a.tenant.id).first<Record<string, any>>()
    : null;
  const tenantRow = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(a.tenant.id).first<Record<string, any>>() || {};

  const docType = String(body.docType || 'engagement_letter');
  const bodyText = String(body.body || renderStandardDocument(docType, { contact, tenant: tenantRow, deal }));
  const title = String(body.title || {
    form_8879: 'IRS e-file Signature Authorization (Form 8879)',
    consent_7216: 'Consent to Use and Disclose Tax Return Information (§7216)',
    croa_disclosure: 'Consumer Credit File Rights Disclosure (CROA)',
    bank_disclosure: 'Bank Product Disclosure and Consent',
  }[docType] || 'Engagement Letter');

  const token = randHex(32);
  const id = uuid();
  const now = nowIso();
  const expires = new Date(Date.now() + SIGN_TTL_DAYS * 86400000).toISOString();

  await env.DB.prepare(
    `INSERT INTO signature_requests (id, tenant_id, contact_id, deal_id, file_id, doc_type, title, body, body_sha256,
       signer_name, signer_email, token_hash, status, expires_at, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?)`,
  ).bind(id, a.tenant.id, contactId, body.dealId || null, body.fileId || null, docType, title, bodyText,
    await sha256(bodyText), `${contact.first_name || ''} ${contact.last_name || ''}`.trim(), email,
    await sha256(token), expires, a.user.id, now, now).run();

  await env.DB.prepare(
    `INSERT INTO signature_events (id, tenant_id, request_id, event, ip, user_agent, detail, created_at)
     VALUES (?, ?, ?, 'created', ?, ?, ?, ?)`,
  ).bind(uuid(), a.tenant.id, id, request.headers.get('CF-Connecting-IP') || '', request.headers.get('User-Agent') || '',
    JSON.stringify({ by: a.user.email, docType }), now).run();

  const base = env.PORTAL_BASE_URL || new URL(request.url).origin;
  const link = `${base}/#/sign?token=${token}`;
  const mail = await safeSendEmail(env, {
    to: email,
    subject: `Signature requested: ${title} — ${tenantRow.business_name || tenantRow.name || 'your tax team'}`,
    text: `Hello ${contact.first_name || ''},\n\n${tenantRow.business_name || tenantRow.name || 'Your tax team'} has sent "${title}" for your electronic signature.\n\nOpen and sign here (expires in ${SIGN_TTL_DAYS} days):\n${link}\n\n${ESIGN_DISCLOSURE}`,
  });

  await bumpUsage(env, String(a.tenant.id), 'signatures', 1);
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'esign.request', resource: 'signature_requests', resourceId: id, details: { docType, email, delivered: mail.ok }, request });
  return json({ ok: true, id, title, signerEmail: email, expiresAt: expires, delivered: mail.ok, link }, 201);
}

async function listSignatureRequests(env: Env, request: Request, url: URL) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const contactId = url.searchParams.get('contactId');
  const where = contactId ? 'tenant_id = ? AND contact_id = ?' : 'tenant_id = ?';
  const binds = contactId ? [a.tenant.id, contactId] : [a.tenant.id];
  const rows = await env.DB.prepare(
    `SELECT id, contact_id, deal_id, doc_type, title, signer_name, signer_email, status, expires_at,
            signed_at, signature_name, signature_ip, created_at FROM signature_requests
     WHERE ${where} ORDER BY created_at DESC LIMIT 200`,
  ).bind(...binds).all<Record<string, unknown>>();
  return json({ ok: true, items: rows.results || [] });
}

/** Public: fetch the document behind a signing link (no session required). */
async function getSignatureByToken(env: Env, request: Request, token: string) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM signature_requests WHERE token_hash = ?')
    .bind(await sha256(token)).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'invalid_link' }, 404);
  if (row.status === 'signed') {
    return json({ ok: true, status: 'signed', title: row.title, body: row.body, signedAt: row.signed_at, signatureName: row.signature_name, disclosure: ESIGN_DISCLOSURE });
  }
  if (String(row.expires_at) < nowIso()) return json({ ok: false, error: 'link_expired' }, 410);

  const tenant = await env.DB.prepare('SELECT name, business_name, email, phone FROM tenants WHERE id = ?').bind(row.tenant_id).first<Record<string, any>>() || {};
  if (row.status === 'sent') {
    await env.DB.prepare(`UPDATE signature_requests SET status = 'viewed', updated_at = ? WHERE id = ?`).bind(nowIso(), row.id).run();
    await env.DB.prepare(
      `INSERT INTO signature_events (id, tenant_id, request_id, event, ip, user_agent, detail, created_at) VALUES (?, ?, ?, 'viewed', ?, ?, '{}', ?)`,
    ).bind(uuid(), row.tenant_id, row.id, request.headers.get('CF-Connecting-IP') || '', request.headers.get('User-Agent') || '', nowIso()).run();
  }

  return json({
    ok: true, status: 'pending', title: row.title, body: row.body, docType: row.doc_type,
    signerName: row.signer_name, signerEmail: row.signer_email, expiresAt: row.expires_at,
    practice: { name: tenant.business_name || tenant.name, email: tenant.email, phone: tenant.phone },
    disclosure: ESIGN_DISCLOSURE,
  });
}

/** Public: adopt and apply the signature. */
async function signByToken(env: Env, request: Request, body: Record<string, any>) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const token = String(body.token || '');
  const typedName = String(body.signatureName || '').trim();
  if (!token) return bad('token_required');
  if (typedName.length < 2) return bad('signature_name_required');
  if (!body.consent) return bad('esign_consent_required');

  const row = await env.DB.prepare('SELECT * FROM signature_requests WHERE token_hash = ?')
    .bind(await sha256(token)).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'invalid_link' }, 404);
  if (row.status === 'signed') return json({ ok: false, error: 'already_signed' }, 409);
  if (String(row.expires_at) < nowIso()) return json({ ok: false, error: 'link_expired' }, 410);

  // Tamper check: the stored body must still hash to the recorded value.
  const currentHash = await sha256(String(row.body || ''));
  if (currentHash !== String(row.body_sha256)) {
    return json({ ok: false, error: 'document_integrity_failure' }, 409);
  }

  const now = nowIso();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const certificate = {
    requestId: row.id,
    documentTitle: row.title,
    documentSha256: row.body_sha256,
    signerName: typedName,
    signerEmail: row.signer_email,
    signedAt: now,
    ip, userAgent: ua,
    esignConsent: true,
    disclosurePresented: ESIGN_DISCLOSURE,
    authority: 'ESIGN Act 15 U.S.C. §7001; UETA §7',
  };

  await env.DB.prepare(
    `UPDATE signature_requests SET status = 'signed', signed_at = ?, signature_name = ?, signature_ip = ?,
       signature_ua = ?, consent_esign = 1, certificate = ?, updated_at = ? WHERE id = ?`,
  ).bind(now, typedName, ip, ua, JSON.stringify(certificate), now, row.id).run();

  await env.DB.prepare(
    `INSERT INTO signature_events (id, tenant_id, request_id, event, ip, user_agent, detail, created_at)
     VALUES (?, ?, ?, 'signed', ?, ?, ?, ?)`,
  ).bind(uuid(), row.tenant_id, row.id, ip, ua, JSON.stringify({ signerName: typedName }), now).run();

  // Archive the executed record into the vault so compliance agents can see it.
  if (env.DOCS) {
    const text = `${row.title}\n${'='.repeat(String(row.title).length)}\n\n${row.body}\n\n---\nELECTRONIC SIGNATURE CERTIFICATE\n${JSON.stringify(certificate, null, 2)}\n`;
    const fileId = uuid();
    const safeName = `${String(row.doc_type)}-signed-${row.id.slice(0, 8)}.txt`;
    const key = `tenants/${row.tenant_id}/${fileId}/${safeName}`;
    const bytes = new TextEncoder().encode(text);
    await env.DOCS.put(key, bytes, { httpMetadata: { contentType: 'text/plain' }, customMetadata: { signed: 'true', requestId: String(row.id) } });
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    await env.DB.prepare(
      `INSERT INTO files (id, tenant_id, contact_id, deal_id, name, folder, doc_type, content_type, size, r2_key, sha256, uploaded_by, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Signed Agreements', ?, 'text/plain', ?, ?, ?, 'esign', 'stored', ?, ?, ?)`,
    ).bind(fileId, row.tenant_id, row.contact_id, row.deal_id, safeName, row.doc_type, bytes.length, key,
      Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join(''),
      JSON.stringify({ signatureRequestId: row.id }), now, now).run();
    await env.DB.prepare('UPDATE signature_requests SET file_id = COALESCE(file_id, ?) WHERE id = ?').bind(fileId, row.id).run();
  }

  await audit(env, { tenantId: String(row.tenant_id), action: 'esign.signed', resource: 'signature_requests', resourceId: String(row.id), details: { signerName: typedName }, request });
  return json({ ok: true, status: 'signed', signedAt: now, certificate });
}

async function signatureCertificate(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM signature_requests WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  const events = await env.DB.prepare('SELECT event, ip, user_agent, detail, created_at FROM signature_events WHERE request_id = ? ORDER BY created_at')
    .bind(id).all<Record<string, unknown>>();
  return json({ ok: true, request: row, certificate: safeJson(row.certificate, {}), events: events.results || [] });
}

/* ═════════════════════ INVOICING (Stripe-backed) ═════════════════════ */

async function createInvoice(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const deal = body.dealId
    ? await env.DB.prepare('SELECT * FROM deals WHERE id = ? AND tenant_id = ?').bind(body.dealId, a.tenant.id).first<Record<string, any>>()
    : null;
  const contactId = String(body.contactId || deal?.contact_id || '');
  const contact = contactId
    ? await env.DB.prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?').bind(contactId, a.tenant.id).first<Record<string, any>>()
    : null;

  const amountCents = Number(body.amountCents ?? Math.round(Number(deal?.value || 0) * 100));
  if (!amountCents || amountCents < 50) return bad('amount_must_exceed_50_cents');

  const seq = await env.DB.prepare('SELECT COUNT(*) AS n FROM invoices WHERE tenant_id = ?').bind(a.tenant.id).first<Record<string, unknown>>();
  const number = `INV-${new Date().getFullYear()}-${String(Number(seq?.n || 0) + 1).padStart(4, '0')}`;
  const description = String(body.description || deal?.name || 'Professional services');
  const id = uuid();
  const now = nowIso();
  const dueAt = String(body.dueAt || new Date(Date.now() + 14 * 86400000).toISOString());

  let checkoutUrl = ''; let sessionId = ''; let stripeError = '';
  const origin = env.PORTAL_BASE_URL || new URL(request.url).origin;
  if (env.STRIPE_SECRET_KEY) {
    try {
      const res = await stripeCheckout(env, {
        amountCents,
        description: `${number} — ${description}`,
        successUrl: `${origin}/#/portal?paid=${id}`,
        cancelUrl: `${origin}/#/portal?cancelled=${id}`,
        customerEmail: contact?.email || undefined,
      });
      const data = await res.clone().json().catch(() => ({})) as Record<string, any>;
      checkoutUrl = String(data.url || ''); sessionId = String(data.sessionId || '');
      if (!checkoutUrl) stripeError = String(data.error || 'stripe_no_url');
    } catch (e) { stripeError = String(e).slice(0, 160); }
  } else {
    stripeError = 'STRIPE_SECRET_KEY not configured — invoice saved as draft without a payment link.';
  }

  await env.DB.prepare(
    `INSERT INTO invoices (id, tenant_id, contact_id, deal_id, number, description, line_items, amount_cents,
       currency, status, due_at, checkout_url, stripe_session_id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usd', ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, a.tenant.id, contactId || null, body.dealId || null, number, description,
    JSON.stringify(body.lineItems || [{ description, amountCents }]), amountCents,
    checkoutUrl ? 'sent' : 'draft', dueAt, checkoutUrl, sessionId, a.user.id, now, now).run();

  if (checkoutUrl && contact?.email && body.email !== false) {
    await safeSendEmail(env, {
      to: contact.email,
      subject: `Invoice ${number} from ${a.tenant.businessName || a.tenant.name}`,
      text: `Hello ${contact.first_name || ''},\n\nInvoice ${number} for ${description} — $${(amountCents / 100).toFixed(2)}.\n\nPay securely:\n${checkoutUrl}\n\nDue ${new Date(dueAt).toLocaleDateString()}.`,
    });
    await env.DB.prepare('UPDATE invoices SET sent_at = ? WHERE id = ?').bind(now, id).run();
  }

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'invoice.create', resource: 'invoices', resourceId: id, details: { number, amountCents }, request });
  return json({ ok: true, id, number, amountCents, checkoutUrl, status: checkoutUrl ? 'sent' : 'draft', stripeError: stripeError || undefined }, 201);
}

async function listInvoices(env: Env, request: Request, url: URL) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const contactId = url.searchParams.get('contactId');
  const where = contactId ? 'tenant_id = ? AND contact_id = ?' : 'tenant_id = ?';
  const binds = contactId ? [a.tenant.id, contactId] : [a.tenant.id];
  const rows = await env.DB.prepare(`SELECT * FROM invoices WHERE ${where} ORDER BY created_at DESC LIMIT 200`).bind(...binds).all<Record<string, unknown>>();
  const totals = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n, SUM(amount_cents) AS cents FROM invoices WHERE tenant_id = ? GROUP BY status`,
  ).bind(a.tenant.id).all<Record<string, unknown>>();
  return json({ ok: true, items: rows.results || [], totals: totals.results || [] });
}

async function markInvoicePaid(env: Env, tenantId: string, invoiceId: string, paymentIntent?: string) {
  if (!env.DB) return;
  const now = nowIso();
  await env.DB.prepare(
    `UPDATE invoices SET status = 'paid', paid_at = ?, stripe_payment_intent = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`,
  ).bind(now, paymentIntent || '', now, invoiceId, tenantId).run();
  const inv = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invoiceId).first<Record<string, any>>();
  if (inv?.deal_id) {
    // Paid engagements are closed-won and 100% probability.
    await env.DB.prepare(`UPDATE deals SET probability = 100, updated_at = ? WHERE id = ? AND tenant_id = ?`)
      .bind(now, inv.deal_id, tenantId).run();
  }
}


/* ═══════════════ PLANS, METERING & PLATFORM ADMIN ═══════════════ */

interface PlanDef {
  key: string; label: string; priceMonthly: number;
  seats: number; contacts: number; emailsPerMonth: number; smsPerMonth: number;
  storageDocs: number; subAccounts: number; features: string[];
}

const PLANS: Record<string, PlanDef> = {
  starter: {
    key: 'starter', label: 'Starter', priceMonthly: 199,
    seats: 2, contacts: 500, emailsPerMonth: 2_000, smsPerMonth: 500,
    storageDocs: 2_000, subAccounts: 1,
    features: ['CRM + pipelines', 'Document vault', 'Client portal', 'Compliance agents', 'E-signature'],
  },
  professional: {
    key: 'professional', label: 'Professional', priceMonthly: 399,
    seats: 8, contacts: 5_000, emailsPerMonth: 25_000, smsPerMonth: 5_000,
    storageDocs: 25_000, subAccounts: 3,
    features: ['Everything in Starter', 'Campaign engine', 'Workflow automation', 'Stripe invoicing', 'Preparer payouts'],
  },
  enterprise: {
    key: 'enterprise', label: 'Enterprise', priceMonthly: 899,
    seats: 40, contacts: 100_000, emailsPerMonth: 250_000, smsPerMonth: 50_000,
    storageDocs: 250_000, subAccounts: 50,
    features: ['Everything in Professional', 'White-label sub-accounts', 'API keys + webhooks', 'Priority compliance review', 'Dedicated onboarding'],
  },
};

const planFor = (tenant: any): PlanDef => PLANS[String(tenant?.plan || 'starter').toLowerCase()] || PLANS.starter;
const currentPeriod = () => new Date().toISOString().slice(0, 7);

async function bumpUsage(env: Env, tenantId: string, metric: string, by = 1) {
  if (!env.DB || by <= 0) return;
  const period = currentPeriod();
  await env.DB.prepare(
    `INSERT INTO usage_counters (id, tenant_id, period, metric, count, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(tenant_id, period, metric) DO UPDATE SET count = count + excluded.count, updated_at = excluded.updated_at`,
  ).bind(uuid(), tenantId, period, metric, by, nowIso()).run();
}

async function getUsage(env: Env, tenantId: string) {
  const one = async (sql: string, ...b: unknown[]) =>
    Number((await env.DB!.prepare(sql).bind(...b).first<Record<string, unknown>>())?.n || 0);
  const metered = await env.DB!.prepare('SELECT metric, count FROM usage_counters WHERE tenant_id = ? AND period = ?')
    .bind(tenantId, currentPeriod()).all<Record<string, unknown>>();
  const m: Record<string, number> = {};
  (metered.results || []).forEach((r) => { m[String(r.metric)] = Number(r.count); });
  return {
    seats: await one('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?', tenantId),
    contacts: await one('SELECT COUNT(*) AS n FROM contacts WHERE tenant_id = ?', tenantId),
    storageDocs: await one('SELECT COUNT(*) AS n FROM files WHERE tenant_id = ?', tenantId),
    subAccounts: 1,
    emailsPerMonth: m.emails || 0,
    smsPerMonth: m.sms || 0,
    signatures: m.signatures || 0,
  };
}

/** Returns a 402 response when the action would exceed the tenant's plan. */
async function enforceLimit(env: Env, tenant: any, metric: keyof PlanDef, add = 1): Promise<Response | null> {
  if (!env.DB) return null;
  const plan = planFor(tenant);
  const cap = Number(plan[metric] || 0);
  if (!cap) return null;
  const usage = await getUsage(env, String(tenant.id));
  const used = Number((usage as any)[metric] || 0);
  if (used + add <= cap) return null;
  return json({
    ok: false, error: 'plan_limit_reached', metric, plan: plan.key, limit: cap, used,
    hint: `${plan.label} includes ${cap.toLocaleString()} ${String(metric)}. Upgrade to continue.`,
    upgradeTo: plan.key === 'starter' ? 'professional' : 'enterprise',
  }, 402);
}

async function planStatus(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const tenantRow = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(a.tenant.id).first<Record<string, any>>();
  const plan = planFor(tenantRow);
  const usage = await getUsage(env, String(a.tenant.id));
  const pct = (used: number, cap: number) => (cap ? Math.min(100, Math.round((used / cap) * 100)) : 0);
  return json({
    ok: true,
    plan,
    catalog: Object.values(PLANS),
    period: currentPeriod(),
    usage,
    utilization: {
      seats: pct(usage.seats, plan.seats),
      contacts: pct(usage.contacts, plan.contacts),
      emailsPerMonth: pct(usage.emailsPerMonth, plan.emailsPerMonth),
      smsPerMonth: pct(usage.smsPerMonth, plan.smsPerMonth),
      storageDocs: pct(usage.storageDocs, plan.storageDocs),
    },
  });
}

async function isPlatformAdmin(env: Env, userId: string) {
  if (!env.DB) return false;
  const row = await env.DB.prepare('SELECT user_id FROM platform_admins WHERE user_id = ?').bind(userId).first();
  if (row) return true;
  // Bootstrap: the very first user of the very first tenant owns the platform.
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM platform_admins').first<Record<string, unknown>>();
  if (Number(count?.n || 0) > 0) return false;
  const first = await env.DB.prepare('SELECT id, email FROM users ORDER BY created_at LIMIT 1').first<Record<string, unknown>>();
  if (first && String(first.id) === userId) {
    await env.DB.prepare('INSERT OR IGNORE INTO platform_admins (user_id, email, granted_by, created_at) VALUES (?, ?, ?, ?)')
      .bind(userId, String(first.email), 'bootstrap', nowIso()).run();
    return true;
  }
  return false;
}

/** Cross-tenant operator view — platform admins only. */
async function platformOverview(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  if (!(await isPlatformAdmin(env, String(a.user.id)))) return json({ ok: false, error: 'forbidden_platform_admin_only' }, 403);

  const tenants = await env.DB.prepare('SELECT id, name, business_name, plan, status, created_at FROM tenants ORDER BY created_at DESC').all<Record<string, any>>();
  const rows: Record<string, unknown>[] = [];
  let mrr = 0;
  for (const t of tenants.results || []) {
    const usage = await getUsage(env, String(t.id));
    const plan = planFor(t);
    mrr += plan.priceMonthly;
    const findings = await env.DB.prepare(`SELECT COUNT(*) AS n FROM compliance_findings WHERE tenant_id = ? AND status = 'open'`)
      .bind(t.id).first<Record<string, unknown>>();
    rows.push({ ...t, planLabel: plan.label, priceMonthly: plan.priceMonthly, usage, openFindings: Number(findings?.n || 0) });
  }
  return json({ ok: true, tenants: rows, totals: { tenants: rows.length, mrr }, plans: Object.values(PLANS) });
}

async function setTenantPlan(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  if (!(await isPlatformAdmin(env, String(a.user.id)))) return json({ ok: false, error: 'forbidden_platform_admin_only' }, 403);
  const planKey = String(body.plan || '').toLowerCase();
  if (!PLANS[planKey]) return bad('unknown_plan');
  const tenantId = String(body.tenantId || a.tenant.id);
  await env.DB.prepare('UPDATE tenants SET plan = ?, updated_at = ? WHERE id = ?').bind(planKey, nowIso(), tenantId).run();
  await audit(env, { tenantId, userId: String(a.user.id), action: 'platform.plan_change', resource: 'tenants', resourceId: tenantId, details: { plan: planKey }, request });
  return json({ ok: true, tenantId, plan: PLANS[planKey] });
}

/* ═══════════════════ MFA — TOTP (RFC 6238) ═══════════════════ */

const B32_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32_ALPHA[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32_ALPHA[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32_ALPHA.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(out);
}

async function totpCode(secretB32: string, step: number) {
  const key = await crypto.subtle.importKey('raw', base32Decode(secretB32), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  view.setUint32(0, Math.floor(step / 0x100000000));
  view.setUint32(4, step >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}

/** Verifies a TOTP within ±1 step (±30s) and blocks step replay. */
async function verifyTotp(env: Env, userId: string, secret: string, code: string, lastStep: number) {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 6) return false;
  const now = Math.floor(Date.now() / 30_000);
  for (const step of [now, now - 1, now + 1]) {
    if (step <= lastStep) continue;
    if (await totpCode(secret, step) === clean) {
      if (env.DB) await env.DB.prepare('UPDATE user_mfa SET last_used_step = ?, updated_at = ? WHERE user_id = ?')
        .bind(step, nowIso(), userId).run();
      return true;
    }
  }
  return false;
}

async function mfaStatus(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT enabled, confirmed_at, backup_codes FROM user_mfa WHERE user_id = ?')
    .bind(a.user.id).first<Record<string, unknown>>();
  return json({
    ok: true,
    enabled: Number(row?.enabled || 0) === 1,
    confirmedAt: row?.confirmed_at || null,
    backupCodesRemaining: safeJson<string[]>(row?.backup_codes, []).length,
  });
}

async function mfaSetup(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const secret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO user_mfa (user_id, tenant_id, secret, enabled, backup_codes, created_at, updated_at)
     VALUES (?, ?, ?, 0, '[]', ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET secret = excluded.secret, enabled = 0, backup_codes = '[]', last_used_step = 0, updated_at = excluded.updated_at`,
  ).bind(a.user.id, a.tenant.id, secret, now, now).run();

  const label = encodeURIComponent(`Tax Pro Hub:${a.user.email}`);
  const issuer = encodeURIComponent(String(a.tenant.businessName || a.tenant.name || 'Tax Pro Hub University'));
  return json({
    ok: true,
    secret,
    otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
    instructions: 'Add the secret to Google Authenticator, 1Password or Authy, then confirm with a 6-digit code.',
  });
}

async function mfaConfirm(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM user_mfa WHERE user_id = ?').bind(a.user.id).first<Record<string, any>>();
  if (!row) return bad('run_mfa_setup_first');
  const ok = await verifyTotp(env, String(a.user.id), String(row.secret), String(body.code || ''), Number(row.last_used_step || 0));
  if (!ok) return json({ ok: false, error: 'invalid_code' }, 401);

  const codes = Array.from({ length: 8 }, () => randHex(4).toUpperCase());
  const hashes = await Promise.all(codes.map((c) => sha256(c)));
  await env.DB.prepare('UPDATE user_mfa SET enabled = 1, confirmed_at = ?, backup_codes = ?, updated_at = ? WHERE user_id = ?')
    .bind(nowIso(), JSON.stringify(hashes), nowIso(), a.user.id).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'mfa.enabled', resource: 'users', resourceId: String(a.user.id), request });
  return json({ ok: true, enabled: true, backupCodes: codes, note: 'Store these one-time recovery codes now — they are not shown again.' });
}

async function mfaDisable(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(a.user.id).first<Record<string, unknown>>();
  const ok = await verifyPassword(String(body.password || ''), String(user?.password_hash || ''), env.SESSION_SECRET);
  if (!ok) return json({ ok: false, error: 'password_required' }, 401);
  await env.DB.prepare('DELETE FROM user_mfa WHERE user_id = ?').bind(a.user.id).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'mfa.disabled', resource: 'users', resourceId: String(a.user.id), request });
  return json({ ok: true, enabled: false });
}


/* ═══════════ PUBLIC INTAKE — forms/funnels that create real records ═══════════
 * Unauthenticated by design: a landing page or funnel step posts here and the
 * submission becomes a deduped contact, an audit row, and (optionally) a
 * workflow enrolment. Abuse control: per-IP KV throttle + payload caps.
 */

const INTAKE_MAX_FIELDS = 60;
const INTAKE_MAX_VALUE = 4_000;

async function throttleOk(env: Env, key: string, limit = 20, windowSec = 300) {
  if (!env.LEDGER) return true;
  try {
    const raw = await env.LEDGER.get(key);
    const n = Number(raw || 0);
    if (n >= limit) return false;
    await env.LEDGER.put(key, String(n + 1), { expirationTtl: windowSec });
    return true;
  } catch { return true; }
}

async function publicFormDefinition(env: Env, tenantId: string, slug: string) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const form = await env.DB.prepare(
    `SELECT id, name, fields, settings FROM forms WHERE tenant_id = ? AND (slug = ? OR id = ?)`,
  ).bind(tenantId, slug, slug).first<Record<string, any>>();
  if (!form) return json({ ok: false, error: 'form_not_found' }, 404);
  const tenant = await env.DB.prepare('SELECT name, business_name, logo, colors FROM tenants WHERE id = ?')
    .bind(tenantId).first<Record<string, any>>() || {};
  const settings = safeJson<Record<string, any>>(form.settings, {});
  return json({
    ok: true,
    form: {
      id: form.id,
      name: form.name,
      fields: safeJson(form.fields, []),
      submitButtonText: settings.submitButtonText || 'Submit',
      successMessage: settings.successMessage || 'Thank you — your information was received.',
    },
    practice: {
      name: tenant.business_name || tenant.name,
      logo: tenant.logo || null,
      colors: safeJson(tenant.colors, {}),
    },
  });
}

async function publicFormSubmit(env: Env, request: Request, tenantId: string, slug: string, body: Record<string, any>) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const ip = request.headers.get('CF-Connecting-IP') || 'anon';
  if (!(await throttleOk(env, `intake:${ip}`, 20, 300))) {
    return json({ ok: false, error: 'rate_limited', hint: 'Too many submissions from this address. Try again shortly.' }, 429);
  }

  const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first<Record<string, any>>();
  if (!tenant) return json({ ok: false, error: 'tenant_not_found' }, 404);
  const form = await env.DB.prepare(`SELECT * FROM forms WHERE tenant_id = ? AND (slug = ? OR id = ?)`)
    .bind(tenantId, slug, slug).first<Record<string, any>>();
  if (!form) return json({ ok: false, error: 'form_not_found' }, 404);

  // Honeypot: bots fill hidden fields.
  if (String(body._hp || '').trim()) return json({ ok: true, accepted: true });

  const raw = (body.values && typeof body.values === 'object') ? body.values : body;
  const values: Record<string, string> = {};
  Object.entries(raw).slice(0, INTAKE_MAX_FIELDS).forEach(([k, v]) => {
    if (k.startsWith('_')) return;
    values[k.slice(0, 80)] = String(v ?? '').slice(0, INTAKE_MAX_VALUE);
  });

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const hit = Object.entries(values).find(([key]) => key.toLowerCase().replace(/[^a-z]/g, '') === k);
      if (hit && hit[1]) return hit[1];
    }
    return '';
  };
  const email = (pick('email', 'emailaddress') || '').trim().toLowerCase();
  const fullName = pick('name', 'fullname', 'yourname');
  const firstName = pick('firstname') || fullName.split(' ')[0] || 'New';
  const lastName = pick('lastname') || fullName.split(' ').slice(1).join(' ') || 'Lead';
  const phone = pick('phone', 'phonenumber', 'mobile');
  const company = pick('company', 'business', 'businessname');

  const now = nowIso();
  let contactId = '';

  if (email) {
    const existing = await env.DB.prepare('SELECT id, tags FROM contacts WHERE tenant_id = ? AND lower(email) = ?')
      .bind(tenantId, email).first<Record<string, any>>();
    if (existing) {
      contactId = String(existing.id);
      await env.DB.prepare('UPDATE contacts SET phone = COALESCE(NULLIF(?, \'\'), phone), updated_at = ? WHERE id = ?')
        .bind(phone, now, contactId).run();
    }
  }

  if (!contactId) {
    // Respect the tenant's plan ceiling even for public intake.
    const blocked = await enforceLimit(env, tenant, 'contacts');
    if (blocked) return json({ ok: false, error: 'capacity', hint: 'This practice cannot accept new intakes right now.' }, 503);

    contactId = uuid();
    await env.DB.prepare(
      `INSERT INTO contacts (id, tenant_id, first_name, last_name, email, phone, company, source, status,
         tags, custom_fields, notes, activities, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'lead', ?, ?, '[]', '[]', 0, ?, ?)`,
    ).bind(contactId, tenantId, firstName, lastName, email, phone, company,
      String(body._source || form.name || 'Public form'),
      JSON.stringify(['Web Intake']), JSON.stringify(values), now, now).run();
  }

  const submissionId = uuid();
  await env.DB.prepare(
    `INSERT INTO form_submissions (id, tenant_id, form_id, contact_id, payload, source, referrer, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(submissionId, tenantId, form.id, contactId, JSON.stringify(values),
    String(body._source || 'public_form'), String(body._referrer || request.headers.get('Referer') || ''),
    ip, request.headers.get('User-Agent') || '', now).run();

  const settings = safeJson<Record<string, any>>(form.settings, {});

  // Optional automation: enrol the new contact in a workflow.
  let enrolled = false;
  if (settings.workflowId) {
    const wf = await env.DB.prepare('SELECT id FROM workflows WHERE id = ? AND tenant_id = ? AND is_active = 1')
      .bind(settings.workflowId, tenantId).first();
    if (wf) {
      await env.DB.prepare(
        `INSERT INTO workflow_runs (id, tenant_id, workflow_id, contact_id, status, step_index, next_run_at, context, log, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', 0, ?, '{}', '[]', ?, ?)`,
      ).bind(uuid(), tenantId, settings.workflowId, contactId, now, now, now).run();
      enrolled = true;
    }
  }

  // Optional internal notification.
  if (settings.notifyEmail) {
    await safeSendEmail(env, {
      to: String(settings.notifyEmail),
      subject: `New intake: ${firstName} ${lastName}${company ? ` (${company})` : ''}`,
      text: `Form: ${form.name}\n\n${Object.entries(values).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nContact id: ${contactId}`,
    });
  }

  await audit(env, { tenantId, action: 'intake.submission', resource: 'form_submissions', resourceId: submissionId, details: { formId: form.id, contactId, enrolled }, request });
  return json({
    ok: true,
    contactId,
    submissionId,
    workflowEnrolled: enrolled,
    message: settings.successMessage || 'Thank you — your information was received.',
  }, 201);
}

async function listSubmissions(env: Env, request: Request, url: URL) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const formId = url.searchParams.get('formId');
  const where = formId ? 'tenant_id = ? AND form_id = ?' : 'tenant_id = ?';
  const binds = formId ? [a.tenant.id, formId] : [a.tenant.id];
  const rows = await env.DB.prepare(`SELECT * FROM form_submissions WHERE ${where} ORDER BY created_at DESC LIMIT 200`)
    .bind(...binds).all<Record<string, unknown>>();
  return json({ ok: true, items: (rows.results || []).map((r) => ({ ...r, payload: safeJson(r.payload, {}) })) });
}

/* ═══════════ PAYOUT RUNS — batched commissions via Stripe Connect ═══════════ */

async function setPreparerPaymentAccount(env: Env, request: Request, preparerId: string, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const acct = String(body.stripeAccountId || '').trim();
  if (!/^acct_[A-Za-z0-9]+$/.test(acct)) return bad('stripe_account_id_must_look_like_acct_xxx');
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO preparer_payment_accounts (preparer_id, tenant_id, stripe_account_id, method, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)
     ON CONFLICT(preparer_id) DO UPDATE SET stripe_account_id = excluded.stripe_account_id, method = excluded.method, updated_at = excluded.updated_at`,
  ).bind(preparerId, a.tenant.id, acct, String(body.method || 'stripe_connect'), now, now).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'payout.account_linked', resource: 'preparers', resourceId: preparerId, request });
  return json({ ok: true, preparerId, stripeAccountId: acct });
}

/** Group every pending payout into one run, one line per preparer. */
async function createPayoutRun(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const period = String(body.period || currentPeriod());
  const pending = await env.DB.prepare(
    `SELECT id, preparer_id, preparer_name, amount, commission_amount, status FROM payouts
     WHERE tenant_id = ? AND (status IS NULL OR status IN ('', 'pending', 'approved'))`,
  ).bind(a.tenant.id).all<Record<string, any>>();
  const rows = pending.results || [];
  if (!rows.length) return json({ ok: false, error: 'no_pending_payouts', hint: 'Accrue commissions first (POST /api/payouts/accrue).' }, 400);

  const byPreparer = new Map<string, { name: string; cents: number; ids: string[] }>();
  for (const r of rows) {
    const cents = Math.round(Number(r.commission_amount || r.amount || 0) * 100);
    if (cents <= 0) continue;
    const key = String(r.preparer_id || 'unassigned');
    const cur = byPreparer.get(key) || { name: String(r.preparer_name || key), cents: 0, ids: [] as string[] };
    cur.cents += cents; cur.ids.push(String(r.id));
    byPreparer.set(key, cur);
  }
  if (!byPreparer.size) return json({ ok: false, error: 'no_payable_amounts' }, 400);

  const runId = uuid();
  const now = nowIso();
  let total = 0;
  const stmt = env.DB.prepare(
    `INSERT INTO payout_run_items (id, tenant_id, run_id, preparer_id, preparer_name, payout_ids, amount_cents, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
  );
  const batch = [];
  for (const [preparerId, v] of byPreparer) {
    total += v.cents;
    batch.push(stmt.bind(uuid(), a.tenant.id, runId, preparerId, v.name, JSON.stringify(v.ids), v.cents, now));
  }
  await env.DB.prepare(
    `INSERT INTO payout_runs (id, tenant_id, period, status, total_cents, item_count, created_by, created_at)
     VALUES (?, ?, ?, 'draft', ?, ?, ?, ?)`,
  ).bind(runId, a.tenant.id, period, total, byPreparer.size, a.user.id, now).run();
  await env.DB.batch(batch);

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'payout.run_created', resource: 'payout_runs', resourceId: runId, details: { total, items: byPreparer.size }, request });
  return json({ ok: true, runId, period, totalCents: total, items: byPreparer.size, status: 'draft' }, 201);
}

async function executePayoutRun(env: Env, request: Request, runId: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const run = await env.DB.prepare('SELECT * FROM payout_runs WHERE id = ? AND tenant_id = ?')
    .bind(runId, a.tenant.id).first<Record<string, any>>();
  if (!run) return json({ ok: false, error: 'run_not_found' }, 404);
  if (run.status === 'complete') return json({ ok: false, error: 'already_executed' }, 409);

  await env.DB.prepare(`UPDATE payout_runs SET status = 'executing' WHERE id = ?`).bind(runId).run();
  const items = await env.DB.prepare(`SELECT * FROM payout_run_items WHERE run_id = ? AND status = 'pending'`)
    .bind(runId).all<Record<string, any>>();

  let paid = 0, failed = 0, paidCents = 0;
  const now = nowIso();

  for (const item of items.results || []) {
    const acct = await env.DB.prepare('SELECT stripe_account_id FROM preparer_payment_accounts WHERE preparer_id = ? AND tenant_id = ?')
      .bind(item.preparer_id, a.tenant.id).first<Record<string, unknown>>();
    if (!acct?.stripe_account_id) {
      failed++;
      await env.DB.prepare(`UPDATE payout_run_items SET status = 'skipped', error = ? WHERE id = ?`)
        .bind('no_connected_account', item.id).run();
      continue;
    }
    if (!env.STRIPE_SECRET_KEY) {
      failed++;
      await env.DB.prepare(`UPDATE payout_run_items SET status = 'failed', error = ? WHERE id = ?`)
        .bind('STRIPE_SECRET_KEY not configured', item.id).run();
      continue;
    }
    try {
      const res = await stripeConnectTransfer(env, {
        amountCents: Number(item.amount_cents),
        connectedAccountId: String(acct.stripe_account_id),
        description: `Payout run ${run.period} — ${item.preparer_name}`,
      });
      const data = await res.clone().json().catch(() => ({})) as Record<string, any>;
      if (res.status < 400 && data.ok !== false) {
        paid++; paidCents += Number(item.amount_cents);
        await env.DB.prepare(`UPDATE payout_run_items SET status = 'paid', stripe_transfer_id = ?, paid_at = ? WHERE id = ?`)
          .bind(String(data.transferId || data.id || ''), now, item.id).run();
        for (const pid of safeJson<string[]>(item.payout_ids, [])) {
          await env.DB.prepare(`UPDATE payouts SET status = 'paid', payment_date = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`)
            .bind(now, now, pid, a.tenant.id).run();
        }
      } else {
        failed++;
        await env.DB.prepare(`UPDATE payout_run_items SET status = 'failed', error = ? WHERE id = ?`)
          .bind(JSON.stringify(data).slice(0, 300), item.id).run();
      }
    } catch (e) {
      failed++;
      await env.DB.prepare(`UPDATE payout_run_items SET status = 'failed', error = ? WHERE id = ?`)
        .bind(String(e).slice(0, 300), item.id).run();
    }
  }

  await env.DB.prepare(`UPDATE payout_runs SET status = ?, paid_cents = ?, executed_at = ? WHERE id = ?`)
    .bind(failed && !paid ? 'failed' : 'complete', paidCents, now, runId).run();
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'payout.run_executed', resource: 'payout_runs', resourceId: runId, details: { paid, failed, paidCents }, request });
  return json({ ok: true, runId, paid, failed, paidCents });
}

async function listPayoutRuns(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const runs = await env.DB.prepare('SELECT * FROM payout_runs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50')
    .bind(a.tenant.id).all<Record<string, any>>();
  const out = [];
  for (const r of runs.results || []) {
    const items = await env.DB.prepare('SELECT * FROM payout_run_items WHERE run_id = ? ORDER BY amount_cents DESC').bind(r.id).all<Record<string, unknown>>();
    out.push({ ...r, items: items.results || [] });
  }
  const accounts = await env.DB.prepare('SELECT * FROM preparer_payment_accounts WHERE tenant_id = ?').bind(a.tenant.id).all<Record<string, unknown>>();
  return json({ ok: true, runs: out, accounts: accounts.results || [], stripeConfigured: !!env.STRIPE_SECRET_KEY });
}

/* ═══════════ COMPLIANCE EVIDENCE EXPORT (audit / insurer ready) ═══════════ */

async function buildEvidenceBundle(env: Env, request: Request, body: Record<string, unknown>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const tenantId = String(a.tenant.id);
  const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first<Record<string, any>>() || {};
  const since = String(body.since || new Date(Date.now() - 365 * 86400000).toISOString());

  const q = async (sql: string, ...b: unknown[]) =>
    ((await env.DB!.prepare(sql).bind(...b).all<Record<string, any>>()).results || []);

  const findings = await q(`SELECT agent_key, severity, title, detail, authority, remediation, status, first_seen, last_seen, resolved_at FROM compliance_findings WHERE tenant_id = ? ORDER BY status, severity`, tenantId);
  const runs = await q(`SELECT started_at, completed_at, trigger, agents_run, findings_opened, findings_resolved, score FROM compliance_runs WHERE tenant_id = ? AND started_at >= ? ORDER BY started_at DESC`, tenantId, since);
  const agents = await q(`SELECT agent_key, name, domain, authority, cadence, last_run_at, checks_run, open_findings FROM compliance_agents WHERE tenant_id = ? ORDER BY agent_key`, tenantId);
  const signatures = await q(`SELECT id, title, doc_type, signer_name, signer_email, status, signed_at, signature_ip, body_sha256 FROM signature_requests WHERE tenant_id = ? AND created_at >= ? ORDER BY created_at DESC`, tenantId, since);
  const docs = await q(`SELECT name, folder, doc_type, size, sha256, created_at FROM files WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1000`, tenantId);
  const preparers = await q(`SELECT first_name, last_name, ptin, efin, credentials, ce_credits, circular230_status, status FROM preparers WHERE tenant_id = ?`, tenantId);
  const auditLog = await q(`SELECT action, resource, resource_id, ip, created_at FROM audit_logs WHERE tenant_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 5000`, tenantId, since);
  const digestRows = await q(`SELECT subject, delivered, created_at FROM digests WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100`, tenantId);

  const open = findings.filter((f) => f.status === 'open');
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  open.forEach((f) => { bySeverity[String(f.severity)] = (bySeverity[String(f.severity)] || 0) + 1; });
  const penalty = Object.entries(bySeverity).reduce((sum, [sev, n]) => sum + (SEVERITY_WEIGHT[sev] || 1) * n, 0);
  const score = Math.max(0, 100 - penalty);

  const generatedAt = nowIso();
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    ' COMPLIANCE EVIDENCE BUNDLE',
    '═══════════════════════════════════════════════════════════════',
    `Practice:        ${tenant.business_name || tenant.name}`,
    `Tenant id:       ${tenantId}`,
    `Generated:       ${generatedAt}`,
    `Requested by:    ${a.user.email}`,
    `Coverage window: ${since} → ${generatedAt}`,
    `Compliance score:${score}/100`,
    '',
    `Open findings — critical ${bySeverity.critical} · high ${bySeverity.high} · medium ${bySeverity.medium} · low ${bySeverity.low}`,
    '',
    '1. AGENT ROSTER AND CADENCE',
    '───────────────────────────────────────────────────────────────',
    ...agents.map((x) => `  ${String(x.agent_key).padEnd(24)} ${x.name} | ${x.authority} | ${x.cadence} | checks run: ${x.checks_run} | last: ${x.last_run_at || 'never'}`),
    '',
    '2. SWEEP HISTORY',
    '───────────────────────────────────────────────────────────────',
    ...runs.map((r) => `  ${r.started_at} [${r.trigger}] agents=${r.agents_run} opened=${r.findings_opened} resolved=${r.findings_resolved} score=${r.score}`),
    '',
    '3. FINDINGS REGISTER',
    '───────────────────────────────────────────────────────────────',
    ...findings.map((f) => [
      `  [${String(f.severity).toUpperCase()}] ${f.title}`,
      `      agent:      ${f.agent_key}`,
      `      authority:  ${f.authority}`,
      `      status:     ${f.status}${f.resolved_at ? ` (resolved ${f.resolved_at})` : ''}`,
      `      first seen: ${f.first_seen} | last seen: ${f.last_seen}`,
      `      remediation:${f.remediation}`,
    ].join('\n')),
    '',
    '4. EXECUTED AGREEMENTS (ESIGN Act / UETA)',
    '───────────────────────────────────────────────────────────────',
    ...signatures.map((sg) => `  ${sg.status.padEnd(9)} ${sg.doc_type.padEnd(20)} ${sg.signer_name || ''} <${sg.signer_email}> signed=${sg.signed_at || '—'} ip=${sg.signature_ip || '—'} sha256=${sg.body_sha256}`),
    '',
    '5. DOCUMENT VAULT INVENTORY (hash-verified)',
    '───────────────────────────────────────────────────────────────',
    ...docs.map((d) => `  ${String(d.created_at).slice(0, 10)} ${String(d.folder).padEnd(20)} ${String(d.name).padEnd(46)} ${String(d.size).padStart(9)}B sha256=${d.sha256}`),
    '',
    '6. PREPARER CREDENTIALS',
    '───────────────────────────────────────────────────────────────',
    ...preparers.map((p) => `  ${p.first_name} ${p.last_name} | PTIN ${p.ptin || 'MISSING'} | EFIN ${p.efin || '—'} | CE ${p.ce_credits} | Circ230 ${p.circular230_status} | ${p.status}`),
    '',
    '7. DAILY DIGEST DELIVERY LOG',
    '───────────────────────────────────────────────────────────────',
    ...digestRows.map((d) => `  ${d.created_at} delivered=${d.delivered ? 'yes' : 'no'} :: ${d.subject}`),
    '',
    '8. AUDIT TRAIL',
    '───────────────────────────────────────────────────────────────',
    ...auditLog.map((e) => `  ${e.created_at} ${String(e.action).padEnd(26)} ${String(e.resource || '').padEnd(20)} ${e.resource_id || ''} ip=${e.ip || '—'}`),
    '',
    '═══════════════════════════════════════════════════════════════',
    ' ATTESTATION',
    '═══════════════════════════════════════════════════════════════',
    ' This bundle was generated directly from the practice management system of',
    ' record. Findings are produced by automated agents that query live data;',
    ' document hashes are SHA-256 values recorded at upload or signature time.',
    ' Retain under IRC §6107(b) and FTC Safeguards Rule 16 CFR 314.4(i).',
    '',
  ];

  const text = lines.join('\n');
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = uuid();
  const title = `compliance-evidence-${generatedAt.slice(0, 10)}-${id.slice(0, 8)}.txt`;
  let key = '';

  if (env.DOCS) {
    key = `tenants/${tenantId}/evidence/${id}/${title}`;
    await env.DOCS.put(key, bytes, { httpMetadata: { contentType: 'text/plain' }, customMetadata: { kind: 'compliance-evidence', sha256: sha } });
  }

  await env.DB.prepare(
    `INSERT INTO evidence_exports (id, tenant_id, requested_by, title, r2_key, size, sha256, score, findings_open, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, tenantId, String(a.user.email), title, key, bytes.length, sha, score, open.length, key ? 'complete' : 'no_object_store', generatedAt).run();

  await audit(env, { tenantId, userId: String(a.user.id), action: 'compliance.evidence_export', resource: 'evidence_exports', resourceId: id, details: { size: bytes.length, sha256: sha }, request });
  return json({
    ok: true, id, title, sizeBytes: bytes.length, sha256: sha, score,
    openFindings: open.length, sections: 8, archived: !!key,
    downloadUrl: `/api/compliance/evidence/${id}/download`,
  }, 201);
}

async function listEvidenceExports(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const rows = await env.DB.prepare('SELECT * FROM evidence_exports WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50')
    .bind(a.tenant.id).all<Record<string, unknown>>();
  return json({ ok: true, items: (rows.results || []).map((r) => ({ ...r, downloadUrl: `/api/compliance/evidence/${r.id}/download` })) });
}

async function downloadEvidence(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM evidence_exports WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  if (!env.DOCS || !row.r2_key) return json({ ok: false, error: 'no_object_store' }, 410);
  const obj = await env.DOCS.get(String(row.r2_key));
  if (!obj) return json({ ok: false, error: 'object_missing' }, 410);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${row.title}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}


/* ═══════════ WHITE-LABEL SUB-ACCOUNTS & CUSTOM DOMAINS ═══════════
 * A sub-account is a real tenant row plus a hierarchy edge, so every existing
 * tenant-scoped query, plan ceiling and compliance sweep applies to it too.
 * Domains resolve branded public surfaces (portal, intake forms, signing) by
 * Host header — no per-tenant deploy required.
 */

async function childTenantIds(env: Env, parentId: string): Promise<string[]> {
  if (!env.DB) return [];
  const rows = await env.DB.prepare(`SELECT tenant_id FROM tenant_hierarchy WHERE parent_tenant_id = ? AND status = 'active'`)
    .bind(parentId).all<Record<string, unknown>>();
  return (rows.results || []).map((r) => String(r.tenant_id));
}

async function createSubAccount(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const parentRow = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(a.tenant.id).first<Record<string, any>>();
  const plan = planFor(parentRow);
  const existing = await childTenantIds(env, String(a.tenant.id));
  if (existing.length + 1 >= plan.subAccounts + 1) {
    // +1 because the parent itself occupies one slot in the plan's allowance.
    if (existing.length >= plan.subAccounts) {
      return json({
        ok: false, error: 'plan_limit_reached', metric: 'subAccounts', plan: plan.key,
        limit: plan.subAccounts, used: existing.length,
        hint: `${plan.label} allows ${plan.subAccounts} white-label sub-account${plan.subAccounts === 1 ? '' : 's'}.`,
        upgradeTo: plan.key === 'starter' ? 'professional' : 'enterprise',
      }, 402);
    }
  }

  const name = String(body.name || '').trim();
  if (name.length < 2) return bad('sub_account_name_required');
  const email = String(body.email || '').trim().toLowerCase();

  const tenantId = `t_${randHex(6)}`;
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO tenants (id, name, business_name, business_address, email, phone, logo, domain, colors, status, plan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
  ).bind(tenantId, name, String(body.businessName || name), String(body.businessAddress || ''), email,
    String(body.phone || ''), String(body.logo || ''), String(body.domain || ''),
    JSON.stringify(body.colors || safeJson(parentRow?.colors, {})), String(body.plan || parentRow?.plan || 'starter'), now, now).run();

  await env.DB.prepare(
    `INSERT INTO tenant_hierarchy (tenant_id, parent_tenant_id, label, revenue_share_pct, status, created_by, created_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`,
  ).bind(tenantId, a.tenant.id, String(body.label || name), Number(body.revenueSharePct || 0), a.user.id, now).run();

  // Seed the default pipeline so the child practice is usable immediately.
  await env.DB.prepare(
    `INSERT INTO pipelines (id, tenant_id, name, stages, color, is_default, created_at, updated_at)
     VALUES (?, ?, 'Sales Pipeline', ?, '#D4AF37', 1, ?, ?)`,
  ).bind(uuid(), tenantId, JSON.stringify([
    { id: 'stage-1', name: 'New Lead', position: 0 }, { id: 'stage-2', name: 'Contacted', position: 1 },
    { id: 'stage-3', name: 'Qualified', position: 2 }, { id: 'stage-4', name: 'Proposal', position: 3 },
    { id: 'stage-5', name: 'Negotiation', position: 4 }, { id: 'stage-6', name: 'Closed Won', position: 5 },
    { id: 'stage-7', name: 'Closed Lost', position: 6 },
  ]), now, now).run();

  // Optional owner login for the sub-account.
  let ownerUserId = '';
  if (email && body.ownerPassword) {
    const dupe = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (dupe) return json({ ok: false, error: 'owner_email_taken' }, 409);
    ownerUserId = `u_${randHex(6)}`;
    await env.DB.prepare(
      `INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?, ?)`,
    ).bind(ownerUserId, tenantId, email, String(body.ownerName || name),
      await hashPassword(String(body.ownerPassword), env.SESSION_SECRET), now, now).run();
  }

  await ensureComplianceRoster(env, tenantId);
  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'whitelabel.subaccount_created', resource: 'tenants', resourceId: tenantId, details: { name }, request });
  return json({ ok: true, tenantId, name, ownerUserId: ownerUserId || null, complianceAgents: COMPLIANCE_AGENTS.length }, 201);
}

async function listSubAccounts(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const parentRow = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(a.tenant.id).first<Record<string, any>>();
  const plan = planFor(parentRow);
  const ids = await childTenantIds(env, String(a.tenant.id));
  const items = [];
  for (const id of ids) {
    const t = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first<Record<string, any>>();
    if (!t) continue;
    const edge = await env.DB.prepare('SELECT * FROM tenant_hierarchy WHERE tenant_id = ?').bind(id).first<Record<string, any>>();
    const usage = await getUsage(env, id);
    const findings = await env.DB.prepare(`SELECT COUNT(*) AS n FROM compliance_findings WHERE tenant_id = ? AND status = 'open'`)
      .bind(id).first<Record<string, unknown>>();
    const domains = await env.DB.prepare('SELECT hostname, kind, status, is_primary FROM tenant_domains WHERE tenant_id = ?')
      .bind(id).all<Record<string, unknown>>();
    items.push({
      id, name: t.name, businessName: t.business_name, plan: t.plan, status: t.status,
      revenueSharePct: Number(edge?.revenue_share_pct || 0), createdAt: t.created_at,
      usage, openFindings: Number(findings?.n || 0), domains: domains.results || [],
    });
  }
  return json({ ok: true, items, limit: plan.subAccounts, used: items.length, plan: plan.key });
}

/* ── Custom domains ── */

async function addTenantDomain(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const hostname = String(body.hostname || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) return bad('valid_hostname_required');

  // A tenant may only claim a domain for itself or one of its own children.
  const tenantId = String(body.tenantId || a.tenant.id);
  if (tenantId !== String(a.tenant.id)) {
    const children = await childTenantIds(env, String(a.tenant.id));
    if (!children.includes(tenantId)) return json({ ok: false, error: 'forbidden_not_your_subaccount' }, 403);
  }

  const taken = await env.DB.prepare('SELECT tenant_id FROM tenant_domains WHERE hostname = ?').bind(hostname).first<Record<string, unknown>>();
  if (taken && String(taken.tenant_id) !== tenantId) return json({ ok: false, error: 'hostname_already_claimed' }, 409);

  const token = `tph-verify=${randHex(16)}`;
  const id = uuid();
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO tenant_domains (id, tenant_id, hostname, kind, status, verify_token, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
     ON CONFLICT(hostname) DO UPDATE SET kind = excluded.kind, verify_token = excluded.verify_token, updated_at = excluded.updated_at`,
  ).bind(id, tenantId, hostname, String(body.kind || 'portal'), token, body.isPrimary ? 1 : 0, now, now).run();

  await audit(env, { tenantId, userId: String(a.user.id), action: 'domain.claimed', resource: 'tenant_domains', resourceId: hostname, request });
  return json({
    ok: true, hostname, status: 'pending', verifyToken: token,
    dns: [
      { type: 'TXT', name: `_tph-verify.${hostname}`, value: token, purpose: 'Proves you control the domain' },
      { type: 'CNAME', name: hostname, value: 'tax-pro-hub-university.pages.dev', purpose: 'Routes traffic to the platform' },
    ],
    next: 'Add both records, then POST /api/domains/verify. Also add the hostname as a Custom Domain on the Pages project.',
  }, 201);
}

async function verifyTenantDomain(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const hostname = String(body.hostname || '').trim().toLowerCase();
  const row = await env.DB.prepare('SELECT * FROM tenant_domains WHERE hostname = ?').bind(hostname).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'domain_not_claimed' }, 404);

  const children = await childTenantIds(env, String(a.tenant.id));
  if (String(row.tenant_id) !== String(a.tenant.id) && !children.includes(String(row.tenant_id))) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  // DNS-over-HTTPS lookup of the verification TXT record.
  let verified = false; let observed: string[] = [];
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=_tph-verify.${hostname}&type=TXT`, {
      headers: { accept: 'application/dns-json' },
    });
    const dns = await res.json() as any;
    observed = (dns.Answer || []).map((x: any) => String(x.data || '').replace(/"/g, ''));
    verified = observed.some((v) => v === String(row.verify_token));
  } catch (e) {
    return json({ ok: false, error: 'dns_lookup_failed', detail: String(e).slice(0, 160) }, 502);
  }

  const now = nowIso();
  await env.DB.prepare('UPDATE tenant_domains SET status = ?, verified_at = ?, updated_at = ? WHERE hostname = ?')
    .bind(verified ? 'active' : 'failed', verified ? now : null, now, hostname).run();
  await audit(env, { tenantId: String(row.tenant_id), userId: String(a.user.id), action: verified ? 'domain.verified' : 'domain.verify_failed', resource: 'tenant_domains', resourceId: hostname, request });
  return json({ ok: verified, hostname, status: verified ? 'active' : 'failed', observed, expected: row.verify_token });
}

async function listTenantDomains(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const ids = [String(a.tenant.id), ...(await childTenantIds(env, String(a.tenant.id)))];
  const rows = await env.DB.prepare(
    `SELECT * FROM tenant_domains WHERE tenant_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC`,
  ).bind(...ids).all<Record<string, unknown>>();
  return json({ ok: true, items: rows.results || [] });
}

/**
 * Public branding resolver — a white-labelled portal/form host asks
 * "who am I?" before rendering. Unauthenticated by design.
 */
async function resolveBranding(env: Env, request: Request, url: URL) {
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const hostname = (url.searchParams.get('host') || request.headers.get('Host') || '').toLowerCase().split(':')[0];
  const domain = await env.DB.prepare(`SELECT * FROM tenant_domains WHERE hostname = ? AND status = 'active'`)
    .bind(hostname).first<Record<string, any>>();
  if (!domain) return json({ ok: true, matched: false, hostname, note: 'No active white-label domain for this host — platform branding applies.' });
  const t = await env.DB.prepare('SELECT id, name, business_name, logo, colors, email, phone FROM tenants WHERE id = ?')
    .bind(domain.tenant_id).first<Record<string, any>>();
  if (!t) return json({ ok: true, matched: false, hostname });
  return json({
    ok: true, matched: true, hostname, kind: domain.kind,
    tenant: {
      id: t.id, name: t.name, businessName: t.business_name, logo: t.logo,
      colors: safeJson(t.colors, {}), email: t.email, phone: t.phone,
    },
  });
}


/* ═══════════════ IRS E-FILE PIPELINE (MeF lifecycle) ═══════════════
 * Tracks the real submission lifecycle: draft → ready → transmitted →
 * accepted | rejected → perfected. Reject codes carry the published IRS
 * meaning and the fix, and a rejected 1040 automatically opens a task with
 * the Pub 1345 five-day perfection deadline.
 *
 * Transmission itself requires an authorized MeF provider (Drake, TaxSlayer,
 * CCH, or direct A2A). Without EFILE_PROVIDER_URL/KEY the endpoints operate in
 * "manual" mode: you record the submission id and acknowledgement yourself,
 * and nothing is ever faked as accepted.
 */

const IRS_REJECT_CODES: Record<string, { meaning: string; fix: string }> = {
  'IND-031-04': {
    meaning: 'Prior-year AGI or Self-Select PIN does not match IRS records for the primary taxpayer.',
    fix: 'Pull the prior-year AGI from the IRS transcript (not the client’s copy) and retransmit.',
  },
  'IND-032-04': {
    meaning: 'Prior-year AGI or PIN mismatch for the spouse on a joint return.',
    fix: 'Verify the spouse’s prior-year AGI separately — it differs when they filed separately last year.',
  },
  'IND-181-01': {
    meaning: 'Identity Protection PIN missing when the IRS has one on file.',
    fix: 'Obtain the client’s current-year IP PIN from their CP01A notice or IRS online account.',
  },
  'IND-996': {
    meaning: 'Dependent’s Identity Protection PIN is missing or incorrect.',
    fix: 'Collect the dependent’s IP PIN; it is issued annually and changes each January.',
  },
  'F1040-512': {
    meaning: 'A dependent SSN on this return was already claimed on another accepted return.',
    fix: 'Confirm the client’s right to claim; if valid, the return must be paper-filed with substantiation.',
  },
  'R0000-500-01': {
    meaning: 'Primary taxpayer SSN and name control do not match IRS/SSA records.',
    fix: 'Match the name exactly to the Social Security card; a recent name change may not be posted yet.',
  },
  'R0000-902-01': {
    meaning: 'A return with this SSN has already been accepted for this tax year.',
    fix: 'Likely identity theft or a duplicate filing — file Form 14039 and paper-file the return.',
  },
  'SEIC-F1040-501-02': {
    meaning: 'Qualifying child SSN/name control mismatch on Schedule EIC.',
    fix: 'Verify the child’s SSN card details; EIC due-diligence documentation must be retained.',
  },
  'F8962-070': {
    meaning: 'Form 8962 is missing though a Form 1095-A was issued to the household.',
    fix: 'Attach Form 8962 reconciling the premium tax credit and retransmit.',
  },
};

const PERFECTION_DAYS: Record<string, number> = { '1040': 5, '1065': 10, '1120': 10, '1120S': 10, '941': 10 };

async function createEfileSubmission(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const taxYear = String(body.taxYear || new Date().getFullYear() - 1);
  const returnType = String(body.returnType || '1040');
  const id = uuid();
  const now = nowIso();

  // EFIN comes from the practice's preparer records — never invented.
  const efinRow = await env.DB.prepare(`SELECT efin FROM preparers WHERE tenant_id = ? AND efin IS NOT NULL AND efin != '' LIMIT 1`)
    .bind(a.tenant.id).first<Record<string, unknown>>();

  await env.DB.prepare(
    `INSERT INTO efile_submissions (id, tenant_id, deal_id, contact_id, return_type, tax_year, jurisdiction, efin,
       provider, status, refund_cents, balance_due_cents, notes, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
  ).bind(id, a.tenant.id, body.dealId || null, body.contactId || null, returnType, taxYear,
    String(body.jurisdiction || 'federal'), String(efinRow?.efin || ''),
    env.EFILE_PROVIDER_URL ? 'mef_provider' : 'manual',
    Number(body.refundCents || 0), Number(body.balanceDueCents || 0), String(body.notes || ''),
    a.user.id, now, now).run();

  await env.DB.prepare(`INSERT INTO efile_events (id, tenant_id, submission_id, event, detail, created_at) VALUES (?, ?, ?, 'created', ?, ?)`)
    .bind(uuid(), a.tenant.id, id, JSON.stringify({ returnType, taxYear }), now).run();

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'efile.created', resource: 'efile_submissions', resourceId: id, request });
  return json({ ok: true, id, status: 'draft', efin: efinRow?.efin || null, provider: env.EFILE_PROVIDER_URL ? 'mef_provider' : 'manual' }, 201);
}

/** Transmit through the configured MeF provider, or arm manual tracking. */
async function transmitEfile(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const sub = await env.DB.prepare('SELECT * FROM efile_submissions WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!sub) return json({ ok: false, error: 'not_found' }, 404);
  if (sub.status === 'accepted') return json({ ok: false, error: 'already_accepted' }, 409);

  // Hard gate: Form 8879 must be signed before an ERO may transmit (Pub 1345).
  if (sub.contact_id) {
    const signed = await env.DB.prepare(
      `SELECT id FROM signature_requests WHERE tenant_id = ? AND contact_id = ? AND doc_type = 'form_8879' AND status = 'signed'`,
    ).bind(a.tenant.id, sub.contact_id).first();
    if (!signed) {
      return json({
        ok: false, error: 'form_8879_not_signed',
        hint: 'IRS Pub 1345 forbids transmitting before the taxpayer signs Form 8879. Send it for signature first.',
      }, 428);
    }
  }
  if (!sub.efin) {
    return json({ ok: false, error: 'efin_missing', hint: 'Record the firm EFIN on a preparer profile before transmitting.' }, 428);
  }

  const now = nowIso();
  if (!env.EFILE_PROVIDER_URL || !env.EFILE_PROVIDER_KEY) {
    // Manual mode — arm tracking, never claim the IRS accepted anything.
    await env.DB.prepare(`UPDATE efile_submissions SET status = 'ready', updated_at = ? WHERE id = ?`).bind(now, id).run();
    await env.DB.prepare(`INSERT INTO efile_events (id, tenant_id, submission_id, event, detail, created_at) VALUES (?, ?, ?, 'ready_manual', '{}', ?)`)
      .bind(uuid(), a.tenant.id, id, now).run();
    return json({
      ok: true, status: 'ready', mode: 'manual', configured: false,
      hint: 'No MeF provider configured. Transmit in your provider software, then POST /api/efile/submissions/:id/ack with the submission id and acknowledgement.',
      needs: ['EFILE_PROVIDER_URL', 'EFILE_PROVIDER_KEY'],
    });
  }

  try {
    const res = await fetch(`${env.EFILE_PROVIDER_URL.replace(/\/$/, '')}/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.EFILE_PROVIDER_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ efin: sub.efin, returnType: sub.return_type, taxYear: sub.tax_year, reference: id }),
    });
    const data = await res.json().catch(() => ({})) as Record<string, any>;
    if (!res.ok) {
      await env.DB.prepare(`INSERT INTO efile_events (id, tenant_id, submission_id, event, detail, created_at) VALUES (?, ?, ?, 'transmit_failed', ?, ?)`)
        .bind(uuid(), a.tenant.id, id, JSON.stringify(data).slice(0, 400), now).run();
      return json({ ok: false, error: 'provider_error', detail: data }, 502);
    }
    await env.DB.prepare(`UPDATE efile_submissions SET status = 'transmitted', submission_id = ?, transmitted_at = ?, updated_at = ? WHERE id = ?`)
      .bind(String(data.submissionId || ''), now, now, id).run();
    await env.DB.prepare(`INSERT INTO efile_events (id, tenant_id, submission_id, event, detail, created_at) VALUES (?, ?, ?, 'transmitted', ?, ?)`)
      .bind(uuid(), a.tenant.id, id, JSON.stringify({ submissionId: data.submissionId }), now).run();
    return json({ ok: true, status: 'transmitted', submissionId: data.submissionId });
  } catch (e) {
    return json({ ok: false, error: 'provider_unreachable', detail: String(e).slice(0, 200) }, 502);
  }
}

/** Record an acknowledgement — from the provider poll, a webhook, or manually. */
async function ackEfile(env: Env, request: Request, id: string, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const sub = await env.DB.prepare('SELECT * FROM efile_submissions WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!sub) return json({ ok: false, error: 'not_found' }, 404);

  const status = String(body.status || '').toLowerCase();
  if (!['accepted', 'rejected'].includes(status)) return bad('status_must_be_accepted_or_rejected');
  const codes: string[] = Array.isArray(body.rejectCodes) ? body.rejectCodes.map(String) : [];
  const now = nowIso();
  const days = PERFECTION_DAYS[String(sub.return_type)] || 10;
  const deadline = status === 'rejected' ? new Date(Date.now() + days * 86400000).toISOString() : null;

  await env.DB.prepare(
    `UPDATE efile_submissions SET status = ?, ack_code = ?, reject_codes = ?, acked_at = ?, perfection_deadline = ?,
       submission_id = COALESCE(NULLIF(?, ''), submission_id), updated_at = ? WHERE id = ?`,
  ).bind(status, String(body.ackCode || ''), JSON.stringify(codes), now, deadline, String(body.submissionId || ''), now, id).run();

  await env.DB.prepare(`INSERT INTO efile_events (id, tenant_id, submission_id, event, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(uuid(), a.tenant.id, id, status, JSON.stringify({ codes, ackCode: body.ackCode }), now).run();

  const explained = codes.map((c) => ({ code: c, ...(IRS_REJECT_CODES[c] || { meaning: 'Code not in the local knowledge base — check the IRS Business Rules index.', fix: 'Review the provider acknowledgement detail.' }) }));

  if (status === 'rejected') {
    // Rejections become real work with the statutory perfection window attached.
    await env.DB.prepare(
      `INSERT INTO tasks (id, tenant_id, title, description, contact_id, deal_id, priority, status, due_at, tags, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'urgent', 'To-Do', ?, ?, 'efile', ?, ?)`,
    ).bind(uuid(), a.tenant.id,
      `Perfect rejected ${sub.return_type} (${codes.join(', ') || 'no code'})`,
      explained.map((e) => `${e.code}: ${e.meaning}\nFix: ${e.fix}`).join('\n\n'),
      sub.contact_id, sub.deal_id, deadline, JSON.stringify(['E-file', 'Rejection']), now, now).run();
  } else if (sub.deal_id) {
    await env.DB.prepare(`UPDATE deals SET probability = 100, updated_at = ? WHERE id = ? AND tenant_id = ?`)
      .bind(now, sub.deal_id, a.tenant.id).run();
  }

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: `efile.${status}`, resource: 'efile_submissions', resourceId: id, details: { codes }, request });
  return json({ ok: true, status, rejectCodes: explained, perfectionDeadline: deadline });
}

async function listEfile(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const rows = await env.DB.prepare('SELECT * FROM efile_submissions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 200')
    .bind(a.tenant.id).all<Record<string, any>>();
  const items = (rows.results || []).map((r) => ({
    ...r,
    reject_codes: safeJson<string[]>(r.reject_codes, []),
    rejectDetail: safeJson<string[]>(r.reject_codes, []).map((c) => ({ code: c, ...(IRS_REJECT_CODES[c] || {}) })),
  }));
  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[String(i.status)] = (counts[String(i.status)] || 0) + 1; });
  return json({ ok: true, items, counts, providerConfigured: !!env.EFILE_PROVIDER_URL, rejectCodeBook: Object.keys(IRS_REJECT_CODES).length });
}

/* ═══════════════ BANK PRODUCTS (refund advance / RT) ═══════════════ */

async function createBankProduct(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const type = String(body.productType || 'refund_transfer');
  if (!['refund_advance', 'refund_transfer', 'rac'].includes(type)) return bad('unknown_product_type');
  const requested = Number(body.requestedCents || 0);
  const prepFee = Number(body.prepFeeCents || 0);
  const bankFee = Number(body.bankFeeCents || 0);

  // Truth-in-lending style guard: the client must have signed a disclosure.
  const disclosure = body.contactId
    ? await env.DB.prepare(
        `SELECT id FROM signature_requests WHERE tenant_id = ? AND contact_id = ? AND status = 'signed'
         AND doc_type IN ('bank_disclosure', 'engagement_letter') ORDER BY signed_at DESC LIMIT 1`,
      ).bind(a.tenant.id, body.contactId).first<Record<string, unknown>>()
    : null;

  const id = uuid();
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO bank_products (id, tenant_id, contact_id, deal_id, efile_id, product_type, bank, requested_cents,
       prep_fee_cents, bank_fee_cents, status, disbursement, disclosure_signed_id, applied_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, ?, ?)`,
  ).bind(id, a.tenant.id, body.contactId || null, body.dealId || null, body.efileId || null, type,
    String(body.bank || ''), requested, prepFee, bankFee, String(body.disbursement || 'direct_deposit'),
    disclosure?.id || null, now, now, now).run();

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: 'bank.applied', resource: 'bank_products', resourceId: id, details: { type, requested }, request });
  return json({
    ok: true, id, status: 'applied', productType: type,
    disclosureOnFile: !!disclosure,
    warning: disclosure ? undefined : 'No signed client agreement found — bank product disclosures must be delivered and signed before funding.',
  }, 201);
}

async function decideBankProduct(env: Env, request: Request, id: string, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM bank_products WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);

  const status = String(body.status || '');
  if (!['approved', 'denied', 'funded', 'settled', 'cancelled'].includes(status)) return bad('invalid_status');

  const approved = Number(body.approvedCents ?? row.approved_cents ?? 0);
  const net = Math.max(0, approved - Number(row.prep_fee_cents || 0) - Number(row.bank_fee_cents || 0));
  const now = nowIso();

  if (status === 'funded' && !row.disclosure_signed_id) {
    return json({
      ok: false, error: 'disclosure_required',
      hint: 'A signed client agreement/disclosure must exist before a bank product is funded.',
    }, 428);
  }

  await env.DB.prepare(
    `UPDATE bank_products SET status = ?, approved_cents = ?, net_to_client_cents = ?, denial_reason = ?,
       decided_at = COALESCE(decided_at, ?), funded_at = ?, updated_at = ? WHERE id = ?`,
  ).bind(status, approved, net, String(body.denialReason || ''), now,
    status === 'funded' ? now : row.funded_at, now, id).run();

  await audit(env, { tenantId: String(a.tenant.id), userId: String(a.user.id), action: `bank.${status}`, resource: 'bank_products', resourceId: id, details: { approved, net }, request });
  return json({ ok: true, id, status, approvedCents: approved, netToClientCents: net });
}

async function listBankProducts(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const rows = await env.DB.prepare('SELECT * FROM bank_products WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 200')
    .bind(a.tenant.id).all<Record<string, any>>();
  const items = rows.results || [];
  const totals = {
    applied: items.length,
    fundedCents: items.filter((i) => i.status === 'funded' || i.status === 'settled').reduce((s, i) => s + Number(i.approved_cents || 0), 0),
    prepFeesCents: items.reduce((s, i) => s + Number(i.prep_fee_cents || 0), 0),
    missingDisclosures: items.filter((i) => !i.disclosure_signed_id).length,
  };
  return json({ ok: true, items, totals });
}

/* ═══════════ PRIVACY — data export & right-to-erasure (DSAR) ═══════════ */

async function privacyRequest(env: Env, request: Request, body: Record<string, any>) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);

  const kind = String(body.kind || 'export');
  if (!['export', 'erasure'].includes(kind)) return bad('kind_must_be_export_or_erasure');
  const contactId = String(body.contactId || '');
  if (!contactId) return bad('contactId_required');

  const tenantId = String(a.tenant.id);
  const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?')
    .bind(contactId, tenantId).first<Record<string, any>>();
  if (!contact) return json({ ok: false, error: 'contact_not_found' }, 404);

  const q = async (sql: string, ...b: unknown[]) =>
    ((await env.DB!.prepare(sql).bind(...b).all<Record<string, any>>()).results || []);

  const bundle = {
    generatedAt: nowIso(),
    requestedBy: a.user.email,
    tenantId,
    contact,
    deals: await q('SELECT * FROM deals WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    appointments: await q('SELECT * FROM appointments WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    documents: await q('SELECT id, name, folder, doc_type, size, sha256, created_at FROM files WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    signatures: await q('SELECT id, title, doc_type, status, signed_at, signature_ip FROM signature_requests WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    invoices: await q('SELECT id, number, amount_cents, status, paid_at FROM invoices WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    submissions: await q('SELECT id, form_id, payload, source, created_at FROM form_submissions WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    efile: await q('SELECT id, return_type, tax_year, status, acked_at FROM efile_submissions WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    bankProducts: await q('SELECT id, product_type, status, approved_cents, funded_at FROM bank_products WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
    campaignHistory: await q('SELECT campaign_id, channel, status, sent_at FROM campaign_recipients WHERE tenant_id = ? AND contact_id = ?', tenantId, contactId),
  };

  const text = JSON.stringify(bundle, null, 2);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = uuid();
  const title = `dsar-${kind}-${contactId.slice(0, 8)}-${nowIso().slice(0, 10)}.json`;
  let key = '';
  if (env.DOCS) {
    key = `tenants/${tenantId}/dsar/${id}/${title}`;
    await env.DOCS.put(key, bytes, { httpMetadata: { contentType: 'application/json' }, customMetadata: { kind: `dsar-${kind}`, sha256: sha } });
  }

  const recordCount = Object.values(bundle).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
  let status = 'complete';
  let retained = '';

  if (kind === 'erasure') {
    // Tax records carry a statutory retention floor — erase marketing data,
    // pseudonymize the identity, and disclose exactly what must be retained.
    const taxDocs = bundle.documents.length;
    const returns = bundle.efile.length;
    const now = nowIso();

    await env.DB.prepare(
      `UPDATE contacts SET first_name = 'Erased', last_name = 'Contact', email = ?, phone = '', company = '',
         notes = '[]', activities = '[]', custom_fields = '{}', tags = ?, status = 'erased', updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
    ).bind(`erased+${contactId.slice(0, 8)}@redacted.invalid`, JSON.stringify(['Erased']), now, contactId, tenantId).run();
    await env.DB.prepare('DELETE FROM campaign_recipients WHERE tenant_id = ? AND contact_id = ?').bind(tenantId, contactId).run();
    await env.DB.prepare('DELETE FROM form_submissions WHERE tenant_id = ? AND contact_id = ?').bind(tenantId, contactId).run();
    await env.DB.prepare(`UPDATE workflow_runs SET status = 'cancelled', updated_at = ? WHERE tenant_id = ? AND contact_id = ?`)
      .bind(now, tenantId, contactId).run();
    await env.DB.prepare('DELETE FROM portal_sessions WHERE tenant_id = ? AND contact_id = ?').bind(tenantId, contactId).run();
    await env.DB.prepare('DELETE FROM portal_tokens WHERE tenant_id = ? AND contact_id = ?').bind(tenantId, contactId).run();

    if (taxDocs || returns) {
      status = 'partial_legal_hold';
      retained = `${taxDocs} tax document(s) and ${returns} filed return record(s) retained under IRC §6107(b) ` +
        '(three-year preparer retention) and the practice records schedule. Marketing data, submissions, ' +
        'portal sessions and identity fields were erased or pseudonymized.';
    } else {
      retained = 'No statutory records required retention; all identifying data erased or pseudonymized.';
    }
  }

  await env.DB.prepare(
    `INSERT INTO data_requests (id, tenant_id, contact_id, kind, status, requested_by, r2_key, size, sha256, records_count, retained_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, tenantId, contactId, kind, status, String(a.user.email), key, bytes.length, sha, recordCount, retained, nowIso()).run();

  await audit(env, { tenantId, userId: String(a.user.id), action: `privacy.${kind}`, resource: 'data_requests', resourceId: id, details: { contactId, recordCount, status }, request });
  return json({
    ok: true, id, kind, status, recordCount, sizeBytes: bytes.length, sha256: sha,
    retainedNote: retained || undefined, archived: !!key,
    downloadUrl: `/api/privacy/requests/${id}/download`,
  }, 201);
}

async function listPrivacyRequests(env: Env, request: Request) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const rows = await env.DB.prepare('SELECT * FROM data_requests WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100')
    .bind(a.tenant.id).all<Record<string, unknown>>();
  return json({ ok: true, items: (rows.results || []).map((r) => ({ ...r, downloadUrl: `/api/privacy/requests/${r.id}/download` })) });
}

async function downloadPrivacyRequest(env: Env, request: Request, id: string) {
  const a = await auth(env, request);
  if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
  if (!env.DB) return notConfigured('database', ['npm run cf:setup']);
  const row = await env.DB.prepare('SELECT * FROM data_requests WHERE id = ? AND tenant_id = ?')
    .bind(id, a.tenant.id).first<Record<string, any>>();
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  if (!env.DOCS || !row.r2_key) return json({ ok: false, error: 'no_object_store' }, 410);
  const obj = await env.DOCS.get(String(row.r2_key));
  if (!obj) return json({ ok: false, error: 'object_missing' }, 410);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="dsar-${row.kind}-${id.slice(0, 8)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

/* ═══════════════════════════ ROUTER ═══════════════════════════ */
export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env, params } = ctx;
  if (request.method === 'OPTIONS') return json({ ok: true }, 200, request);
  const route = '/' + (params.route || []).join('/');

  try {
    /* ── Health ── */
    if (request.method === 'GET' && route === '/health') return health(env);

    /* ── Auth ── */
    if (route === '/auth/signup' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return handleSignup(env, request, body);
    }
    if (route === '/auth/login' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return handleLogin(env, request, body);
    }
    if (route === '/auth/me' && request.method === 'GET') return handleMe(env, request);
    if (route === '/auth/logout' && request.method === 'POST') return handleLogout(env, request);
    if (route === '/auth/change-password' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return handleChangePassword(env, request, body);
    }

    /* ── Bootstrap ── */
    if (route === '/v1/bootstrap' && request.method === 'GET') return handleBootstrap(env, request);

    /* ── IRS e-file pipeline ── */
    if (route === '/efile/submissions' && request.method === 'GET') return listEfile(env, request);
    if (route === '/efile/submissions' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createEfileSubmission(env, request, body);
    }
    if (/^\/efile\/submissions\/[^/]+\/transmit$/.test(route) && request.method === 'POST') {
      return transmitEfile(env, request, route.split('/')[3]);
    }
    if (/^\/efile\/submissions\/[^/]+\/ack$/.test(route) && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return ackEfile(env, request, route.split('/')[3], body);
    }

    /* ── Bank products ── */
    if (route === '/bank/products' && request.method === 'GET') return listBankProducts(env, request);
    if (route === '/bank/products' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createBankProduct(env, request, body);
    }
    if (/^\/bank\/products\/[^/]+$/.test(route) && request.method === 'PUT') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return decideBankProduct(env, request, route.split('/')[3], body);
    }

    /* ── Privacy (DSAR) ── */
    if (route === '/privacy/requests' && request.method === 'GET') return listPrivacyRequests(env, request);
    if (route === '/privacy/requests' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return privacyRequest(env, request, body);
    }
    if (/^\/privacy\/requests\/[^/]+\/download$/.test(route) && request.method === 'GET') {
      return downloadPrivacyRequest(env, request, route.split('/')[3]);
    }

    /* ── White-label sub-accounts & domains ── */
    if (route === '/subaccounts' && request.method === 'GET') return listSubAccounts(env, request);
    if (route === '/subaccounts' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createSubAccount(env, request, body);
    }
    if (route === '/domains' && request.method === 'GET') return listTenantDomains(env, request);
    if (route === '/domains' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return addTenantDomain(env, request, body);
    }
    if (route === '/domains/verify' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return verifyTenantDomain(env, request, body);
    }
    if (route === '/branding' && request.method === 'GET') return resolveBranding(env, request, new URL(request.url));

    /* ── Public intake (unauthenticated) ── */
    if (route.startsWith('/public/forms/')) {
      const parts = route.split('/').filter(Boolean); // ['public','forms',tenantId,slug]
      const tenantId = parts[2]; const slug = parts.slice(3).join('/');
      if (!tenantId || !slug) return json({ ok: false, error: 'form_path_required' }, 400);
      if (request.method === 'GET') return publicFormDefinition(env, tenantId, slug);
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        return publicFormSubmit(env, request, tenantId, slug, body);
      }
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }
    if (route === '/submissions' && request.method === 'GET') return listSubmissions(env, request, new URL(request.url));

    /* ── Payout runs ── */
    if (route === '/payouts/runs' && request.method === 'GET') return listPayoutRuns(env, request);
    if (route === '/payouts/runs' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createPayoutRun(env, request, body);
    }
    if (/^\/payouts\/runs\/[^/]+\/execute$/.test(route) && request.method === 'POST') {
      return executePayoutRun(env, request, route.split('/')[3]);
    }
    if (/^\/preparers\/[^/]+\/payment-account$/.test(route) && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return setPreparerPaymentAccount(env, request, route.split('/')[2], body);
    }

    /* ── Compliance evidence exports ── */
    if (route === '/compliance/evidence' && request.method === 'GET') return listEvidenceExports(env, request);
    if (route === '/compliance/evidence' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return buildEvidenceBundle(env, request, body);
    }
    if (/^\/compliance\/evidence\/[^/]+\/download$/.test(route) && request.method === 'GET') {
      return downloadEvidence(env, request, route.split('/')[3]);
    }

    /* ── Plans, metering, platform admin ── */
    if (route === '/plan' && request.method === 'GET') return planStatus(env, request);
    if (route === '/platform/overview' && request.method === 'GET') return platformOverview(env, request);
    if (route === '/platform/plan' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return setTenantPlan(env, request, body);
    }

    /* ── MFA (TOTP) ── */
    if (route === '/auth/mfa' && request.method === 'GET') return mfaStatus(env, request);
    if (route === '/auth/mfa/setup' && request.method === 'POST') return mfaSetup(env, request);
    if (route === '/auth/mfa/confirm' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return mfaConfirm(env, request, body);
    }
    if (route === '/auth/mfa/disable' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return mfaDisable(env, request, body);
    }

    /* ── E-signature ── */
    if (route === '/esign/requests' && request.method === 'GET') return listSignatureRequests(env, request, new URL(request.url));
    if (route === '/esign/requests' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createSignatureRequest(env, request, body);
    }
    if (/^\/esign\/requests\/[^/]+\/certificate$/.test(route) && request.method === 'GET') {
      return signatureCertificate(env, request, route.split('/')[3]);
    }
    if (route.startsWith('/esign/document/') && request.method === 'GET') {
      return getSignatureByToken(env, request, route.split('/')[3]);
    }
    if (route === '/esign/sign' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return signByToken(env, request, body);
    }

    /* ── Invoicing ── */
    if (route === '/invoices' && request.method === 'GET') return listInvoices(env, request, new URL(request.url));
    if (route === '/invoices' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return createInvoice(env, request, body);
    }

    /* ── Live event stream (SSE) ── */
    if (route === '/stream' && request.method === 'GET') return liveStream(env, request);

    /* ── Compliance Command Center ── */
    if (route === '/compliance/overview' && request.method === 'GET') return complianceOverview(env, request);
    if (route === '/compliance/run' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return complianceRun(env, request, body);
    }
    if (/^\/compliance\/findings\/[^/]+$/.test(route) && (request.method === 'PUT' || request.method === 'POST')) {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return complianceFindingAction(env, request, route.split('/')[3], body);
    }

    /* ── Delivery engine ── */
    if (request.method === 'POST' && /^\/campaigns\/[^/]+\/schedule$/.test(route)) {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return scheduleCampaign(env, request, route.split('/')[2], body);
    }
    if (request.method === 'POST' && /^\/campaigns\/[^/]+\/send-now$/.test(route)) {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return scheduleCampaign(env, request, route.split('/')[2], { ...body, sendAt: nowIso() });
    }
    if (request.method === 'GET' && /^\/campaigns\/[^/]+\/stats$/.test(route)) {
      return campaignStats(env, request, route.split('/')[2]);
    }
    if (request.method === 'POST' && /^\/workflows\/[^/]+\/enroll$/.test(route)) {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return enrollWorkflow(env, request, route.split('/')[2], body);
    }
    if (route === '/cron/tick' && (request.method === 'POST' || request.method === 'GET')) return cronTick(env, request);

    /* ── Client portal (passwordless) ── */
    if (route === '/portal/request-link' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return portalRequestLink(env, request, body);
    }
    if (route === '/portal/verify' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return portalVerify(env, request, body);
    }
    if (route === '/portal/me' && request.method === 'GET') return portalMe(env, request);
    if (route === '/portal/files' && request.method === 'POST') return portalUpload(env, request);
    if (/^\/portal\/files\/[^/]+\/download$/.test(route) && request.method === 'GET') {
      return portalDownload(env, request, route.split('/')[3]);
    }

    /* ── Secure document vault (R2) — must precede the generic CRUD block ── */
    if (route === '/v1/files' && request.method === 'GET') return listFiles(env, request, new URL(request.url));
    if (route === '/v1/files' && request.method === 'POST') return uploadFile(env, request);
    if (route.startsWith('/v1/files/')) {
      const parts = route.split('/').filter(Boolean); // ['v1','files',id,'download'?]
      const fileId = parts[2];
      if (parts[3] === 'download' && request.method === 'GET') return downloadFile(env, request, fileId);
      if (request.method === 'GET') return downloadFile(env, request, fileId);
      if (request.method === 'DELETE') return deleteFile(env, request, fileId);
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    /* ── Generic CRUD: /api/v1/:entity[/:id] ── */
    if (route.startsWith('/v1/')) {
      const parts = route.split('/').filter(Boolean); // ['v1', entity, id?]
      const entity = parts[1];
      const id = parts[2] || null;
      if (!entity || !isEntity(entity)) return json({ ok: false, error: 'unknown_entity', entity }, 404);

      if (request.method === 'GET' && !id) return listEntity(env, request, entity, new URL(request.url));
      if (request.method === 'POST' && !id) {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        return upsertEntity(env, request, entity, null, body);
      }
      if (request.method === 'GET' && id) return getEntity(env, request, entity, id);
      if (request.method === 'PUT' && id) {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        return upsertEntity(env, request, entity, id, body);
      }
      if (request.method === 'DELETE' && id) return deleteEntity(env, request, entity, id);
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    /* ── API keys (hashed in D1, shown once) ── */
    if (route === '/keys') {
      if (request.method === 'GET') {
        const a = await auth(env, request);
        if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
        if (!env.DB) return notConfigured('database', ['D1 binding required to store API keys']);
        const rows = await env.DB.prepare(
          'SELECT id, name, scopes, created_at, revoked_at FROM api_keys WHERE tenant_id = ?',
        ).bind(String(a.tenant.id)).all<Record<string, unknown>>();
        return json({ ok: true, keys: rows.results?.map((r) => ({ id: r.id, name: r.name, scopes: safeJson(r.scopes, []), createdAt: r.created_at, revoked: !!r.revoked_at })) || [] });
      }
      if (request.method === 'POST') {
        const a = await auth(env, request);
        if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        const raw = 'vtp_live_' + randHex(24);
        const hash = await sha256(raw);
        if (env.DB) {
          await env.DB.prepare('INSERT INTO api_keys (id, tenant_id, name, key_hash, scopes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(uuid(), String(a.tenant.id), String(body.name || 'Unnamed key'), hash, JSON.stringify(Array.isArray(body.scopes) ? body.scopes : ['contacts:read']), nowIso()).run();
          return json({ ok: true, key: raw, keyHash: hash, name: body.name || 'Unnamed key', scopes: Array.isArray(body.scopes) ? body.scopes : ['contacts:read'], persisted: 'd1' });
        }
        return json({ ok: true, key: raw, keyHash: hash, persisted: false, note: 'Bind D1 to persist key hashes and enforce auth on /api/v1/*.' });
      }
      if (request.method === 'DELETE') {
        const a = await auth(env, request);
        if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
        const url = new URL(request.url);
        const id = url.searchParams.get('id') || '';
        if (env.DB && id) await env.DB.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ? AND tenant_id = ?')
          .bind(nowIso(), id, String(a.tenant.id)).run();
        return json({ ok: true, revoked: id });
      }
    }

    /* ── Tenant provisioning (Studio + self-serve) ── */
    if (request.method === 'POST' && route === '/tenants/provision') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      if (env.DB) {
        const res = await handleSignup(env, request, body);
        // handleSignup persists tenant + owner + pipeline; flatten to a clean provisioning receipt
        const data = await res.json() as Record<string, unknown>;
        return json({
          ok: data.ok,
          tenant: data.tenant || null,
          token: data.token,
          provisioned: ['branded_portal', 'pipelines', 'drip_sequences_x8', 'bank_products_desk', 'client_portal', 'esign', 'lead_magnets_branded'],
        });
      }
      const slug = String(body?.businessName || 'tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return json({
        ok: true,
        tenant: { id: `sa-${Date.now()}`, businessName: body?.businessName || 'Unnamed', domain: `${slug}.taxprohubuniversity.com`, plan: body?.plan || 'growth' },
        note: 'Stateless provisioning echo (no D1 binding). Run npm run cf:setup for durable provisioning.',
      });
    }

    /* ── Bulk import (dedupe by email, tenant-scoped) ── */
    if (request.method === 'POST' && route === '/import') {
      const a = await auth(env, request);
      if (!a) return json({ ok: false, error: 'unauthenticated' }, 401);
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      const rows = Array.isArray(body?.contacts) ? body.contacts : [];
      let created = 0, updated = 0;
      if (env.DB) {
        for (const c of rows as Record<string, unknown>[]) {
          const email = String(c.email || '').toLowerCase();
          if (!email) continue;
          const existing = await env.DB.prepare('SELECT id FROM contacts WHERE tenant_id = ? AND email = ?')
            .bind(String(a.tenant.id), email).first<{ id: string }>();
          await upsertEntity(env, request, 'contacts', existing?.id || null, { ...c, email });
          existing ? updated++ : created++;
        }
      }
      return json({ ok: true, source: body?.source || 'csv', received: rows.length, created, updated, persisted: !!env.DB });
    }

    /* ── Static-feature endpoints ── */
    if (request.method === 'GET' && route === '/bank/status') {
      return json({
        ok: true,
        partners: [
          { partner: 'TPG', enrolled: true, live: false, note: 'Set TPG_API_KEY secret to poll the Santa Barbara TPG reports API.' },
          { partner: 'EPS', enrolled: true, live: false, note: 'Set EPS_API_KEY secret to poll EPS Financial funding events.' },
          { partner: 'Refund Advantage', enrolled: true, live: false, note: 'Set RA_API_KEY secret to poll Refund Advantage disbursements.' },
          { partner: 'Republic Bank', enrolled: false, live: false, note: 'Complete Republic Bank enrollment, then set REPUBLIC_API_KEY.' },
        ],
        note: 'Client UI at /#/bank-products consumes this feed. Statuses map to: irs_pending → irs_funded → fees_deducted → disbursed. Bureau overrides accrue via POST /api/payouts/accrue.',
      });
    }

    if (request.method === 'POST') {
      const needsBody = route !== '/stripe/webhook';
      const body = needsBody ? await request.json().catch(() => ({})) as Record<string, unknown> : null;
      switch (route) {
        case '/sms/send': return sendSMS(env, String(body!.to || ''), String(body!.body || ''));
        case '/email/send': return sendEmail(env, body as any);
        case '/stripe/checkout': return stripeCheckout(env, body as any);
        case '/stripe/connect': return stripeConnectTransfer(env, body as any);
        case '/stripe/webhook': return stripeWebhook(env, request);
        case '/video/session': return createVideoSession(env);
        case '/llm/chat': return llmChat(env, body as any);
        case '/payouts/accrue': return accruePayout(env, request, body as any);
        case '/referrals/link': return referralLink(env, body as any);
        case '/notices/classify': return json({ ok: true, note: 'Notice classification runs on-device via irsIntelligence.decodeNotice; this endpoint exists for external webhook callers.', received: body });
        case '/notify': return json({ ok: true, event: body?.event, note: 'Team notification hook — wire to Slack/Discord webhook URL as needed.' });
        default: return json({ ok: false, error: 'unknown_route', route }, 404);
      }
    }

    return json({ ok: false, error: 'method_not_allowed' }, 405);
  } catch (err) {
    const msg = String(err);
    if (/no such table/i.test(msg)) {
      return json({
        ok: false,
        configured: false,
        error: 'migrations_pending',
        hint: 'Run: npm run db:migrate  (or npm run cf:setup) to initialize the D1 schema.',
      }, 501);
    }
    return json({ ok: false, error: msg }, 500);
  }
};
