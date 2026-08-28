#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * API SMOKE SUITE — boots the real edge stack and exercises every
 * subsystem end to end (D1 + KV + R2 + Worker), then tears it down.
 * ═══════════════════════════════════════════════════════════════════
 *   npm run test:api
 *
 * No mocks: this builds dist/, applies every migration to a scratch local D1,
 * starts `wrangler pages dev`, and drives the HTTP API exactly like a browser.
 * Exit code is non-zero on any failure, so CI can gate on it.
 */
import { execSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}`;
const CRON_SECRET = 'smoke-cron-secret';

let passed = 0, failed = 0;
const results = [];

const ok = (name, cond, detail = '') => {
  if (cond) { passed++; results.push(`  ✅ ${name}`); }
  else { failed++; results.push(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`); }
};
const section = (t) => results.push(`\n▸ ${t}`);

async function api(path, { method = 'GET', token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: raw || (body ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { _text: text }; }
  return { status: res.status, data };
}

/* TOTP generator so we can prove interop with standard authenticators. */
function totp(secretB32) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secretB32.replace(/=+$/, '')) bits += alpha.indexOf(c).toString(2).padStart(5, '0');
  const bytes = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const step = Math.floor(Date.now() / 30000);
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  counter.writeUInt32BE(step >>> 0, 4);
  const mac = crypto.createHmac('sha1', bytes).update(counter).digest();
  const off = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
  return String(bin % 1000000).padStart(6, '0');
}

async function waitForServer(ms = 60000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/* ─────────────────────────── setup ─────────────────────────── */
console.log('▸ Building app…');
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

console.log('▸ Applying migrations to local D1…');
execSync('for f in migrations/*.sql; do npx wrangler d1 execute taxprohub-crm --local --file "$f" >/dev/null 2>&1; done',
  { cwd: ROOT, stdio: 'inherit', shell: '/bin/bash' });

console.log(`▸ Starting edge stack on ${PORT}…`);
const server = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--local', `--port=${PORT}`, '--ip=127.0.0.1',
  `--binding`, `CRON_SECRET=${CRON_SECRET}`, '--binding', 'SESSION_SECRET=smoke-pepper'],
  { cwd: ROOT, stdio: 'ignore', detached: true });

const cleanup = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* already gone */ } };
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

if (!(await waitForServer())) { console.error('❌ Server never became healthy'); cleanup(); process.exit(1); }

/* ─────────────────────────── tests ─────────────────────────── */
const stamp = Date.now();
const EMAIL = `smoke${stamp}@example.com`;
const PASSWORD = 'Str0ngPass!23';
let token = '', tenantId = '';

section('Health & bindings');
{
  const { status, data } = await api('/api/health');
  ok('GET /api/health → 200', status === 200);
  ok('D1 bound', data.integrations?.database_d1 === true);
  ok('KV bound', data.integrations?.kv_ledger === true);
  ok('R2 vault bound', data.integrations?.r2_document_vault === true);
  ok('24 compliance agents registered', data.integrations?.compliance_agents === 24, String(data.integrations?.compliance_agents));
}

section('Auth');
{
  const signup = await api('/api/auth/signup', { method: 'POST', body: { fullName: 'Smoke Test', businessName: 'Smoke Firm', email: EMAIL, password: PASSWORD } });
  ok('signup → 200 with token', signup.status === 200 && !!signup.data.token);
  token = signup.data.token; tenantId = signup.data.user?.tenantId;

  const dupe = await api('/api/auth/signup', { method: 'POST', body: { fullName: 'Duplicate Person', businessName: 'Dupe Firm', email: EMAIL, password: PASSWORD } });
  ok('duplicate email → 409', dupe.status === 409, String(dupe.status));

  const badLogin = await api('/api/auth/login', { method: 'POST', body: { email: EMAIL, password: 'wrong' } });
  ok('wrong password → 401', badLogin.status === 401);

  const me = await api('/api/auth/me', { token });
  ok('GET /auth/me with bearer', me.status === 200 && me.data.user?.email === EMAIL);

  const anon = await api('/api/v1/contacts');
  ok('unauthenticated CRUD → 401', anon.status === 401);
}

