-- ═══════════════════════════════════════════════════════════════════════
-- TAX PRO HUB UNIVERSITY — Cloudflare D1 Core Schema (v1)
-- Multi-tenant practice management platform. All timestamps are ISO-8601
-- TEXT (UTC). Complex objects live in JSON TEXT columns to keep the edge
-- schema portable; top-level fields are first-class for querying/filtering.
-- ═══════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ─────────────────────────── TENANTS ───────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  business_name   TEXT NOT NULL DEFAULT '',
  business_address TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL DEFAULT '',
  logo            TEXT NOT NULL DEFAULT '',
  domain          TEXT NOT NULL DEFAULT '',
  colors          TEXT NOT NULL DEFAULT '{}',      -- JSON BrandColors
  status          TEXT NOT NULL DEFAULT 'active',  -- active | suspended | pending
  plan            TEXT NOT NULL DEFAULT 'growth',  -- starter | growth | enterprise
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- ─────────────────────────── USERS ───────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',     -- admin | manager | user
  password_hash TEXT NOT NULL,                     -- pbkdf2$iter$salt$hash
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ─────────────────────────── SESSIONS ───────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,                 -- sha256(token) — token itself is never stored
  expires_at TEXT NOT NULL,
  ip         TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ─────────────────────────── PIPELINES ───────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#D4AF37',
  is_default INTEGER NOT NULL DEFAULT 0,
  stages     TEXT NOT NULL DEFAULT '[]',           -- JSON PipelineStage[]
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON pipelines(tenant_id);

-- ─────────────────────────── CONTACTS ───────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  company       TEXT NOT NULL DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '[]',        -- JSON string[]
  custom_fields TEXT NOT NULL DEFAULT '{}',        -- JSON Record<string,string>
  source        TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'lead',      -- lead | prospect | customer | inactive
  assigned_to   TEXT NOT NULL DEFAULT '',
  pipeline_id   TEXT NOT NULL DEFAULT '',
  stage_id      TEXT NOT NULL DEFAULT '',
  value         REAL NOT NULL DEFAULT 0,
  notes         TEXT NOT NULL DEFAULT '[]',        -- JSON Note[]
  activities    TEXT NOT NULL DEFAULT '[]',        -- JSON Activity[]
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- ─────────────────────────── DEALS ───────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  title                     TEXT NOT NULL DEFAULT '',
  contact_id                TEXT NOT NULL DEFAULT '',
  contact_name              TEXT NOT NULL DEFAULT '',
  spouse_name               TEXT NOT NULL DEFAULT '',
  pipeline_id               TEXT NOT NULL DEFAULT '',
  stage_id                  TEXT NOT NULL DEFAULT '',
  value                     REAL NOT NULL DEFAULT 0,
  probability               REAL NOT NULL DEFAULT 0,
  expected_close_date       TEXT NOT NULL DEFAULT '',
  assigned_to               TEXT NOT NULL DEFAULT '',
  owner_id                  TEXT NOT NULL DEFAULT '',
  owner_name                TEXT NOT NULL DEFAULT '',
  tags                      TEXT NOT NULL DEFAULT '[]',
  source                    TEXT NOT NULL DEFAULT '',
  dependents_count          INTEGER NOT NULL DEFAULT 0,
  filing_complexity         TEXT NOT NULL DEFAULT 'Simple',
  fee_structure             TEXT NOT NULL DEFAULT 'Flat',
  estimated_refund          REAL NOT NULL DEFAULT 0,
  estimated_balance_due     REAL NOT NULL DEFAULT 0,
  returns_count             INTEGER NOT NULL DEFAULT 0,
  days_in_stage             INTEGER NOT NULL DEFAULT 0,
  sla_days                  INTEGER NOT NULL DEFAULT 0,
  reviewer_name             TEXT NOT NULL DEFAULT '',
  deadline_countdown_days   INTEGER,
  document_completeness     TEXT NOT NULL DEFAULT '',
  mrr_amount                REAL,
  software_stack            TEXT NOT NULL DEFAULT '',
  transactions_per_month    INTEGER,
  cleanup_project           INTEGER,
  onboarding_status         TEXT NOT NULL DEFAULT '',
  health_score              TEXT NOT NULL DEFAULT '',
  irs_notice_type           TEXT NOT NULL DEFAULT '',
  tax_years_involved        TEXT NOT NULL DEFAULT '',
  amount_in_dispute         REAL NOT NULL DEFAULT 0,
  resolution_type           TEXT NOT NULL DEFAULT '',
  poa_expired               INTEGER,
  sol_date                  TEXT NOT NULL DEFAULT '',
  estimated_savings         REAL NOT NULL DEFAULT 0,
  croa_disclosure_sent      INTEGER,
  cancellation_window_status TEXT NOT NULL DEFAULT '',
  score_start               INTEGER,
  score_current             INTEGER,
  negative_items_disputed   INTEGER,
  funding_goal              TEXT NOT NULL DEFAULT '',
  custom_domain             TEXT NOT NULL DEFAULT '',
  revenue_share_percent     REAL,
  projected_volume          INTEGER,
  setup_progress            INTEGER,
  first_revenue_date        TEXT NOT NULL DEFAULT '',
  monthly_rev_share_owed    REAL,
  ai_score                  INTEGER NOT NULL DEFAULT 0,
  ai_rationale              TEXT NOT NULL DEFAULT '[]',
  ai_next_action            TEXT NOT NULL DEFAULT '',
  ai_stage_suggestion       TEXT NOT NULL DEFAULT '',
  ai_renewal_risk           TEXT NOT NULL DEFAULT '',
  commission_plan           TEXT NOT NULL DEFAULT '',
  commission_splits         TEXT NOT NULL DEFAULT '[]',
  manager_override_percent  REAL,
  clawback_window_days      INTEGER,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);

