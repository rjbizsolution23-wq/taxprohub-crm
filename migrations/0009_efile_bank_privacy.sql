-- ═══════════════════════════════════════════════════════════════════
-- 0009 — E-file pipeline, bank products, privacy (DSAR) requests
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS efile_submissions (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  deal_id        TEXT,
  contact_id     TEXT,
  return_type    TEXT DEFAULT '1040',      -- 1040 | 1065 | 1120 | 1120S | 941 | state
  tax_year       TEXT NOT NULL,
  jurisdiction   TEXT DEFAULT 'federal',   -- federal | NM | CA | …
  efin           TEXT,
  submission_id  TEXT,                     -- IRS/provider submission identifier
  provider       TEXT DEFAULT 'manual',    -- manual | mef_provider
  status         TEXT DEFAULT 'draft',     -- draft | ready | transmitted | accepted | rejected | perfected | withdrawn
  ack_code       TEXT,
  reject_codes   TEXT DEFAULT '[]',
  refund_cents   INTEGER DEFAULT 0,
  balance_due_cents INTEGER DEFAULT 0,
  transmitted_at TEXT,
  acked_at       TEXT,
  last_polled_at TEXT,
  perfection_deadline TEXT,                -- 5 days for 1040 rejects (Pub 1345)
  notes          TEXT,
  created_by     TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_efile_tenant ON efile_submissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_efile_deal   ON efile_submissions(deal_id);

CREATE TABLE IF NOT EXISTS efile_events (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  event       TEXT NOT NULL,
  detail      TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_efile_ev ON efile_events(submission_id, created_at);

CREATE TABLE IF NOT EXISTS bank_products (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  contact_id        TEXT,
  deal_id           TEXT,
  efile_id          TEXT,
  product_type      TEXT NOT NULL,          -- refund_advance | refund_transfer | rac
  bank              TEXT,                   -- Republic | Refundo | TPG | Pathward …
  requested_cents   INTEGER DEFAULT 0,
  approved_cents    INTEGER DEFAULT 0,
  prep_fee_cents    INTEGER DEFAULT 0,
  bank_fee_cents    INTEGER DEFAULT 0,
  net_to_client_cents INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'applied', -- applied | approved | denied | funded | settled | cancelled
  disbursement      TEXT,                   -- direct_deposit | card | check
  disclosure_signed_id TEXT,                -- signature_requests.id proving disclosure
  applied_at        TEXT,
  decided_at        TEXT,
  funded_at         TEXT,
  denial_reason     TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bank_tenant ON bank_products(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bank_contact ON bank_products(contact_id);

-- Data subject access / erasure requests (privacy program evidence).
CREATE TABLE IF NOT EXISTS data_requests (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  contact_id    TEXT,
  kind          TEXT NOT NULL,             -- export | erasure
  status        TEXT DEFAULT 'complete',   -- complete | partial_legal_hold | failed
  requested_by  TEXT,
  r2_key        TEXT,
  size          INTEGER DEFAULT 0,
  sha256        TEXT,
  records_count INTEGER DEFAULT 0,
  retained_note TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dsar_tenant ON data_requests(tenant_id, created_at);