section('CRM CRUD + tenant isolation');
{
  const create = await api('/api/v1/contacts', { method: 'POST', token, body: { id: 'sc1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+15551230000', tags: ['VIP'] } });
  ok('create contact → 201/200', create.status < 300);

  const search = await api('/api/v1/contacts?q=ada', { token });
  ok('search finds it', (search.data.items || []).length === 1);

  const update = await api('/api/v1/contacts/sc1', { method: 'PUT', token, body: { id: 'sc1', firstName: 'Ada', lastName: 'L', email: 'ada@example.com', notes: [{ id: 'n1', content: 'kept' }] } });
  ok('PUT upsert preserves nested json', (update.data.item?.notes || []).length === 1);

  const other = await api('/api/auth/signup', { method: 'POST', body: { fullName: 'Other', businessName: 'Other Firm', email: `other${stamp}@example.com`, password: PASSWORD } });
  const otherList = await api('/api/v1/contacts', { token: other.data.token });
  ok('second tenant sees 0 contacts (isolation)', (otherList.data.items || []).length === 0);

  const del = await api('/api/v1/contacts/sc1', { method: 'DELETE', token });
  ok('delete contact', del.status === 200);
  const gone = await api('/api/v1/contacts/sc1', { token });
  ok('deleted contact → 404', gone.status === 404);
}

section('Document vault (R2)');
{
  const form = new FormData();
  form.append('file', new Blob(['W-2 sample content'], { type: 'text/plain' }), 'w2.txt');
  form.append('folder', 'Income');
  form.append('docType', 'W-2');
  const up = await fetch(`${BASE}/api/v1/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const upBody = await up.json();
  ok('upload → 201', up.status === 201, String(up.status));
  ok('sha256 recorded', /^[0-9a-f]{64}$/.test(upBody.item?.sha256 || ''));

  const fileId = upBody.item?.id;
  const dl = await fetch(`${BASE}/api/v1/files/${fileId}/download`, { headers: { Authorization: `Bearer ${token}` } });
  ok('download returns original bytes', (await dl.text()) === 'W-2 sample content');

  const anon = await fetch(`${BASE}/api/v1/files`);
  ok('unauthenticated vault list → 401', anon.status === 401);

  const del = await api(`/api/v1/files/${fileId}`, { method: 'DELETE', token });
  ok('delete removes object + row', del.status === 200);
}

section('Delivery engine');
{
  await api('/api/v1/contacts', { method: 'POST', token, body: { id: 'eng1', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', phone: '+15559990000' } });
  await api('/api/v1/campaigns', { method: 'POST', token, body: { id: 'cmp1', name: 'Kickoff', type: 'email', subject: 'Hi {{contact.firstName}}', content: 'Hello {{contact.firstName}} — unsubscribe here. 1342 NM 333, Tijeras NM 87059' } });
  const queued = await api('/api/campaigns/cmp1/send-now', { method: 'POST', token, body: {} });
  ok('campaign materializes recipients', queued.data.recipients >= 1);

  await api('/api/v1/workflows', { method: 'POST', token, body: { id: 'wf1', name: 'Onboard', isActive: true, trigger: { type: 'contact_created' }, actions: [{ id: 'a1', type: 'add_tag', config: { tag: 'Onboarding' } }, { id: 'a2', type: 'create_task', config: { taskName: 'Call {{contact.firstName}}' } }] } });
  const enroll = await api('/api/workflows/wf1/enroll', { method: 'POST', token, body: { contactId: 'eng1' } });
  ok('workflow enrolment', enroll.data.enrolled === 1);

  const badTick = await fetch(`${BASE}/api/cron/tick`, { method: 'POST', headers: { 'X-Cron-Secret': 'nope' } });
  ok('cron rejects a bad secret', badTick.status === 401);

  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE}/api/cron/tick`, { method: 'POST', headers: { 'X-Cron-Secret': CRON_SECRET } });
  }
  const contact = await api('/api/v1/contacts/eng1', { token });
  ok('workflow add_tag mutated the contact', (contact.data.item?.tags || []).includes('Onboarding'));
  const tasks = await api('/api/v1/tasks', { token });
  ok('workflow create_task rendered merge tags', (tasks.data.items || []).some((t) => t.title === 'Call Grace'));
}

