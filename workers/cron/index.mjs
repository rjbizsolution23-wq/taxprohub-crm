/**
 * ═══════════════════════════════════════════════════════════════════
 * CRON WORKER — drives the Tax Pro Hub delivery engine
 * ═══════════════════════════════════════════════════════════════════
 * Cloudflare Pages Functions cannot own a Cron Trigger, so this tiny
 * companion Worker pokes the Pages app every minute. It carries the shared
 * secret and nothing else — all logic lives in /api/cron/tick.
 *
 * Deploy:
 *   cd workers/cron
 *   npx wrangler deploy
 *   npx wrangler secret put CRON_SECRET     # same value as the Pages secret
 *
 * Then set the same CRON_SECRET on the Pages project:
 *   npx wrangler pages secret put CRON_SECRET --project-name tax-pro-hub-university
 */
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(tick(env));
  },

  // Manual trigger: GET https://taxprohub-cron.<subdomain>.workers.dev/
  async fetch(_request, env) {
    const result = await tick(env);
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

async function tick(env) {
  const base = env.APP_URL || 'https://tax-pro-hub-university.pages.dev';
  try {
    const res = await fetch(`${base}/api/cron/tick`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': env.CRON_SECRET || '', 'Content-Type': 'application/json' },
      body: '{}',
    });
    const body = await res.json().catch(() => ({}));
    console.log('cron tick', res.status, JSON.stringify(body));
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error('cron tick failed', String(err));
    return { ok: false, error: String(err) };
  }
}
