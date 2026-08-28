# 🚀 Cloudflare Deployment Runbook — Tax Pro Hub University

This runbook takes the app from repo → live **Cloudflare Pages + D1** with the
full backend (auth, CRM CRUD, integrations). Everything below is idempotent
and scripted; the only manual step is creating the API token and secrets.

---

## 0. Prerequisites

- Node 20+ (`node -v`)
- A Cloudflare account (free plan is sufficient: Pages + D1 + KV)
- Git checkout of `taxprohub-crm`

---

## 1. Create the Cloudflare API token (one time)

1. Open **https://dash.cloudflare.com/profile/api-tokens**
2. **Create Token → Custom token** with these permissions:

| Permission | Scope |
|---|---|
| Account · **Cloudflare Pages — Edit** | All accounts |
| Account · **D1 — Edit** | All accounts |
| Account · **Workers KV Storage — Edit** | All accounts |
| Account · **Workers Scripts — Edit** | All accounts |

3. Copy the token. **Never commit it.**
4. Note your **Account ID** (right sidebar of the dashboard).

---

## 2. One-command setup (D1 + KV + migrations + Pages project)

```bash
export CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

npm install
npm run cf:setup
```

`cf:setup` (scripts/setup-cf.mjs) will:
1. Detect or create the D1 database **`taxprohub-crm`** and write its id into `wrangler.toml`
2. Detect or create the KV namespace **`LEDGER`** and write its id into `wrangler.toml`
3. Apply `migrations/0001_init.sql` (18 tables) to D1
4. Ensure the Pages project **`tax-pro-hub-university`** exists (production branch `main`)

Re-running is safe.

---

## 3. Deploy

```bash
npm run deploy          # vite build + wrangler pages deploy dist
# or the full script:
bash deploy.sh          # setup + build + deploy + sets secrets from env
```

✅ Then verify:

```bash
curl https://tax-pro-hub-university.pages.dev/api/health
```

Expected (key line): `"database_d1": true` — this is the switch that turns the
app from **Demo Mode** into **Backend Mode**.

---

## 4. GitHub Actions (recommended for production)

The repo ships `.github/workflows/deploy.yml`:
- **PRs** → typecheck + build, then a **preview deployment** to `preview-<number>`
- **push to `main`** → typecheck + build + `cf:setup` + **production deploy**

Add two **GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | your Cloudflare account id |

Then push to `main` and watch Actions.

---

## 5. Secrets (backend integrations)

All secrets are set either via CLI or the Pages dashboard
(`tax-pro-hub-university → Settings → Variables and secrets`).
**Never** use `VITE_*` for these — they must stay server-side.

| Secret | Purpose | Status |
|---|---|---|
| `SESSION_SECRET` | pepper for PBKDF2 password hashing — set ONCE, keep stable | 🔑 required |
| `STRIPE_SECRET_KEY` | Stripe Checkout + Connect payouts | optional |
| `STRIPE_WEBHOOK_SECRET` | webhook HMAC — from Stripe dashboard | optional |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | SMS (10DLC-registered number) | optional |
| `CF_CALLS_APP_ID` / `CF_CALLS_APP_SECRET` | Cloudflare Calls video rooms | optional |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | AI assistant proxy (any compatible provider) | optional |
| `RESEND_API_KEY` | transactional email (fallback: free MailChannels) | optional |
| `MAIL_FROM` | e.g. `no-reply@taxprohubuniversity.com` | optional |

```bash
echo -n "my-secret" | npx wrangler pages secret put STRIPE_SECRET_KEY \
  --project-name tax-pro-hub-university
```

> ⚠️ **Stripe webhook**: after deploying, create the endpoint at
> `https://dashboard.stripe.com/webhooks` → URL
> `https://tax-pro-hub-university.pages.dev/api/stripe/webhook`, subscribe to
> `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`,
> `payment_intent.*`, then set `STRIPE_WEBHOOK_SECRET`.

---

## 6. Custom domain (recommended)

1. `tax-pro-hub-university → Custom domains → Set up a custom domain`
2. Add **`app.taxprohubuniversity.com`** (or your brand domain) and follow the CNAME instructions.
3. All `/api/*` calls are same-origin, so no CORS changes are needed.

---

## 7. Local development with the real edge backend

```bash
npm run cf:dev     # builds + wrangler pages dev --local (D1 + KV local)
```

Local D1 persists in `.wrangler/state`. To reset local data:
`rm -rf .wrangler/state && npm run cf:dev`

---

## 8. Verification checklist

- [ ] `curl https://<domain>/api/health` → `"database_d1": true`
- [ ] `curl -X POST https://<domain>/api/auth/signup -H 'Content-Type: application/json' -d '{"fullName":"Owner","businessName":"My Firm","email":"me@firm.com","password":"password123"}'` → returns `token`
- [ ] Sign up in the UI → lands on **Dashboard** (Backend Mode — see the store badge/behavior)
- [ ] Create a contact / move a deal / open a campaign → data persists across reloads (D1)
- [ ] Logout → login with wrong password → rejected (401)
- [ ] `/api/health` shows green for every integration you configured

---

## 9. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `/api/health` → `"database_d1": false` | Pages deployment without D1 binding — run `npm run cf:setup`, redeploy |
| `migrations_pending` (501) | D1 exists but tables missing — `npm run db:migrate` |
| Login always falls to Demo Mode | Health check failed → token scopes missing, or Pages URL without `https`; check browser console |
| `configured:false` for twilio/stripe/etc | Secret missing — set via `wrangler pages secret put` |
| Password resets stop working after changing `SESSION_SECRET` | By design — the pepper is baked into hashes. Set it before first users; keep it stable |
| D1 id placeholder in `wrangler.toml` | `cf:setup` replaces it; or paste `wrangler d1 create taxprohub-crm` output manually |
| `_redirects` warning in wrangler | Fixed — HashRouter needs no SPA rule; `public/_redirects` is now a comment stub |

---

*Runbook v1 — matches backend API v2 (auth + D1 CRUD + integrations).*
