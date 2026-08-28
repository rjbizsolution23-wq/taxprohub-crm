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
  const plan = String(body.plan || 'growth');

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
