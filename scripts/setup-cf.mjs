#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * Cloudflare setup: D1 database + KV namespace + migrations + pages
 * ═══════════════════════════════════════════════════════════════════
 * Usage:            npm run cf:setup
 * Requires:         CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) env
 * Idempotent:       safe to run repeatedly; auto-detects existing
 *                   D1/KV/Pages resources and only creates what's missing.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CF = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });

const D1_NAME = 'taxprohub-crm';
const KV_NAME = 'LEDGER';
const PAGES_PROJECT = process.env.PAGES_PROJECT_NAME || 'tax-pro-hub-university';

const ok = (m) => console.log(`  ✅ ${m}`);
const info = (m) => console.log(`  ℹ  ${m}`);
const warn = (m) => console.log(`  ⚠  ${m}`);

const envOk = (k) => {
  if (!process.env[k]) { console.error(`  ❌ Missing required environment variable: ${k}`); return false; }
  return true;
};

if (!envOk('CLOUDFLARE_API_TOKEN')) process.exit(1);
if (!process.env.CLOUDFLARE_ACCOUNT_ID) warn('CLOUDFLARE_ACCOUNT_ID not set — wrangler will try to infer it from the token.');

function wranglerJson(args) {
  const out = CF(`npx wrangler ${args} --json`, { stdio: ['ignore', 'pipe', 'pipe'] });
  try { return JSON.parse(out); } catch { return null; }
}

function wranglerRaw(args) {
  try { return CF(`npx wrangler ${args}`, { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return ''; }
}

function readToml() { return readFileSync(resolve(ROOT, 'wrangler.toml'), 'utf8'); }
function writeToml(content) { writeFileSync(resolve(ROOT, 'wrangler.toml'), content); }

/* ── 1) D1 ─────────────────────────────────────────────────────── */
console.log('\n📦 [1/4] D1 database');
let d1 = wranglerJson(`d1 list`);
// Some wrangler versions print a preamble + JSON hybrid; fall back to raw parse.
if (!d1) {
  const raw = wranglerRaw('d1 list');
  const m = raw.match(new RegExp(`${D1_NAME}\\s+([0-9a-f-]{36})`, 'i'));
  d1 = m ? [{ name: D1_NAME, uuid: m[1] }] : [];
}
let found = (d1 || []).find((d) => d.name === D1_NAME);
let d1Id = '';
if (found) {
  d1Id = found.uuid || found.id;
  ok(`Found existing D1 "${D1_NAME}" (${d1Id})`);
} else {
  info(`Creating D1 "${D1_NAME}" ...`);
  const created = wranglerJson(`d1 create ${D1_NAME}`);
  const meta = created?.[0]?.uuid || created?.uuid || created?.database_id || '';
  if (meta) { d1Id = meta; ok(`Created D1 "${D1_NAME}" (${d1Id})`); }
  else {
    const raw = CF(`npx wrangler d1 create ${D1_NAME}`);
    const m = raw.match(/[0-9a-f-]{36}/i);
    if (m) { d1Id = m[0]; ok(`Created D1 "${D1_NAME}" (${d1Id})`); }
  }
}
if (!d1Id) { console.error('  ❌ Could not resolve a D1 database id.'); process.exit(1); }
let toml = readToml();
if (!toml.includes(d1Id)) {
  toml = toml.replace(/database_id = "[^"]*"/, `database_id = "${d1Id}"`);
  writeToml(toml);
  ok('wrangler.toml database_id updated');
}

/* ── 2) KV ─────────────────────────────────────────────────────── */
console.log('\n🔑 [2/4] KV namespace');
let kvs = wranglerJson('kv namespace list') || [];
if (!kvs.length) {
  const raw = wranglerRaw('kv namespace list');
  const re = /(\S+)\s*\(([0-9a-f]{32})\)/g;
  kvs = [...raw.matchAll(re)].map((m) => ({ title: m[1], id: m[2] }));
}
let kv = kvs.find((k) => k.title === KV_NAME) || kvs.find((k) => (k.id || k.namespace_id) === 'efc2da2c19934e68a956a84bfe76f7a2');
let kvId = '';
if (kv) {
  kvId = kv.id || kv.namespace_id || '';
  ok(`Found existing KV "${KV_NAME}" (${kvId})`);
} else {
  info(`Creating KV namespace "${KV_NAME}" ...`);
  const raw = CF(`npx wrangler kv namespace create ${KV_NAME}`);
  const m = raw.match(/[0-9a-f]{32}/i);
  if (m) { kvId = m[0]; ok(`Created KV "${KV_NAME}" (${kvId})`); }
}
if (!kvId) { console.error('  ❌ Could not resolve a KV namespace id.'); process.exit(1); }
toml = readToml();
if (!toml.includes(kvId)) {
  toml = toml.replace(/id = "efc2da2c19934e68a956a84bfe76f7a2"/, `id = "${kvId}"`);
  writeToml(toml);
  ok('wrangler.toml KV id updated');
}

/* ── 3) Migrations ─────────────────────────────────────────────── */
console.log('\n🧬 [3/4] D1 migrations');
const migrationsDir = resolve(ROOT, 'migrations');
if (existsSync(migrationsDir)) {
  const files = (await import('node:fs/promises')).readdir(migrationsDir).then((f) => f.filter((x) => x.endsWith('.sql')).sort());
  for (const file of await files) {
    info(`Applying ${file} ...`);
    try {
      CF(`npx wrangler d1 execute ${D1_NAME} --remote --file migrations/${file}`);
      ok(`${file} applied`);
    } catch (e) {
      warn(`${file} failed (maybe already applied): ${String(e).slice(0, 200)}`);
    }
  }
}

/* ── 4) Pages project ──────────────────────────────────────────── */
console.log('\n🌐 [4/4] Cloudflare Pages project');
try {
  CF(`npx wrangler pages project create ${PAGES_PROJECT} --production-branch main`, { stdio: ['ignore', 'pipe', 'pipe'] });
  ok(`Pages project "${PAGES_PROJECT}" ready`);
} catch {
  ok(`Pages project "${PAGES_PROJECT}" already exists`);
}

console.log('\n══════════════════════════════════════════');
console.log('✅ Cloudflare setup complete.');
console.log('   Next: npm run deploy');
console.log('   Secrets: npm run deploy:secrets   (prompts per key)');
console.log('══════════════════════════════════════════\n');
