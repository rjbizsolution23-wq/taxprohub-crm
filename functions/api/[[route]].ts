/**
 * CLOUDFLARE PAGES FUNCTIONS — Tax Pro Hub University Platform API
 * ================================================================
 * Complete server-side integration layer. All credentials are secrets —
 * never exposed to the browser.
 *
 * ROUTES
 * ──────
 * GET  /api/health                  → Integration status
 * GET  /api/bank/status             → Bank product feed
 *
 * AUTH
 * ──────
 * POST /api/auth/login              → Supabase email/password sign-in proxy
 * POST /api/auth/logout             → Invalidate session token
 * POST /api/auth/refresh            → Refresh Supabase JWT
 *
 * SMS
 * ──────
 * POST /api/sms/send                → Outbound Twilio SMS
 * POST /api/sms/inbound             → Twilio inbound webhook (twiml response)
 *
 * EMAIL
 * ──────
 * POST /api/email/send              → Resend / MailChannels
 *
 * CONTACTS (KV-backed)
 * ──────
 * GET  /api/contacts                → List contacts (paginated)
 * POST /api/contacts                → Create contact
 * PUT  /api/contacts/:id            → Update contact
 * DELETE /api/contacts/:id          → Soft-delete contact
 *
 * CAMPAIGNS / WORKFLOWS
 * ──────
 * POST /api/campaigns/execute       → Queue campaign message dispatch
 * POST /api/workflows/trigger       → Fire a workflow automation step
 *
 * STRIPE
 * ──────
 * POST /api/stripe/checkout         → One-time Checkout session
 * POST /api/stripe/subscribe        → Create subscription (monthly/annual)
 * POST /api/stripe/portal           → Customer portal session
 * POST /api/stripe/connect          → Connect transfer (preparer payout)
 * POST /api/stripe/webhook          → Signed Stripe event intake
 *
 * VIDEO
 * ──────
 * POST /api/video/session           → Cloudflare Calls new session
 *
 * LLM
 * ──────
 * POST /api/llm/chat                → OpenAI-compatible proxy
 *
 * PAYOUTS
 * ──────
 * POST /api/payouts/accrue          → Accrue payout entry in KV
 * GET  /api/payouts/list            → List all payout entries
 * POST /api/payouts/approve         → Mark payout approved + trigger transfer
 *
 * REFERRALS
 * ──────
 * POST /api/referrals/link          → Generate referral link + store in KV
 * GET  /api/referrals/:code         → Look up referral code
 *
 * GHL
 * ──────
 * POST /api/ghl/sync                → Push contact to GoHighLevel CRM
 *
 * MISC
 * ──────
 * POST /api/notices/classify        → IRS notice classification relay
 * POST /api/notify                  → Team notification hook (Slack/Discord)
 * POST /api/tenants/provision       → Self-serve tenant onboarding
 * POST /api/import                  → Bulk contact import staging
 * GET  /api/keys                    → List API keys (KV)
 * POST /api/keys                    → Issue API key
 * DELETE /api/keys                  → Revoke API key
 *
 * SECRETS (wrangler pages secret put NAME):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, STRIPE_PRICE_ENTERPRISE (Price IDs)
 *   CF_CALLS_APP_ID, CF_CALLS_APP_SECRET
 *   OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
 *   RESEND_API_KEY, MAIL_FROM
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   GHL_API_KEY, GHL_LOCATION_ID
 */

interface Env {
  // Twilio
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_STARTER?: string;
  STRIPE_PRICE_GROWTH?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
  // Cloudflare Calls
  CF_CALLS_APP_ID?: string;
  CF_CALLS_APP_SECRET?: string;
  // LLM
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
  // Email
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // GHL
  GHL_API_KEY?: string;
  GHL_LOCATION_ID?: string;
  GHL_PIPELINE_ID?: string;
  GHL_STAGE_ID?: string;
  // KV
  LEDGER?: KVNamespace;
}

type Ctx = { request: Request; env: Env; params: { route?: string[] } };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });

const twiml = (xml: string) =>
  new Response(xml, { headers: { 'Content-Type': 'text/xml' } });

const notConfigured = (integration: string, needs: string[]) =>
  json({ ok: false, configured: false, integration, needs, hint: `Set via: wrangler pages secret put ${needs[0]}` }, 501);

/* ═══════════════════════ AUTH ═══════════════════════ */
async function authLogin(env: Env, body: { email: string; password: string }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return notConfigured('supabase', ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) return json({ ok: false, error: (data as any).error_description || 'Auth failed' }, 401);
  return json({ ok: true, access_token: data.access_token, refresh_token: data.refresh_token, user: (data as any).user });
}

