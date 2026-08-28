-- ═══════════════════════════════════════════════════════════════════
-- 0006 — Platform admin, plan enforcement, MFA (TOTP)
-- ═══════════════════════════════════════════════════════════════════

-- TOTP second factor for staff logins (kept out of `users` so the migration
-- stays idempotent and secrets live in their own row).
CREATE TABLE IF NOT EXISTS user_mfa (
  user_id      TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  secret       TEXT NOT NULL,          -- base32 TOTP shared secret
  enabled      INTEGER DEFAULT 0,
  backup_codes TEXT DEFAULT '[]',      -- sha256 hashes of one-time recovery codes
  last_used_step INTEGER DEFAULT 0,    -- replay protection: last accepted time step
  confirmed_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT
);

-- Platform-level operators (RJ Business Solutions staff) who can see every tenant.
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id    TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  granted_by TEXT,
  created_at TEXT NOT NULL
);

-- Monthly metered usage (emails/SMS sent, AI calls) — row per tenant/period/metric.
CREATE TABLE IF NOT EXISTS usage_counters (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  period     TEXT NOT NULL,            -- YYYY-MM
  metric     TEXT NOT NULL,            -- emails | sms | ai_calls | signatures
  count      INTEGER DEFAULT 0,
  updated_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_key ON usage_counters(tenant_id, period, metric);