-- ─────────────────────────── APPOINTMENTS ───────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'meeting',     -- meeting | call | webinar | consultation
  status      TEXT NOT NULL DEFAULT 'scheduled',   -- scheduled | confirmed | cancelled | completed | no-show
  contact_id  TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  meeting_link TEXT NOT NULL DEFAULT '',
  reminders   TEXT NOT NULL DEFAULT '[]',          -- JSON Reminder[]
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);

-- ─────────────────────────── CAMPAIGNS ───────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'email', -- email | sms | both
  status            TEXT NOT NULL DEFAULT 'draft', -- draft | scheduled | sending | completed | paused
  subject           TEXT NOT NULL DEFAULT '',
  content           TEXT NOT NULL DEFAULT '',
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  sent_count        INTEGER NOT NULL DEFAULT 0,
  opened_count      INTEGER NOT NULL DEFAULT 0,
  clicked_count     INTEGER NOT NULL DEFAULT 0,
  scheduled_at      TEXT NOT NULL DEFAULT '',
  sent_at           TEXT NOT NULL DEFAULT '',
  completed_at      TEXT NOT NULL DEFAULT '',
  sequence          TEXT NOT NULL DEFAULT '[]',    -- JSON DripStep[]
  audience          TEXT NOT NULL DEFAULT '',
  goal              TEXT NOT NULL DEFAULT '',
  source_template_id TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);

-- ─────────────────────────── WORKFLOWS ───────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  trigger    TEXT NOT NULL DEFAULT '{}',           -- JSON WorkflowTrigger
  actions    TEXT NOT NULL DEFAULT '[]',           -- JSON WorkflowAction[]
  is_active  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);

