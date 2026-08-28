#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * ONE-COMMAND LIVE DEPLOY — Tax Pro Hub University
 * ═══════════════════════════════════════════════════════════════════
 *   export CLOUDFLARE_API_TOKEN=...        # Pages:Edit, D1:Edit, KV:Edit,
 *   export CLOUDFLARE_ACCOUNT_ID=...       # Workers Scripts:Edit, R2:Edit
 *   npm run ship
 *
 * Does, in order:
 *   1. verifies the token can reach the Cloudflare API
 *   2. creates/reuses D1 + KV + R2 + Pages project and applies migrations
 *   3. typechecks + builds the SPA
 *   4. deploys dist/ to Cloudflare Pages (production branch)
 *   5. polls the live /api/health and prints the integration board
 *
 * Optional secrets pushed automatically when present in the environment:
 *   SESSION_SECRET TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM_NUMBER
 *   STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET CF_CALLS_APP_ID CF_CALLS_APP_SECRET
 *   OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL RESEND_API_KEY MAIL_FROM
 */
import { execSync, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = process.env.PAGES_PROJECT_NAME || 'tax-pro-hub-university';
const BRANCH = process.env.PAGES_BRANCH || 'main';

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const quiet = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const step = (n, m) => console.log(`\n\x1b[1m\x1b[33m[${n}/5] ${m}\x1b[0m`);
const die = (m) => { console.error(`\n❌ ${m}\n`); process.exit(1); };

if (!process.env.CLOUDFLARE_API_TOKEN) die('CLOUDFLARE_API_TOKEN is not set.');
if (!process.env.CLOUDFLARE_ACCOUNT_ID) console.warn('⚠  CLOUDFLARE_ACCOUNT_ID not set — wrangler will infer it.');

/* 1 ── token reachability + scope check ─────────────────────────── */
step(1, 'Verifying Cloudflare credentials');
try {
  const who = quiet('npx wrangler whoami');
  console.log(who.split('\n').filter(Boolean).slice(-8).join('\n'));
} catch (e) {
  die(`Cannot reach the Cloudflare API with this token.\n${String(e).slice(0, 400)}\n\n` +
      'Check: (a) network egress to api.cloudflare.com, (b) the token is a *custom* token with\n' +
      'Cloudflare Pages:Edit, D1:Edit, Workers KV Storage:Edit, Workers Scripts:Edit, Workers R2 Storage:Edit.');
}

/* 2 ── resources + migrations ───────────────────────────────────── */
step(2, 'Provisioning D1 + KV + R2 + Pages project and applying migrations');
run('node scripts/setup-cf.mjs');

/* 3 ── build ────────────────────────────────────────────────────── */
step(3, 'Typecheck + build');
run('npm run typecheck');
run('npm run build');

/* 4 ── secrets + deploy ─────────────────────────────────────────── */
step(4, `Deploying to Cloudflare Pages (${PROJECT} @ ${BRANCH})`);

const SECRETS = [
  'SESSION_SECRET', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CF_CALLS_APP_ID', 'CF_CALLS_APP_SECRET',
  'OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL', 'RESEND_API_KEY', 'MAIL_FROM',
  'CRON_SECRET', 'PORTAL_BASE_URL',
];
for (const key of SECRETS) {
  const value = process.env[key];
  if (!value) continue;
  const r = spawnSync('npx', ['wrangler', 'pages', 'secret', 'put', key, '--project-name', PROJECT], {
    cwd: ROOT, input: `${value}\n`, encoding: 'utf8',
  });
  console.log(r.status === 0 ? `  ✅ secret ${key} set` : `  ⚠  secret ${key} failed`);
}

run(`npx wrangler pages deploy dist --project-name ${PROJECT} --branch ${BRANCH} --commit-dirty=true`);

/* 5 ── live verification ────────────────────────────────────────── */
step(5, 'Verifying the live deployment');
const base = process.env.LIVE_URL || `https://${PROJECT}.pages.dev`;
let health = null;
for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    const res = await fetch(`${base}/api/health`, { headers: { 'cache-control': 'no-cache' } });
    health = await res.json();
    if (health?.ok) break;
  } catch { /* propagation delay */ }
  await new Promise((r) => setTimeout(r, 5000));
}

if (!health?.ok) {
  console.warn(`\n⚠  ${base}/api/health did not answer yet — DNS propagation can take a minute.`);
  process.exit(0);
}

console.log(`\n\x1b[1m🌐 ${base}\x1b[0m`);
console.log('┌─────────────────────────────────┬──────────────────┐');
for (const [k, v] of Object.entries(health.integrations || {})) {
  console.log(`│ ${k.padEnd(31)} │ ${(v ? '✅ live' : '⚪ not configured').padEnd(16)} │`);
}
console.log('└─────────────────────────────────┴──────────────────┘');

if (!health.integrations?.database_d1) {
  console.warn('\n⚠  database_d1 is false — bind the D1 database to the Pages project:\n' +
    '   Cloudflare dashboard → Workers & Pages → ' + PROJECT + ' → Settings → Bindings.');
}
console.log(`\n✅ Done. Sign up at ${base}/#/signup\n`);