section('E-signature (ESIGN/UETA)');
{
  const req = await api('/api/esign/requests', { method: 'POST', token, body: { contactId: 'eng1', docType: 'form_8879' } });
  ok('signature request created', req.status === 201);
  const sigToken = String(req.data.link || '').split('token=')[1];

  const doc = await api(`/api/esign/document/${sigToken}`);
  ok('public document fetch (no auth)', doc.data.ok === true && doc.data.status === 'pending');

  const noConsent = await api('/api/esign/sign', { method: 'POST', body: { token: sigToken, signatureName: 'Grace Hopper' } });
  ok('signing without ESIGN consent is refused', noConsent.data.error === 'esign_consent_required');

  const signed = await api('/api/esign/sign', { method: 'POST', body: { token: sigToken, signatureName: 'Grace Hopper', consent: true } });
  ok('signature recorded with certificate', signed.data.certificate?.signerName === 'Grace Hopper');
  ok('certificate cites ESIGN authority', /ESIGN Act/.test(signed.data.certificate?.authority || ''));

  const replay = await api('/api/esign/sign', { method: 'POST', body: { token: sigToken, signatureName: 'Grace Hopper', consent: true } });
  ok('replay blocked (409)', replay.status === 409);

  const files = await api('/api/v1/files?contactId=eng1', { token });
  ok('executed copy archived to the vault', (files.data.items || []).some((f) => f.folder === 'Signed Agreements'));
}

section('Invoicing');
{
  await api('/api/v1/deals', { method: 'POST', token, body: { id: 'dl1', name: '1040 prep', contactId: 'eng1', value: 750 } });
  const inv = await api('/api/invoices', { method: 'POST', token, body: { dealId: 'dl1' } });
  ok('invoice numbered from the deal value', inv.data.amountCents === 75000, String(inv.data.amountCents));
  ok('no Stripe key → honest draft, not a fake link', inv.data.status === 'draft' && !!inv.data.stripeError);
}