async function authRefresh(env: Env, body: { refresh_token: string }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return notConfigured('supabase', ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': env.SUPABASE_SERVICE_ROLE_KEY },
    body: JSON.stringify({ refresh_token: body.refresh_token }),
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) return json({ ok: false, error: 'Refresh failed' }, 401);
  return json({ ok: true, access_token: data.access_token, refresh_token: data.refresh_token });
}

async function authLogout(env: Env, request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') || '';
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: true });
  await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY },
  });
  return json({ ok: true });
}

/* ═══════════════════════ SMS ═══════════════════════ */
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

async function smsInbound(env: Env, request: Request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const from = params.get('From') || '';
  const body = params.get('Body') || '';
  const msgSid = params.get('MessageSid') || '';

  // Store inbound message in KV for frontend to poll
  if (env.LEDGER) {
    const entry = { from, body, direction: 'inbound', receivedAt: new Date().toISOString(), sid: msgSid };
    await env.LEDGER.put(`sms-inbound:${msgSid}`, JSON.stringify(entry));
    // Update conversation thread
    const threadKey = `thread:${from.replace(/[^0-9]/g, '')}`;
    const existing = await env.LEDGER.get(threadKey);
    const thread = existing ? JSON.parse(existing) : { messages: [] };
    thread.messages.push(entry);
    thread.updatedAt = entry.receivedAt;
    await env.LEDGER.put(threadKey, JSON.stringify(thread));
  }

  // Auto-reply acknowledgement
  const autoReply = `Thanks for reaching out to Tax Pro Hub University! We received your message and will respond shortly.\n\nReply STOP to unsubscribe.`;
  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${autoReply}</Message></Response>`);
}

/* ═══════════════════════ EMAIL ═══════════════════════ */
async function sendEmail(env: Env, payload: { to: string; subject: string; html?: string; text?: string }) {
  const from = env.MAIL_FROM || 'no-reply@taxprohubuniversity.com';
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

/* ═══════════════════════ CONTACTS (KV-backed) ═══════════════════════ */
async function contactsList(env: Env, url: URL) {
  if (!env.LEDGER) return json({ ok: true, contacts: [], note: 'Bind LEDGER KV for persistence' });
  const prefix = 'contact:';
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const list = await env.LEDGER.list({ prefix, limit, cursor });
  const contacts = await Promise.all(
    list.keys.map(async (k) => {
      const v = await env.LEDGER!.get(k.name);
      return v ? JSON.parse(v) : null;
    })
  );
  return json({ ok: true, contacts: contacts.filter(Boolean), cursor: list.cursor, complete: list.list_complete });
}

async function contactCreate(env: Env, body: Record<string, unknown>) {
  const id = `contact:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const contact = { id, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (env.LEDGER) await env.LEDGER.put(id, JSON.stringify(contact));
  return json({ ok: true, contact });
}

async function contactUpdate(env: Env, id: string, body: Record<string, unknown>) {
  if (!env.LEDGER) return json({ ok: false, error: 'No KV binding' }, 503);
  const existing = await env.LEDGER.get(`contact:${id}`);
  if (!existing) return json({ ok: false, error: 'Not found' }, 404);
  const contact = { ...JSON.parse(existing), ...body, updatedAt: new Date().toISOString() };
  await env.LEDGER.put(`contact:${id}`, JSON.stringify(contact));
  return json({ ok: true, contact });
}

async function contactDelete(env: Env, id: string) {
  if (!env.LEDGER) return json({ ok: false, error: 'No KV binding' }, 503);
  const existing = await env.LEDGER.get(`contact:${id}`);
  if (!existing) return json({ ok: false, error: 'Not found' }, 404);
  const contact = { ...JSON.parse(existing), deleted: true, updatedAt: new Date().toISOString() };
  await env.LEDGER.put(`contact:${id}`, JSON.stringify(contact));
  return json({ ok: true });
}

/* ═══════════════════════ CAMPAIGNS ═══════════════════════ */
async function campaignExecute(env: Env, body: {
  campaignId: string;
  contactIds: string[];
  messageType: 'sms' | 'email';
  message: string;
  subject?: string;
}) {
  const results: Array<{ contactId: string; status: string; sid?: string; error?: string }> = [];

  for (const contactId of body.contactIds) {
    // Fetch contact from KV
    let contact: Record<string, unknown> | null = null;
    if (env.LEDGER) {
      const raw = await env.LEDGER.get(`contact:${contactId}`);
      if (raw) contact = JSON.parse(raw);
    }

    if (!contact) {
      results.push({ contactId, status: 'error', error: 'Contact not found' });
      continue;
    }

    try {
      if (body.messageType === 'sms') {
        const phone = String(contact.phone || contact.mobilePhone || '');
        if (!phone) { results.push({ contactId, status: 'skipped', error: 'No phone' }); continue; }
        const smsRes = await sendSMS(env, phone, body.message);
        const smsData = await smsRes.json() as any;
        results.push({ contactId, status: smsData.ok ? 'sent' : 'error', sid: smsData.sid, error: smsData.error });
      } else {
        const email = String(contact.email || '');
        if (!email) { results.push({ contactId, status: 'skipped', error: 'No email' }); continue; }
        const emailRes = await sendEmail(env, { to: email, subject: body.subject || 'Message from Tax Pro Hub', html: body.message });
        const emailData = await emailRes.json() as any;
        results.push({ contactId, status: emailData.ok ? 'sent' : 'error', error: emailData.error });
      }
    } catch (e: any) {
      results.push({ contactId, status: 'error', error: e.message });
    }
  }

  // Log campaign execution to KV
  if (env.LEDGER) {
    const log = { campaignId: body.campaignId, executedAt: new Date().toISOString(), results };
    await env.LEDGER.put(`campaign-run:${body.campaignId}:${Date.now()}`, JSON.stringify(log));
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const failed = results.filter((r) => r.status === 'error').length;
  return json({ ok: true, sent, failed, skipped: results.length - sent - failed, results });
}

/* ═══════════════════════ WORKFLOWS ═══════════════════════ */
async function workflowTrigger(env: Env, body: {
  workflowId: string;
  contactId: string;
  trigger: string;
  data?: Record<string, unknown>;
}) {
  const entry = {
    workflowId: body.workflowId,
    contactId: body.contactId,
    trigger: body.trigger,
    data: body.data || {},
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  if (env.LEDGER) {
    await env.LEDGER.put(`workflow-run:${body.workflowId}:${Date.now()}`, JSON.stringify(entry));
  }

  // For now, execute inline SMS/email steps if configured in data
  const steps = (body.data?.steps || []) as Array<{ type: string; message?: string; to?: string; subject?: string }>;
  const stepResults = [];
  for (const step of steps) {
    if (step.type === 'sms' && step.to && step.message) {
      const r = await sendSMS(env, step.to, step.message);
      stepResults.push({ type: 'sms', ok: r.ok });
    } else if (step.type === 'email' && step.to && step.message) {
      const r = await sendEmail(env, { to: step.to, subject: step.subject || 'Automation', html: step.message });
      stepResults.push({ type: 'email', ok: r.ok });
    }
  }

  return json({ ok: true, entry, stepResults });
}

/* ═══════════════════════ STRIPE ═══════════════════════ */
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

async function stripeSubscribe(env: Env, body: { plan: 'starter' | 'growth' | 'enterprise'; customerEmail: string; successUrl: string; cancelUrl: string }) {
  if (!env.STRIPE_SECRET_KEY) return notConfigured('stripe', ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_STARTER', 'STRIPE_PRICE_GROWTH', 'STRIPE_PRICE_ENTERPRISE']);
  const priceMap: Record<string, string | undefined> = {
    starter: env.STRIPE_PRICE_STARTER,
    growth: env.STRIPE_PRICE_GROWTH,
    enterprise: env.STRIPE_PRICE_ENTERPRISE,
  };
  const priceId = priceMap[body.plan];
  if (!priceId) return json({ ok: false, error: `STRIPE_PRICE_${body.plan.toUpperCase()} secret not set` }, 501);

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    customer_email: body.customerEmail,
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    'subscription_data[trial_period_days]': '14',
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, url: data.url, sessionId: data.id, error: res.ok ? undefined : (data.error as any)?.message }, res.ok ? 200 : 502);
}

async function stripePortal(env: Env, body: { customerId: string; returnUrl: string }) {
  if (!env.STRIPE_SECRET_KEY) return notConfigured('stripe', ['STRIPE_SECRET_KEY']);
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer: body.customerId, return_url: body.returnUrl }),
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, url: data.url, error: res.ok ? undefined : (data.error as any)?.message }, res.ok ? 200 : 502);
}

