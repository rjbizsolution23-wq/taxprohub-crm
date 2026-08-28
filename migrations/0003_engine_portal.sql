-- ═══════════════════════════════════════════════════════════════════
-- 0003 — Delivery engine + client portal
-- ═══════════════════════════════════════════════════════════════════
--  • campaign_runs / campaign_recipients  → real scheduled email + SMS sends
--  • workflow_runs                        → durable automation enrollment
--  • portal_tokens / portal_sessions      → passwordless client portal
--  • tasks                                → the work queue surfaced on the dashboard

CREATE TABLE IF NOT EXISTS campaign_runs (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  campaign_id   TEXT NOT NULL,
  status        TEXT DEFAULT 'scheduled',   -- scheduled | sending | complete | cancelled
  scheduled_at  TEXT NOT NULL,
  started_at    TEXT,
  completed_at  TEXT,
  total         INTEGER DEFAULT 0,
  sent          INTEGER DEFAULT 0,
  failed        INTEGER DEFAULT 0,
  created_by    TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_camp_runs_tenant ON campaign_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_camp_runs_due    ON campaign_runs(status, scheduled_at);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  run_id        TEXT NOT NULL,
  campaign_id   TEXT NOT NULL,
  contact_id    TEXT,
  channel       TEXT NOT NULL,              -- email | sms
  address       TEXT NOT NULL,
  status        TEXT DEFAULT 'queued',      -- queued | sent | failed | skipped
  provider_id   TEXT,
  error         TEXT,
  scheduled_at  TEXT NOT NULL,
  sent_at       TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_camp_rcpt_run    ON campaign_recipients(run_id);
CREATE INDEX IF NOT EXISTS idx_camp_rcpt_due    ON campaign_recipients(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_camp_rcpt_tenant ON campaign_recipients(tenant_id);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  workflow_id   TEXT NOT NULL,
  contact_id    TEXT,
  status        TEXT DEFAULT 'active',      -- active | waiting | complete | failed | cancelled
  step_index    INTEGER DEFAULT 0,
  next_run_at   TEXT,
  context       TEXT DEFAULT '{}',
  log           TEXT DEFAULT '[]',
  error         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wf_runs_due    ON workflow_runs(status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_wf_runs_tenant ON workflow_runs(tenant_id);

CREATE TABLE IF NOT EXISTS portal_tokens (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  contact_id  TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_exp ON portal_tokens(expires_at);

CREATE TABLE IF NOT EXISTS portal_sessions (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  contact_id  TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_exp ON portal_sessions(expires_at);

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  contact_id   TEXT,
  deal_id      TEXT,
  assignee     TEXT,
  priority     TEXT DEFAULT 'medium',       -- low | medium | high | urgent
  status       TEXT DEFAULT 'To-Do',        -- To-Do | In-Progress | Blocked | Done
  due_at       TEXT,
  tags         TEXT DEFAULT '[]',
  source       TEXT DEFAULT 'manual',       -- manual | workflow | ai
  created_at   TEXT NOT NULL,
  updated_at   TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due    ON tasks(due_at);
