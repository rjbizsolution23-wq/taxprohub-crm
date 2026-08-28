#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# TAX PRO HUB UNIVERSITY — ONE-SHOT DEPLOY SCRIPT
# RJ Business Solutions | Rick Jefferson
# Run: bash deploy.sh
# Requires: CLOUDFLARE_API_TOKEN env var with Pages + KV + Workers AI perms
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT="tax-pro-hub-university"
CF_ACCOUNT="58250b56ae5b45d940cd6e4b64314c01"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()  { echo -e "${GREEN}✅ $1${NC}"; }
info(){ echo -e "${BLUE}ℹ  $1${NC}"; }
warn(){ echo -e "${YELLOW}⚠  $1${NC}"; }
die() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo "════════════════════════════════════════════════"
echo " TAX PRO HUB UNIVERSITY — Cloudflare Deployment"
echo "════════════════════════════════════════════════"
echo ""

# ── Validate CF token ────────────────────────────────────────────────
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  die "CLOUDFLARE_API_TOKEN is not set.
  Get a valid token at: https://dash.cloudflare.com/profile/api-tokens
  Create a token with these permissions:
    • Cloudflare Pages: Edit
    • Account: Cloudflare Workers KV Storage: Edit
    • Account: Workers Scripts: Edit
  Then run: export CLOUDFLARE_API_TOKEN=your_token_here && bash deploy.sh"
fi

VERIFY=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json")
if echo "$VERIFY" | grep -q '"success":false'; then
  die "Token validation failed: $VERIFY"
fi
ok "Cloudflare API token verified"

# ── Install wrangler if missing ───────────────────────────────────────
if ! command -v wrangler &>/dev/null; then
  info "Installing wrangler globally..."
  npm install -g wrangler@latest
fi
ok "Wrangler $(wrangler --version 2>/dev/null | head -1) ready"

# ── Install project deps ──────────────────────────────────────────────
info "Installing project dependencies..."
npm install --legacy-peer-deps
ok "Dependencies installed"

# ── Build ─────────────────────────────────────────────────────────────
info "Building production bundle..."
npm run build
ok "Build complete → dist/"

# ── Create D1 + KV + Pages project, apply migrations ─────────────────
# Idempotent; creates only what is missing and fills wrangler.toml ids.
info "Provisioning D1 database, KV namespace & Pages project..."
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-$CF_ACCOUNT}" \
  npm run cf:setup || warn "Provisioning failed — check your token scopes (Pages + D1 + KV edits)"

# ── Deploy to Cloudflare Pages ────────────────────────────────────────
info "Deploying to Cloudflare Pages..."
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" wrangler pages deploy dist \
  --project-name "$PROJECT" --commit-message "chore: deploy Tax Pro Hub University $(date +%Y-%m-%d)"
ok "Deployed!"

# ── Set all secrets ────────────────────────────────────────────────────
info "Setting backend secrets..."
set_secret() {
  local key=$1 val=$2
  if [[ -n "$val" ]]; then
    echo "$val" | CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
      wrangler pages secret put "$key" --project-name "$PROJECT" 2>/dev/null && ok "  $key set" || warn "  $key failed"
  else
    warn "  $key skipped (empty)"
  fi
}

# Twilio
set_secret "TWILIO_ACCOUNT_SID"     "${TWILIO_ACCOUNT_SID}"
set_secret "TWILIO_AUTH_TOKEN"      "${TWILIO_AUTH_TOKEN}"
set_secret "TWILIO_FROM_NUMBER"     "+18667524618"

# Stripe
set_secret "STRIPE_SECRET_KEY"      "${STRIPE_SECRET_KEY}"
set_secret "STRIPE_WEBHOOK_SECRET"  ""   # Add after creating webhook in Stripe dashboard

# AI — Cloudflare Workers AI (free, OpenAI-compatible)
set_secret "OPENAI_API_KEY"         "${CF_API_TOKEN}"
set_secret "OPENAI_BASE_URL"        "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/v1"
set_secret "OPENAI_MODEL"           "@cf/meta/llama-3.3-70b-instruct-fp8-fast"

# Auth pepper — set ONCE and keep stable (changing it invalidates passwords)
set_secret "SESSION_SECRET"         "${SESSION_SECRET}"

# Email
set_secret "RESEND_API_KEY"         "${RESEND_API_KEY}"
set_secret "MAIL_FROM"              "no-reply@taxprohubuniversity.com"

ok "All secrets set"

# ── Verify deployment ─────────────────────────────────────────────────
echo ""
PAGES_URL="https://${PROJECT}.pages.dev"
info "Checking health endpoint at ${PAGES_URL}/api/health ..."
sleep 5
HEALTH=$(curl -s "${PAGES_URL}/api/health" 2>/dev/null || echo "not_reachable_yet")
echo "$HEALTH"

echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN} DEPLOYMENT COMPLETE${NC}"
echo " App URL:    ${PAGES_URL}"
echo " Health:     ${PAGES_URL}/api/health"
echo ""
echo " ⚠ NEXT STEPS:"
echo "   1. Add Stripe webhook: https://dashboard.stripe.com/webhooks"
echo "      Endpoint URL: ${PAGES_URL}/api/stripe/webhook"
echo "      Events: checkout.session.completed, customer.subscription.*,"
echo "              invoice.payment_*, payment_intent.*"
echo "      Then: bash deploy.sh again (with STRIPE_WEBHOOK_SECRET set)"
echo ""
echo "   2. Create a Cloudflare Calls app:"
echo "      https://dash.cloudflare.com → Calls → Create App"
echo "      Then set CF_CALLS_APP_ID and CF_CALLS_APP_SECRET secrets"
echo ""
echo "   3. Valid CF token required (create at):"
echo "      https://dash.cloudflare.com/profile/api-tokens"
echo "      Permissions needed: Pages:Edit + Workers KV:Edit"
echo "════════════════════════════════════════════════════════════"
