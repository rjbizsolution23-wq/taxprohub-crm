-- ═══════════════════════════════════════════════════════════════════
-- 0005 — E-signature (ESIGN/UETA) + Stripe invoicing + digests
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signature_requests (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  contact_id    TEXT,
  deal_id       TEXT,
  file_id       TEXT,                       -- source document in the R2 vault
  doc_type      TEXT DEFAULT 'engagement_letter', -- engagement_letter | form_8879 | consent_7216 | croa_disclosure | custom
  title         TEXT NOT NULL,
  body          TEXT,                       -- rendered document text that was presented
  body_sha256   TEXT,                       -- tamper-evident hash of what was shown
  signer_name   TEXT,
  signer_email  TEXT NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  status        TEXT DEFAULT 'sent',        -- sent | viewed | signed | declined | expired | voided
  expires_at    TEXT NOT NULL,
  signed_at     TEXT,
  signature_name TEXT,                      -- typed signature the signer adopted
  signature_ip  TEXT,
  signature_ua  TEXT,
  consent_esign INTEGER DEFAULT 0,          -- explicit ESIGN Act consent captured
  certificate   TEXT DEFAULT '{}',          -- audit certificate JSON
  created_by    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sig_tenant  ON signature_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sig_contact ON signature_requests(contact_id);

CREATE TABLE IF NOT EXISTS signature_events (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  request_id    TEXT NOT NULL,
  event         TEXT NOT NULL,              -- created | sent | viewed | signed | declined | reminded | voided
  ip            TEXT,
  user_agent    TEXT,
  detail        TEXT DEFAULT '{}',
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sigev_req ON signature_events(request_id, created_at);

CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  contact_id     TEXT,
  deal_id        TEXT,
  number         TEXT NOT NULL,
  description    TEXT,
  line_items     TEXT DEFAULT '[]',
  amount_cents   INTEGER NOT NULL,
  currency       TEXT DEFAULT 'usd',
  status         TEXT DEFAULT 'draft',      -- draft | sent | paid | void | refunded
  due_at         TEXT,
  checkout_url   TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_at        TEXT,
  sent_at        TEXT,
  created_by     TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inv_number ON invoices(tenant_id, number);
CREATE INDEX IF NOT EXISTS idx_inv_status  ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_contact ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_inv_session ON invoices(stripe_session_id);

CREATE TABLE IF NOT EXISTS digests (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  kind        TEXT NOT NULL,                -- compliance_daily
  sent_to     TEXT,
  subject     TEXT,
  body        TEXT,
  delivered   INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_digest_tenant ON digests(tenant_id, created_at);
