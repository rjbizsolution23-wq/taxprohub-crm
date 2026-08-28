-- ═══════════════════════════════════════════════════════════════════
-- 0004 — Compliance Command Center
-- ═══════════════════════════════════════════════════════════════════
-- A chief compliance orchestrator supervising 20 specialist agents. Every
-- agent runs a REAL query against tenant data and opens/resolves findings —
-- no simulated scores.

CREATE TABLE IF NOT EXISTS compliance_agents (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  agent_key     TEXT NOT NULL,
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL,
  authority     TEXT,                       -- governing rule / citation
  cadence       TEXT DEFAULT 'daily',
  status        TEXT DEFAULT 'active',      -- active | paused
  last_run_at   TEXT,
  last_duration_ms INTEGER DEFAULT 0,
  open_findings INTEGER DEFAULT 0,
  checks_run    INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comp_agent_key ON compliance_agents(tenant_id, agent_key);

CREATE TABLE IF NOT EXISTS compliance_runs (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  trigger           TEXT DEFAULT 'manual',  -- manual | cron | event
  started_at        TEXT NOT NULL,
  completed_at      TEXT,
  agents_run        INTEGER DEFAULT 0,
  findings_opened   INTEGER DEFAULT 0,
  findings_resolved INTEGER DEFAULT 0,
  score             INTEGER DEFAULT 0,
  summary           TEXT DEFAULT '{}',
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comp_runs_tenant ON compliance_runs(tenant_id, started_at);

CREATE TABLE IF NOT EXISTS compliance_findings (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  agent_key    TEXT NOT NULL,
  fingerprint  TEXT NOT NULL,               -- stable per issue → dedupes across runs
  severity     TEXT NOT NULL,               -- critical | high | medium | low
  title        TEXT NOT NULL,
  detail       TEXT,
  authority    TEXT,
  entity_type  TEXT,
  entity_id    TEXT,
  remediation  TEXT,
  deep_link    TEXT,
  status       TEXT DEFAULT 'open',         -- open | resolved | waived
  first_seen   TEXT NOT NULL,
  last_seen    TEXT NOT NULL,
  resolved_at  TEXT,
  waived_by    TEXT,
  waive_reason TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comp_find_fp   ON compliance_findings(tenant_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_comp_find_status      ON compliance_findings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_comp_find_agent       ON compliance_findings(tenant_id, agent_key);