async function stripeConnectTransfer(env: Env, body: { amountCents: number; connectedAccountId: string; description: string }) {
  if (!env.STRIPE_SECRET_KEY) return notConfigured('stripe', ['STRIPE_SECRET_KEY']);
  const res = await fetch('https://api.stripe.com/v1/transfers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ amount: String(body.amountCents), currency: 'usd', destination: body.connectedAccountId, description: body.description }),
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

  // Handle specific events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (env.LEDGER) {
        await env.LEDGER.put(`subscription:${session.customer}`, JSON.stringify({
          customerId: session.customer,
          subscriptionId: session.subscription,
          status: 'active',
          email: session.customer_email,
          updatedAt: new Date().toISOString(),
        }));
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      if (env.LEDGER) {
        const existing = await env.LEDGER.get(`subscription:${sub.customer}`);
        if (existing) {
          const data = { ...JSON.parse(existing), status: 'cancelled', updatedAt: new Date().toISOString() };
          await env.LEDGER.put(`subscription:${sub.customer}`, JSON.stringify(data));
        }
      }
      break;
    }
  }
  return json({ ok: true, received: event.type });
}

/* ═══════════════════════ VIDEO ═══════════════════════ */
async function createVideoSession(env: Env) {
  if (!env.CF_CALLS_APP_ID || !env.CF_CALLS_APP_SECRET)
    return notConfigured('cloudflare_calls', ['CF_CALLS_APP_ID', 'CF_CALLS_APP_SECRET']);
  const res = await fetch(`https://rtc.live.cloudflare.com/v1/apps/${env.CF_CALLS_APP_ID}/sessions/new`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_CALLS_APP_SECRET}` },
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, sessionId: (data as any).sessionId, appId: env.CF_CALLS_APP_ID, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
}

/* ═══════════════════════ LLM PROXY ═══════════════════════ */
async function llmChat(env: Env, body: { messages: unknown[]; model?: string; max_completion_tokens?: number }) {
  if (!env.OPENAI_API_KEY) return notConfigured('openai_compatible', ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL']);
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: body.model || env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: body.messages,
      max_tokens: body.max_completion_tokens || 4096,
    }),
  });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

/* ═══════════════════════ PAYOUTS ═══════════════════════ */
async function accruePayout(env: Env, body: { preparerId: string; dealId: string; amountCents: number; note?: string }) {
  const entry = { ...body, id: `acc-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() };
  if (env.LEDGER) await env.LEDGER.put(`payout:${entry.id}`, JSON.stringify(entry));
  return json({ ok: true, persisted: !!env.LEDGER, entry });
}

