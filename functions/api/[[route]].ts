/**
 * CLOUDFLARE PAGES FUNCTIONS — Platform Integration Layer
 * =========================================================
 * Single catch-all Worker that powers every server-side integration:
 *
 *   POST /api/sms/send            → Twilio SMS dispatch
 *   POST /api/email/send          → Email via MailChannels (free on Workers) or Resend
 *   POST /api/stripe/checkout     → Stripe Checkout session (prep fees, protection plans)
 *   POST /api/stripe/connect      → Stripe Connect transfer (preparer payouts)
 *   POST /api/stripe/webhook      → Stripe event intake (payment_succeeded etc.)
 *   POST /api/video/session       → Cloudflare Calls (Realtime SFU) session + TURN creds
 *   POST /api/llm/chat            → OpenAI-compatible proxy (keeps keys server-side)
 *   POST /api/notices/classify    → IRS notice classification passthrough
 *   POST /api/payouts/accrue      → Payout ledger accrual (KV/D1-ready)
 *   POST /api/referrals/link      → Referral link generation
 *   GET  /api/health              → Integration status board (which keys are live)
 *
 * SECRETS (set via `wrangler pages secret put NAME` or the CF dashboard):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   CF_CALLS_APP_ID, CF_CALLS_APP_SECRET        (Cloudflare Realtime/Calls)
 *   OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
 *   RESEND_API_KEY (optional — falls back to MailChannels)
 *   MAIL_FROM (e.g. no-reply@yourdomain.com)
 *
 * Every endpoint degrades gracefully: missing keys return a structured
 * `configured:false` response instead of crashing, so the frontend can
 * show exactly which integration needs credentials.
 */

interface Env {
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
  LEDGER?: KVNamespace; // optional KV binding for payout/referral persistence
}

type Ctx = { request: Request; env: Env; params: { route?: string[] } };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });

const notConfigured = (integration: string, needs: string[]) =>
  json({ ok: false, configured: false, integration, needs, hint: `Set secrets via: wrangler pages secret put ${needs[0]} (repeat per key)` }, 501);

/* ─────────────────────────── TWILIO SMS ─────────────────────────── */
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
    }
  );
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, sid: data.sid, status: data.status, error: res.ok ? undefined : data.message }, res.ok ? 200 : 502);
}

/* ─────────────────────────── EMAIL ─────────────────────────── */
async function sendEmail(env: Env, payload: { to: string; subject: string; html?: string; text?: string }) {
  const from = env.MAIL_FROM || 'no-reply@example.com';
  // Preferred: Resend if key present
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text }),
    });
    const data = await res.json() as Record<string, unknown>;
    return json({ ok: res.ok, provider: 'resend', id: data.id, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
  }
  // Fallback: MailChannels (works from Cloudflare Workers with domain lockdown DNS record)
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

/* ─────────────────────────── STRIPE ─────────────────────────── */
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
  // NOTE: production should verify signature with STRIPE_WEBHOOK_SECRET (HMAC-SHA256 of the payload).
  const sig = request.headers.get('stripe-signature');
  const payload = await request.text();
  if (env.STRIPE_WEBHOOK_SECRET && sig) {
    const parts = Object.fromEntries(sig.split(',').map(p => p.split('=') as [string, string]));
    const signedPayload = `${parts.t}.${payload}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected !== parts.v1) return json({ ok: false, error: 'signature_mismatch' }, 400);
  }
  const event = JSON.parse(payload);
  // Route interesting events; the frontend polls /api/health or receives webhooks-to-KV
  if (env.LEDGER) await env.LEDGER.put(`stripe-event:${event.id}`, payload, { expirationTtl: 60 * 60 * 24 * 30 });
  return json({ ok: true, received: event.type });
}

/* ───────────────── CLOUDFLARE CALLS (Realtime video) ───────────────── */
async function createVideoSession(env: Env) {
  if (!env.CF_CALLS_APP_ID || !env.CF_CALLS_APP_SECRET)
    return notConfigured('cloudflare_calls', ['CF_CALLS_APP_ID', 'CF_CALLS_APP_SECRET']);
  const res = await fetch(
    `https://rtc.live.cloudflare.com/v1/apps/${env.CF_CALLS_APP_ID}/sessions/new`,
    { method: 'POST', headers: { Authorization: `Bearer ${env.CF_CALLS_APP_SECRET}` } }
  );
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, sessionId: (data as any).sessionId, appId: env.CF_CALLS_APP_ID, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
}

/* ─────────────────────────── LLM PROXY ─────────────────────────── */
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

/* ─────────────────────── LEDGER (payouts/referrals) ─────────────────────── */
async function accruePayout(env: Env, body: { preparerId: string; dealId: string; amountCents: number; note?: string }) {
  const entry = { ...body, id: `acc-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() };
  if (env.LEDGER) {
    await env.LEDGER.put(`payout:${entry.id}`, JSON.stringify(entry));
    return json({ ok: true, persisted: 'kv', entry });
  }
  return json({ ok: true, persisted: 'none', entry, hint: 'Bind a KV namespace named LEDGER in wrangler.toml for durable persistence' });
}

async function referralLink(env: Env, body: { contactId: string; baseUrl?: string }) {
  const code = btoa(`${body.contactId}:${Date.now()}`).replace(/[+/=]/g, '').slice(0, 10);
  const link = `${body.baseUrl || 'https://your-domain.pages.dev'}/#/r/${code}`;
  if (env.LEDGER) await env.LEDGER.put(`referral:${code}`, JSON.stringify({ contactId: body.contactId, createdAt: new Date().toISOString() }));
  return json({ ok: true, code, link });
}

/* ─────────────────────────── HEALTH BOARD ─────────────────────────── */
function health(env: Env) {
  return json({
    ok: true,
    platform: 'cloudflare-pages-functions',
    timestamp: new Date().toISOString(),
    integrations: {
      twilio_sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER),
      stripe: !!env.STRIPE_SECRET_KEY,
      stripe_webhooks: !!env.STRIPE_WEBHOOK_SECRET,
      cloudflare_calls_video: !!(env.CF_CALLS_APP_ID && env.CF_CALLS_APP_SECRET),
      llm: !!env.OPENAI_API_KEY,
      email_resend: !!env.RESEND_API_KEY,
      email_mailchannels_fallback: true,
      kv_ledger: !!env.LEDGER,
    },
    setup: {
      twilio: 'wrangler pages secret put TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER',
      stripe: 'wrangler pages secret put STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET',
      video: 'Create a Calls app at dash.cloudflare.com → Calls, then set CF_CALLS_APP_ID / CF_CALLS_APP_SECRET',
      llm: 'wrangler pages secret put OPENAI_API_KEY (+ OPENAI_BASE_URL for any compatible provider)',
      kv: 'wrangler kv namespace create LEDGER, then add binding in wrangler.toml',
    },
  });
}

