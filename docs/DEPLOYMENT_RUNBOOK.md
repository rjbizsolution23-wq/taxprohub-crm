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
| Account · **Workers R2 Storage — Edit** | All accounts | (document vault)

3. Copy the token. **Never commit it.**
4. Note your **Account ID** (right sidebar of the dashboard).

---

## 1b. Fastest path — ONE command

```bash
export CLOUDFLARE_API_TOKEN=...      # custom token from step 1
export CLOUDFLARE_ACCOUNT_ID=...     # 32-char account id
npm ci && npm run ship
```

`npm run ship` verifies the token, provisions **D1 + KV + R2 + the Pages
project**, applies every migration, typechecks, builds, pushes any secrets it
finds in the environment, deploys, then polls the live `/api/health` and prints
the integration board. Everything below is the manual breakdown of that script.

---

## 1c. No-CLI path — deploy straight from the Cloudflare dashboard

If you'd rather not run anything locally:

1. **Workers & Pages → Create → Pages → Connect to Git** → pick
   `rjbizsolution23-wq/taxprohub-crm`, branch `main` (or this arena branch).
   Build command `npm run build`, output directory `dist`.
2. **Storage & Databases → D1 → Create** → name `taxprohub-crm`.
   Open its **Console** tab and paste the contents of `migrations/0001_init.sql`,
   run it, then paste `migrations/0002_files.sql` and run that too.
3. **R2 → Create bucket** → `taxprohub-docs`.
4. **KV → Create namespace** → `LEDGER`.
5. Back on the Pages project → **Settings → Bindings → Add**:
   | Type | Variable name | Resource |
   |---|---|---|
   | D1 database | `DB` | `taxprohub-crm` |
   | KV namespace | `LEDGER` | `LEDGER` |
   | R2 bucket | `DOCS` | `taxprohub-docs` |
6. **Settings → Variables and Secrets** → add `SESSION_SECRET` (any long random
   string) plus whichever provider keys you use (Twilio, Stripe, Resend, OpenAI).
7. **Deployments → Retry deployment**, then open `/api/health` — every bound
   service should report `true`.

---

## 2. One-command setup (D1 + KV + R2 + migrations + Pages project)

```bash
export CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

npm install
npm run cf:setup
```

`cf:setup` (scripts/setup-cf.mjs) will:
1. Detect or create the D1 database **`taxprohub-crm`** and write its id into `wrangler.toml`
2. Detect or create the KV namespace **`LEDGER`** and write its id into `wrangler.toml`
3. Detect or create the R2 bucket **`taxprohub-docs`** (secure document vault)
4. Apply every file in `migrations/` (`0001_init.sql` → 18 tables, `0002_files.sql` → vault index) to D1
5. Ensure the Pages project **`tax-pro-hub-university`** exists (production branch `main`)

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

---

## 3b. Delivery engine cron (required for campaigns + workflows)

Pages Functions cannot own a Cron Trigger, so deploy the companion Worker:

```bash
# 1. shared secret on BOTH sides
openssl rand -hex 32                       # copy the value
npx wrangler pages secret put CRON_SECRET --project-name tax-pro-hub-university

cd workers/cron
npx wrangler deploy                        # creates taxprohub-cron, runs every minute
npx wrangler secret put CRON_SECRET        # paste the same value
```

Verify: `curl -X POST https://tax-pro-hub-university.pages.dev/api/cron/tick -H "X-Cron-Secret: <secret>"`
→ `{"ok":true,"campaignsSent":0,"workflowsAdvanced":0,...}`

## 3b-2. Compliance sweeps

Once the cron Worker is live (§3b), the tick runs a full 24-agent compliance
sweep per tenant every 20 hours and records it in `compliance_runs`. Force one
at any time from `/#/compliance` → **Run full sweep**, or:

```bash
curl -X POST https://tax-pro-hub-university.pages.dev/api/compliance/run \
  -H "Authorization: Bearer <session token>"
```

## 3c. Client portal

Set `PORTAL_BASE_URL` to the public origin so magic links point at the right host:

```bash
npx wrangler pages secret put PORTAL_BASE_URL --project-name tax-pro-hub-university
# e.g. https://app.taxprohubuniversity.com
```

Magic-link delivery uses the same email provider as campaigns — configure
`RESEND_API_KEY` + `MAIL_FROM` (MailChannels is the free fallback) or clients
will never receive their link.


---

## Appendix: GitHub Actions workflow (`.github/workflows/deploy.yml`)

> This file exists in the working tree but **cannot be pushed by the Arena GitHub App**
> (a GitHub App needs the `workflows` permission to create/update workflow files,
> and the same restriction applies to the REST contents API).
> Add it yourself: GitHub → *Add file → Create new file* → path
> `.github/workflows/deploy.yml` → paste the YAML below → Commit.
>
> Then add the two repository secrets (Settings → Secrets and variables → Actions):
> `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and run the workflow
> (Actions → *Deploy to Cloudflare Pages* → *Run workflow*). CI does the whole
> job: create D1 + KV + R2, apply migrations, create the Pages project, deploy,
> then verify `/api/health` reports `database_d1: true`.

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, 'arena/**']
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          if-no-files-found: error

  deploy-preview:
    # Pull requests → preview deployment (branch deployments on Pages)
    if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository
    needs: build
    runs-on: ubuntu-latest
    environment: cloudflare-pages
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist

      - name: Configure D1 & KV (create if missing)
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          node scripts/setup-cf.mjs

      - name: Deploy preview to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          npx wrangler pages deploy dist \
            --project-name tax-pro-hub-university \
            --branch preview-${{ github.event.pull_request.number }} \
            --commit-dirty=true

  deploy-production:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment: cloudflare-pages
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist

      - name: Configure D1 & KV (create if missing) + migrations
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          node scripts/setup-cf.mjs

      - name: Deploy production to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          npx wrangler pages deploy dist \
            --project-name tax-pro-hub-university \
            --branch main \
            --commit-dirty=true

      - name: Verify live /api/health
        run: |
          for i in $(seq 1 12); do
            body=$(curl -fsS https://tax-pro-hub-university.pages.dev/api/health || true)
            echo "$body"
            if echo "$body" | grep -q '"database_d1":true'; then exit 0; fi
            sleep 10
          done
          echo "::warning::database_d1 not reporting true yet — check the Pages project bindings."
```