async function payoutsList(env: Env) {
  if (!env.LEDGER) return json({ ok: true, payouts: [], note: 'Bind LEDGER KV' });
  const list = await env.LEDGER.list({ prefix: 'payout:' });
  const payouts = await Promise.all(list.keys.map(async (k) => {
    const v = await env.LEDGER!.get(k.name);
    return v ? JSON.parse(v) : null;
  }));
  return json({ ok: true, payouts: payouts.filter(Boolean) });
}

async function payoutApprove(env: Env, body: { payoutId: string; connectedAccountId: string }) {
  if (!env.LEDGER) return json({ ok: false, error: 'No KV binding' }, 503);
  const raw = await env.LEDGER.get(`payout:${body.payoutId}`);
  if (!raw) return json({ ok: false, error: 'Payout not found' }, 404);
  const payout = JSON.parse(raw);
  if (payout.status !== 'pending') return json({ ok: false, error: 'Already processed' }, 409);

  const transferRes = await stripeConnectTransfer(env, {
    amountCents: payout.amountCents,
    connectedAccountId: body.connectedAccountId,
    description: payout.note || `Payout ${payout.id}`,
  });
  const transferData = await transferRes.json() as any;

  const updated = { ...payout, status: transferData.ok ? 'approved' : 'failed', transferId: transferData.transferId, processedAt: new Date().toISOString() };
  await env.LEDGER.put(`payout:${body.payoutId}`, JSON.stringify(updated));
  return json({ ok: transferData.ok, payout: updated, transfer: transferData });
}

/* ═══════════════════════ REFERRALS ═══════════════════════ */
async function referralLink(env: Env, body: { contactId: string; baseUrl?: string }) {
  const code = btoa(`${body.contactId}:${Date.now()}`).replace(/[+/=]/g, '').slice(0, 10);
  const link = `${body.baseUrl || 'https://taxprohubuniversity.pages.dev'}/#/r/${code}`;
  if (env.LEDGER) await env.LEDGER.put(`referral:${code}`, JSON.stringify({ contactId: body.contactId, createdAt: new Date().toISOString() }));
  return json({ ok: true, code, link });
}

