-- ═══════════════════════════════════════════════════════════════════
-- 0007 — Public intake, payout runs (Stripe Connect), evidence exports
-- ═══════════════════════════════════════════════════════════════════

-- Public form submissions (funnel/landing intake → CRM).
CREATE TABLE IF NOT EXISTS form_submissions (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  form_id     TEXT,
  contact_id  TEXT,
  payload     TEXT DEFAULT '{}',
  source      TEXT,
  referrer    TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_subs_tenant ON form_submissions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subs_form   ON form_submissions(form_id);

-- Stripe Connect destination per preparer.
CREATE TABLE IF NOT EXISTS preparer_payment_accounts (
  preparer_id       TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  method            TEXT DEFAULT 'stripe_connect',  -- stripe_connect | manual_ach | check
  status            TEXT DEFAULT 'active',
  created_at        TEXT NOT NULL,
  updated_at        TEXT
);

-- A payout run batches every approved commission for a period.
CREATE TABLE IF NOT EXISTS payout_runs (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  period       TEXT NOT NULL,
  status       TEXT DEFAULT 'draft',   -- draft | executing | complete | failed
  total_cents  INTEGER DEFAULT 0,
  paid_cents   INTEGER DEFAULT 0,
  item_count   INTEGER DEFAULT 0,
  created_by   TEXT,
  created_at   TEXT NOT NULL,
  executed_at  TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payrun_tenant ON payout_runs(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS payout_run_items (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL,
  run_id           TEXT NOT NULL,
  preparer_id      TEXT NOT NULL,
  preparer_name    TEXT,
  payout_ids       TEXT DEFAULT '[]',
  amount_cents     INTEGER NOT NULL,
  status           TEXT DEFAULT 'pending', -- pending | paid | failed | skipped
  stripe_transfer_id TEXT,
  error            TEXT,
  created_at       TEXT NOT NULL,
  paid_at          TEXT
);
CREATE INDEX IF NOT EXISTS idx_payitem_run ON payout_run_items(run_id);

-- Audit-ready compliance evidence bundles archived to R2.
CREATE TABLE IF NOT EXISTS evidence_exports (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  requested_by TEXT,
  title        TEXT,
  r2_key       TEXT,
  size         INTEGER DEFAULT 0,
  sha256       TEXT,
  score        INTEGER DEFAULT 0,
  findings_open INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'complete',
  created_at   TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON evidence_exports(tenant_id, created_at);