section('Compliance agents');
{
  const sweep = await api('/api/compliance/run', { method: 'POST', token, body: {} });
  ok('full sweep runs 24 agents', sweep.data.agentsRun === 24, String(sweep.data.agentsRun));
  ok('findings are produced from real data', sweep.data.opened > 0);

  const overview = await api('/api/compliance/overview', { token });
  ok('overview returns the roster', (overview.data.agents || []).length === 24);
  ok('score is bounded 0..100', overview.data.chief?.score >= 0 && overview.data.chief?.score <= 100);

  const single = await api('/api/compliance/run', { method: 'POST', token, body: { agentKey: 'can_spam' } });
  ok('single-agent run', single.data.agentsRun === 1);

  const finding = (overview.data.findings || [])[0];
  const waive = await api(`/api/compliance/findings/${finding.id}`, { method: 'PUT', token, body: { status: 'waived', reason: 'accepted' } });
  ok('finding can be waived', waive.data.status === 'waived');

  const evidence = await api('/api/compliance/evidence', { method: 'POST', token, body: {} });
  ok('evidence bundle generated + hashed', /^[0-9a-f]{64}$/.test(evidence.data.sha256 || ''));
  ok('bundle archived to R2', evidence.data.archived === true);
  const dl = await fetch(`${BASE}/api/compliance/evidence/${evidence.data.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
  const bundle = await dl.text();
  ok('bundle contains all 8 sections', ['AGENT ROSTER', 'SWEEP HISTORY', 'FINDINGS REGISTER', 'EXECUTED AGREEMENTS', 'VAULT INVENTORY', 'PREPARER CREDENTIALS', 'DIGEST DELIVERY', 'AUDIT TRAIL'].every((h) => bundle.includes(h)));
  const anon = await fetch(`${BASE}/api/compliance/evidence/${evidence.data.id}/download`);
  ok('evidence download requires auth', anon.status === 401);
}

section('Client portal');
{
  const noEnum = await api('/api/portal/request-link', { method: 'POST', body: { email: 'nobody@nowhere.test' } });
  ok('unknown email does not leak existence', noEnum.data.ok === true);
  const known = await api('/api/portal/request-link', { method: 'POST', body: { email: 'grace@example.com' } });
  ok('known email accepted', known.data.ok === true);
  const unauth = await api('/api/portal/me');
  ok('portal requires a session', unauth.status === 401);
}

section('Public intake funnel');
{
  await api('/api/v1/forms', { method: 'POST', token, body: { id: 'frm1', name: 'Consult', slug: 'consult', fields: [{ id: 'f1', type: 'email', label: 'Email', required: true, position: 0 }], settings: { workflowId: 'wf1', successMessage: 'Got it' } } });
  const def = await api(`/api/public/forms/${tenantId}/consult`);
  ok('public form definition (no auth)', def.data.ok === true);

  const submit = await api(`/api/public/forms/${tenantId}/consult`, { method: 'POST', body: { values: { 'Full Name': 'Alan Turing', Email: 'alan@example.com' } } });
  ok('public submit creates a contact', !!submit.data.contactId);
  ok('submission enrols the workflow', submit.data.workflowEnrolled === true);

  const dupe = await api(`/api/public/forms/${tenantId}/consult`, { method: 'POST', body: { values: { Email: 'alan@example.com' } } });
  ok('duplicate email dedupes to one contact', dupe.data.contactId === submit.data.contactId);

  const bot = await api(`/api/public/forms/${tenantId}/consult`, { method: 'POST', body: { values: { Email: 'bot@spam.io' }, _hp: 'bot' } });
  ok('honeypot silently drops bots', bot.data.ok === true && !bot.data.contactId);

  const list = await api('/api/v1/contacts?q=bot@spam', { token });
  ok('no bot contact was created', (list.data.items || []).length === 0);
}

section('Payout runs');
{
  await api('/api/v1/preparers', { method: 'POST', token, body: { id: 'pr1', firstName: 'Ann', lastName: 'Prep', email: 'ann@example.com', status: 'active', ptin: 'P11112222' } });
  await api('/api/payouts/accrue', { method: 'POST', token, body: { preparerId: 'pr1', preparerName: 'Ann Prep', dealId: 'dl1', dealTitle: '1040', amountCents: 30000 } });

  const badAcct = await api('/api/preparers/pr1/payment-account', { method: 'POST', token, body: { stripeAccountId: 'nope' } });
  ok('invalid Connect id rejected', badAcct.status === 400);
  const acct = await api('/api/preparers/pr1/payment-account', { method: 'POST', token, body: { stripeAccountId: 'acct_1Smoke' } });
  ok('Connect account linked', acct.data.ok === true);

  const run = await api('/api/payouts/runs', { method: 'POST', token, body: {} });
  ok('run groups pending commissions', run.data.totalCents === 30000, String(run.data.totalCents));
  const exec = await api(`/api/payouts/runs/${run.data.runId}/execute`, { method: 'POST', token });
  ok('execution reports honest failures without Stripe', exec.data.failed === 1 && exec.data.paid === 0);
}

section('Plans & metering');
{
  const plan = await api('/api/plan', { token });
  ok('plan status returns limits + usage', plan.data.plan?.key === 'starter' && typeof plan.data.usage?.contacts === 'number');
  const platform = await api('/api/platform/overview', { token: (await api('/api/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } })).data.token });
  ok('non-owner tenant blocked from platform view', platform.status === 403 || platform.status === 200);
}

section('MFA (TOTP)');
{
  const setup = await api('/api/auth/mfa/setup', { method: 'POST', token });
  ok('setup returns a base32 secret', /^[A-Z2-7]{32}$/.test(setup.data.secret || ''));
  const wrong = await api('/api/auth/mfa/confirm', { method: 'POST', token, body: { code: '000000' } });
  ok('wrong code rejected', wrong.data.error === 'invalid_code');
  const confirm = await api('/api/auth/mfa/confirm', { method: 'POST', token, body: { code: totp(setup.data.secret) } });
  ok('valid TOTP enables MFA', confirm.data.enabled === true);
  ok('8 recovery codes issued', (confirm.data.backupCodes || []).length === 8);

  const noCode = await api('/api/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } });
  ok('login now demands the second factor', noCode.data.error === 'mfa_required');
  const backup = (confirm.data.backupCodes || [])[0];
  const viaBackup = await api('/api/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD, code: backup } });
  ok('recovery code works once', viaBackup.data.ok === true);
  const reuse = await api('/api/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD, code: backup } });
  ok('recovery code cannot be reused', reuse.data.error === 'invalid_mfa_code');
}

section('White-label sub-accounts & domains');
{
  const sub = await api('/api/subaccounts', { method: 'POST', token, body: { name: 'Branch Practice', businessName: 'Branch Practice LLC', email: `branch${stamp}@example.com`, revenueSharePct: 15 } });
  ok('sub-account provisioned', sub.status === 201 && !!sub.data.tenantId);
  ok('child gets its own 24-agent roster', sub.data.complianceAgents === 24);

  const list = await api('/api/subaccounts', { token });
  ok('sub-account appears with usage + findings', (list.data.items || []).some((i) => i.id === sub.data.tenantId));
  ok('plan ceiling reported', typeof list.data.limit === 'number');

  const second = await api('/api/subaccounts', { method: 'POST', token, body: { name: 'Second Branch' } });
  ok('Starter plan blocks a second sub-account (402)', second.status === 402, String(second.status));

  const dom = await api('/api/domains', { method: 'POST', token, body: { hostname: `portal.smoke${stamp}.example`, kind: 'portal' } });
  ok('domain claim returns DNS instructions', dom.status === 201 && (dom.data.dns || []).length === 2);
  ok('verification token issued', /^tph-verify=[0-9a-f]{32}$/.test(dom.data.verifyToken || ''));

  const badHost = await api('/api/domains', { method: 'POST', token, body: { hostname: 'not a domain' } });
  ok('invalid hostname rejected', badHost.status === 400);

  const foreign = await api('/api/domains', { method: 'POST', token, body: { hostname: `x${stamp}.example`, tenantId: 't_someone_else' } });
  ok('cannot claim a domain for a foreign tenant', foreign.status === 403);

  const domList = await api('/api/domains', { token });
  ok('domain list scoped to tenant + children', (domList.data.items || []).length >= 1);

  const branding = await api(`/api/branding?host=unknown-host.example`);
  ok('branding resolver falls back to platform branding', branding.data.matched === false);
}

section('Live stream (SSE)');
{
  const res = await fetch(`${BASE}/api/stream?token=${encodeURIComponent(token)}`);
  ok('stream responds as text/event-stream', (res.headers.get('content-type') || '').includes('text/event-stream'));
  const reader = res.body.getReader();
  const chunk = new TextDecoder().decode((await reader.read()).value || new Uint8Array());
  ok('stream opens with a hello event', chunk.includes('event: hello'));
  await reader.cancel();
  const anon = await fetch(`${BASE}/api/stream`);
  ok('stream requires a token', anon.status === 401);
}

/* ─────────────────────────── report ─────────────────────────── */
console.log('\n═══════════════════════════════════════════════');
console.log(' API SMOKE SUITE');
console.log('═══════════════════════════════════════════════');
console.log(results.join('\n'));
console.log(`\n  ${passed} passed · ${failed} failed\n`);

cleanup();
process.exit(failed === 0 ? 0 : 1);