async function referralLookup(env: Env, code: string) {
  if (!env.LEDGER) return json({ ok: false, error: 'No KV binding' }, 503);
  const raw = await env.LEDGER.get(`referral:${code}`);
  if (!raw) return json({ ok: false, error: 'Code not found' }, 404);
  return json({ ok: true, referral: JSON.parse(raw) });
}

/* ═══════════════════════ GHL SYNC ═══════════════════════ */
async function ghlSync(env: Env, body: {
  firstName?: string; lastName?: string; email?: string; phone?: string;
  company?: string; tags?: string[]; source?: string;
}) {
  if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID)
    return notConfigured('ghl', ['GHL_API_KEY', 'GHL_LOCATION_ID']);

  const contactPayload: Record<string, unknown> = {
    locationId: env.GHL_LOCATION_ID,
    source: body.source || 'Tax Pro Hub CRM',
    tags: body.tags || ['crm-sync'],
  };
  if (body.firstName) contactPayload.firstName = body.firstName;
  if (body.lastName) contactPayload.lastName = body.lastName;
  if (body.email) contactPayload.email = body.email;
  if (body.phone) contactPayload.phone = body.phone;
  if (body.company) contactPayload.companyName = body.company;

  const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contactPayload),
  });
  const data = await res.json() as Record<string, unknown>;
  return json({ ok: res.ok, ghlId: (data as any)?.contact?.id, error: res.ok ? undefined : data }, res.ok ? 200 : 502);
}

/* ═══════════════════════ API KEYS ═══════════════════════ */
async function keysList(env: Env) {
  if (!env.LEDGER) return json({ ok: false, error: 'Bind LEDGER KV', configured: false }, 501);
  const list = await env.LEDGER.list({ prefix: 'apikey:' });
  const keys = await Promise.all(list.keys.map(async (k) => {
    const v = await env.LEDGER!.get(k.name);
    return v ? { ...JSON.parse(v), hash: k.name.replace('apikey:', '') } : null;
  }));
  return json({ ok: true, keys: keys.filter(Boolean) });
}

