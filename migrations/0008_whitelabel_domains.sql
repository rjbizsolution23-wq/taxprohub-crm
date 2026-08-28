-- ═══════════════════════════════════════════════════════════════════
-- 0008 — White-label sub-accounts + custom domain routing
-- ═══════════════════════════════════════════════════════════════════
-- A tenant may operate child practices (white-label sub-accounts). Each one is
-- a real tenant row with parent_tenant_id set on this mapping table, so all the
-- existing tenant-scoped queries keep working untouched.

CREATE TABLE IF NOT EXISTS tenant_hierarchy (
  tenant_id        TEXT PRIMARY KEY,
  parent_tenant_id TEXT NOT NULL,
  label            TEXT,
  revenue_share_pct REAL DEFAULT 0,
  status           TEXT DEFAULT 'active',
  created_by       TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hier_parent ON tenant_hierarchy(parent_tenant_id);

-- Custom domains / subdomains that resolve to a tenant's branded surfaces
-- (client portal, public intake forms, signing pages).
CREATE TABLE IF NOT EXISTS tenant_domains (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  hostname      TEXT NOT NULL,
  kind          TEXT DEFAULT 'portal',   -- portal | marketing | forms
  status        TEXT DEFAULT 'pending',  -- pending | verifying | active | failed
  verify_token  TEXT,
  verified_at   TEXT,
  is_primary    INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_host ON tenant_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_domain_tenant ON tenant_domains(tenant_id);