-- ─────────────────────────── FUNNELS ───────────────────────────
CREATE TABLE IF NOT EXISTS funnels (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL DEFAULT '',
  published  INTEGER NOT NULL DEFAULT 0,
  steps      TEXT NOT NULL DEFAULT '[]',           -- JSON FunnelStep[]
  stats      TEXT NOT NULL DEFAULT '{}',           -- JSON FunnelStats
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_funnels_tenant ON funnels(tenant_id);

-- ─────────────────────────── WEBSITES ───────────────────────────
CREATE TABLE IF NOT EXISTS websites (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL DEFAULT '',
  pages      TEXT NOT NULL DEFAULT '[]',           -- JSON WebPage[]
  theme      TEXT NOT NULL DEFAULT '{}',           -- JSON WebsiteTheme
  published  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_websites_tenant ON websites(tenant_id);

-- ─────────────────────────── FORMS ───────────────────────────
CREATE TABLE IF NOT EXISTS forms (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL DEFAULT '',
  fields      TEXT NOT NULL DEFAULT '[]',          -- JSON FormField[]
  settings    TEXT NOT NULL DEFAULT '{}',          -- JSON FormSettings
  submissions TEXT NOT NULL DEFAULT '[]',          -- JSON FormSubmission[]
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_forms_tenant ON forms(tenant_id);

-- ─────────────────────────── BLOG POSTS ───────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL DEFAULT '',
  content        TEXT NOT NULL DEFAULT '',
  excerpt        TEXT NOT NULL DEFAULT '',
  featured_image TEXT NOT NULL DEFAULT '',
  author_id      TEXT NOT NULL DEFAULT '',
  author_name    TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'draft',    -- draft | published | scheduled
  tags           TEXT NOT NULL DEFAULT '[]',
  published_at   TEXT NOT NULL DEFAULT '',
  scheduled_at   TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant ON blog_posts(tenant_id);

-- ─────────────────────────── PREPARERS ───────────────────────────
CREATE TABLE IF NOT EXISTS preparers (
  id                 TEXT PRIMARY KEY,
  tenant_id          TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  email              TEXT NOT NULL DEFAULT '',
  phone              TEXT NOT NULL DEFAULT '',
  avatar             TEXT NOT NULL DEFAULT '',
  role               TEXT NOT NULL DEFAULT 'junior_preparer',
  status             TEXT NOT NULL DEFAULT 'active',
  ptin               TEXT NOT NULL DEFAULT '',
  efin               TEXT NOT NULL DEFAULT '',
  credentials        TEXT NOT NULL DEFAULT '[]',
  pay_structure      TEXT NOT NULL DEFAULT 'flat', -- percentage | flat
  payout_rate        REAL NOT NULL DEFAULT 0,
  assigned_client_ids TEXT NOT NULL DEFAULT '[]',
  assigned_deal_ids  TEXT NOT NULL DEFAULT '[]',
  payout_ledger      TEXT NOT NULL DEFAULT '[]',
  ce_credits         INTEGER NOT NULL DEFAULT 0,
  circular230_status TEXT NOT NULL DEFAULT 'pending',
  performance        TEXT NOT NULL DEFAULT '{}',   -- JSON PreparerPerformance
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_preparers_tenant ON preparers(tenant_id);

-- ─────────────────────────── PAYOUTS ───────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preparer_id      TEXT NOT NULL,
  preparer_name    TEXT NOT NULL DEFAULT '',
  deal_id          TEXT NOT NULL DEFAULT '',
  deal_title       TEXT NOT NULL DEFAULT '',
  amount           REAL NOT NULL DEFAULT 0,
  base_amount      REAL NOT NULL DEFAULT 0,
  commission_amount REAL NOT NULL DEFAULT 0,
  method           TEXT NOT NULL DEFAULT 'stripe', -- direct_deposit | stripe | check | wire
  status           TEXT NOT NULL DEFAULT 'pending',
  reference_number TEXT NOT NULL DEFAULT '',
  payment_date     TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payouts_tenant ON payouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_preparer ON payouts(preparer_id);

-- ─────────────────────────── API KEYS ───────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  key_hash   TEXT NOT NULL UNIQUE,                 -- sha256(key); plaintext shown once
  scopes     TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

-- ─────────────────────────── AUDIT LOG ───────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL DEFAULT '',
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL DEFAULT '',
  resource_id TEXT NOT NULL DEFAULT '',
  details     TEXT NOT NULL DEFAULT '{}',
  ip          TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);

-- ─────────────────────────── SESSION CLEANUP ───────────────────────────
DELETE FROM sessions WHERE expires_at < datetime('now');