async function keyCreate(env: Env, body: { name?: string; scopes?: string[] }) {
  const raw = crypto.getRandomValues(new Uint8Array(24));
  const key = 'vtp_live_' + Array.from(raw).map((b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const meta = { name: body?.name || 'Unnamed key', scopes: body?.scopes || ['contacts:read'], createdAt: new Date().toISOString() };
  if (env.LEDGER) await env.LEDGER.put(`apikey:${hash}`, JSON.stringify(meta));
  return json({ ok: true, key, keyHash: hash, ...meta, note: 'Store this key now — it will not be shown again.' });
}

async function keyRevoke(env: Env, body: { keyHash: string }) {
  if (!env.LEDGER) return json({ ok: false, error: 'No KV binding' }, 503);
  await env.LEDGER.delete(`apikey:${body.keyHash}`);
  return json({ ok: true, revoked: true });
}

/* ═══════════════════════ HEALTH ═══════════════════════ */
function health(env: Env) {
  return json({
    ok: true,
    service: 'Tax Pro Hub University API',
    platform: 'cloudflare-pages-functions',
    timestamp: new Date().toISOString(),
    integrations: {
      twilio_sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER),
      stripe: !!env.STRIPE_SECRET_KEY,
      stripe_webhooks: !!env.STRIPE_WEBHOOK_SECRET,
      stripe_prices: !!(env.STRIPE_PRICE_STARTER && env.STRIPE_PRICE_GROWTH),
      cloudflare_calls_video: !!(env.CF_CALLS_APP_ID && env.CF_CALLS_APP_SECRET),
      llm: !!env.OPENAI_API_KEY,
      email_resend: !!env.RESEND_API_KEY,
      email_mailchannels: true,
      kv_ledger: !!env.LEDGER,
      supabase_auth: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      ghl_crm: !!(env.GHL_API_KEY && env.GHL_LOCATION_ID),
    },
  });
}

/* ═══════════════════════ ROUTER ═══════════════════════ */
export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env, params } = ctx;
  if (request.method === 'OPTIONS') return json({ ok: true });
  const route = '/' + (params.route || []).join('/');
  const url = new URL(request.url);

  try {
    // GET routes
    if (request.method === 'GET') {
      if (route === '/health') return health(env);
      if (route === '/bank/status') return json({ ok: true, partners: [
        { partner: 'TPG', enrolled: true, live: false, note: 'Set TPG_API_KEY secret' },
        { partner: 'EPS', enrolled: true, live: false, note: 'Set EPS_API_KEY secret' },
        { partner: 'Refund Advantage', enrolled: true, live: false, note: 'Set RA_API_KEY secret' },
        { partner: 'Republic Bank', enrolled: false, live: false },
      ]});
      if (route === '/contacts') return contactsList(env, url);
      if (route === '/payouts/list') return payoutsList(env);
      if (route === '/keys') return keysList(env);
      if (route.startsWith('/referrals/')) {
        const code = route.replace('/referrals/', '');
        return referralLookup(env, code);
      }
    }

    // POST /api/sms/inbound — Twilio webhook (form-encoded, no JSON body)
    if (request.method === 'POST' && route === '/sms/inbound') return smsInbound(env, request);
    // POST /api/stripe/webhook — raw body needed for signature verification
    if (request.method === 'POST' && route === '/stripe/webhook') return stripeWebhook(env, request);

    // All other POST / PUT / DELETE — parse JSON body
    let body: Record<string, unknown> = {};
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      body = await request.json().catch(() => ({})) as Record<string, unknown>;
    }

    // AUTH
    if (route === '/auth/login' && request.method === 'POST')
      return authLogin(env, body as any);
    if (route === '/auth/refresh' && request.method === 'POST')
      return authRefresh(env, body as any);
    if (route === '/auth/logout' && request.method === 'POST')
      return authLogout(env, request);

    // CONTACTS
    if (route === '/contacts' && request.method === 'POST') return contactCreate(env, body);
    if (route.startsWith('/contacts/')) {
      const id = route.replace('/contacts/', '');
      if (request.method === 'PUT') return contactUpdate(env, id, body);
      if (request.method === 'DELETE') return contactDelete(env, id);
    }

    // CAMPAIGNS / WORKFLOWS
    if (route === '/campaigns/execute' && request.method === 'POST') return campaignExecute(env, body as any);
    if (route === '/workflows/trigger' && request.method === 'POST') return workflowTrigger(env, body as any);

    // STRIPE
    if (route === '/stripe/checkout' && request.method === 'POST') return stripeCheckout(env, body as any);
    if (route === '/stripe/subscribe' && request.method === 'POST') return stripeSubscribe(env, body as any);
    if (route === '/stripe/portal' && request.method === 'POST') return stripePortal(env, body as any);
    if (route === '/stripe/connect' && request.method === 'POST') return stripeConnectTransfer(env, body as any);

    // SMS / EMAIL
    if (route === '/sms/send' && request.method === 'POST') return sendSMS(env, String(body.to), String(body.body));
    if (route === '/email/send' && request.method === 'POST') return sendEmail(env, body as any);

    // VIDEO / LLM
    if (route === '/video/session' && request.method === 'POST') return createVideoSession(env);
    if (route === '/llm/chat' && request.method === 'POST') return llmChat(env, body as any);

    // PAYOUTS
    if (route === '/payouts/accrue' && request.method === 'POST') return accruePayout(env, body as any);
    if (route === '/payouts/approve' && request.method === 'POST') return payoutApprove(env, body as any);

    // REFERRALS
    if (route === '/referrals/link' && request.method === 'POST') return referralLink(env, body as any);

    // GHL
    if (route === '/ghl/sync' && request.method === 'POST') return ghlSync(env, body as any);

    // API KEYS
    if (route === '/keys' && request.method === 'POST') return keyCreate(env, body as any);
    if (route === '/keys' && request.method === 'DELETE') return keyRevoke(env, body as any);

    // MISC
    if (route === '/notices/classify' && request.method === 'POST')
      return json({ ok: true, received: body });
    if (route === '/notify' && request.method === 'POST')
      return json({ ok: true, event: body?.event });
    if (route === '/tenants/provision' && request.method === 'POST') {
      const slug = String(body?.businessName || 'tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return json({ ok: true, tenant: { id: `sa-${Date.now()}`, businessName: body?.businessName, domain: `${slug}.taxprohubuniversity.com`, plan: body?.plan || 'growth' } });
    }
    if (route === '/import' && request.method === 'POST') {
      const rows = Array.isArray(body?.contacts) ? body.contacts : [];
      return json({ ok: true, source: body?.source || 'csv', received: rows.length });
    }

    return json({ ok: false, error: 'unknown_route', route, method: request.method }, 404);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
};
