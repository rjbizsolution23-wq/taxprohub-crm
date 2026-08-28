-- ═══════════════════════════════════════════════════════════════════
-- 0002 — Secure Document Vault (Cloudflare R2 object metadata)
-- ═══════════════════════════════════════════════════════════════════
-- Binary content lives in R2 (binding DOCS); this table is the tenant-scoped
-- index: who owns it, which client/deal it belongs to, and where it sits.

CREATE TABLE IF NOT EXISTS files (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  contact_id    TEXT,
  deal_id       TEXT,
  name          TEXT NOT NULL,
  folder        TEXT DEFAULT 'General',
  doc_type      TEXT DEFAULT 'Other',
  tax_year      TEXT,
  content_type  TEXT DEFAULT 'application/octet-stream',
  size          INTEGER DEFAULT 0,
  r2_key        TEXT NOT NULL,
  sha256        TEXT,
  uploaded_by   TEXT,
  status        TEXT DEFAULT 'stored',
  metadata      TEXT DEFAULT '{}',
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_tenant   ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_contact  ON files(contact_id);
CREATE INDEX IF NOT EXISTS idx_files_deal     ON files(deal_id);
CREATE INDEX IF NOT EXISTS idx_files_created  ON files(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_key ON files(r2_key);