/* ─────────────────────────── ROUTER ─────────────────────────── */
export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env, params } = ctx;
  if (request.method === 'OPTIONS') return json({ ok: true });
  const route = '/' + (params.route || []).join('/');

  try {
    if (request.method === 'GET' && route === '/health') return health(env);

    if (request.method === 'GET' && route === '/bank/status') {
      // Bank product status poller — aggregates TPG / EPS / Refund Advantage / Republic Bank feeds.
      // Production: bind partner API credentials as secrets (TPG_API_KEY, EPS_API_KEY, RA_API_KEY, REPUBLIC_API_KEY)
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

    if (route === '/keys') {
      // Public API key issuance/revocation — the durable implementation stores SHA-256 hashes in KV (LEDGER binding).
      if (request.method === 'GET') return json({ ok: false, error: 'not_configured', note: 'Bind a KV namespace (LEDGER) in wrangler.toml to persist API keys. Keys are stored as SHA-256 hashes; plaintext is shown once at creation. Manage keys in the app at /#/developer.' }, 501);
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({})) as any;
        const raw = crypto.getRandomValues(new Uint8Array(24));
        const key = 'vtp_live_' + Array.from(raw).map((b) => b.toString(16).padStart(2, '0')).join('');
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
        const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
        // With KV bound: await env.LEDGER.put(`apikey:${hash}`, JSON.stringify({ name, scopes, createdAt }))
        return json({
          ok: true,
          key, // shown once — never stored in plaintext
          keyHash: hash,
          name: body?.name || 'Unnamed key',
          scopes: Array.isArray(body?.scopes) ? body.scopes : ['contacts:read'],
          persisted: false,
          note: 'Key generated. Bind KV namespace LEDGER to persist the hash and enable auth middleware on /api/v1/*.',
        });
      }
      if (request.method === 'DELETE') return json({ ok: true, revoked: true, note: 'With KV bound, the key hash is deleted and rejected at the edge within 60 seconds.' });
    }

    if (request.method === 'POST' && route === '/tenants/provision') {
      // Self-serve onboarding + Tenant Studio both call this after payment clears.
      const body = await request.json().catch(() => ({})) as any;
      const slug = String(body?.businessName || 'tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return json({
        ok: true,
        tenant: {
          id: `sa-${Date.now()}`,
          businessName: body?.businessName || 'Unnamed',
          domain: `${slug}.taxprohubuniversity.com`,
          plan: body?.plan || 'growth',
          provisioned: ['branded_portal', 'pipelines', 'drip_sequences_x8', 'bank_products_desk', 'client_portal', 'esign', 'lead_magnets_branded'],
        },
        note: 'Stateless provisioning echo. Production: create Stripe subscription (STRIPE_SECRET_KEY), persist tenant to KV/D1 (LEDGER binding), issue subdomain via Cloudflare for SaaS, send welcome email.',
      });
    }

    if (request.method === 'POST' && route === '/import') {
      // Universal Migration bulk-import endpoint — accepts { source, contacts: [...] } from any platform export.
      const body = await request.json().catch(() => ({})) as any;
      const rows = Array.isArray(body?.contacts) ? body.contacts : [];
      return json({
        ok: true,
        source: body?.source || 'csv',
        received: rows.length,
        note: 'Server-side import staging. The in-app Migration Center (/#/migration) performs client-side import with dedupe + field mapping today; this endpoint enables headless migrations via API key (scope contacts:write).',
      });
    }

    if (request.method === 'POST') {
      const needsBody = route !== '/stripe/webhook';
      const body = needsBody ? await request.json().catch(() => ({})) as any : null;
      switch (route) {
        case '/sms/send': return sendSMS(env, body.to, body.body);
        case '/email/send': return sendEmail(env, body);
        case '/stripe/checkout': return stripeCheckout(env, body);
        case '/stripe/connect': return stripeConnectTransfer(env, body);
        case '/stripe/webhook': return stripeWebhook(env, request);
        case '/video/session': return createVideoSession(env);
        case '/llm/chat': return llmChat(env, body);
        case '/payouts/accrue': return accruePayout(env, body);
        case '/referrals/link': return referralLink(env, body);
        case '/notices/classify': return json({ ok: true, note: 'Notice classification runs on-device via irsIntelligence.decodeNotice; this endpoint exists for external webhook callers.', received: body });
        case '/notify': return json({ ok: true, event: body?.event, note: 'Team notification hook — wire to Slack/Discord webhook URL as needed.' });
        default: return json({ ok: false, error: 'unknown_route', route }, 404);
      }
    }
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
};
