# 🔥 MYVIRTUAL TAX SOFTWARE — BACKEND LOGIC + INTEGRATION KNOWLEDGE BASE v1.0

🧠 PART 1 — BACKEND ARCHITECTURE OVERVIEW
```
Frontend (Next.js 16.2 on Cloudflare Pages)
    ↓ HTTPS + JWT
API Gateway (Cloudflare Workers + Hono 4.12.8)
    ↓
    ├── Auth Layer (Supabase Auth + NextAuth v5)
    ├── Business Logic Layer (Workers)
    ├── AI Orchestrator (Cloudflare AI Gateway → Claude/GPT/Llama)
    ├── Queue Layer (Cloudflare Queues — async jobs)
    ├── Real-time Layer (Durable Objects — chat, presence, collab)
    ↓
Data Layer:
    ├── Supabase Postgres 17 (relational — contacts, deals, users)
    ├── Cloudflare D1 (edge — sessions, cache, rate limits)
    ├── Cloudflare KV (feature flags, configs)
    ├── Cloudflare R2 (document vault — W-2s, 1099s, returns)
    ├── Cloudflare Vectorize (embeddings — AI memory, search)
    └── Cloudflare Queues (background jobs — OCR, email, IRS sync)

External Integrations (via MCP-wrapped adapters in packages/integrations/):
    TaxSlayer | IRS MeF | Drake | Stripe | Twilio | Resend |
    Lob | Click2Mail | DocuSign | Verifyle | Plaid | Experian |
    Meta Graph | Google Calendar | OpenAI | Anthropic | SmartVault
```

🛠 *PART 2 — BACKEND FUNCTIONS (BY DOMAIN)*

### 2.1 AUTHENTICATION & USER MANAGEMENT
```
POST   /api/auth/signup              // create tenant + admin user
POST   /api/auth/login               // RS256 JWT (15m access, 7d refresh)
POST   /api/auth/logout              // revoke refresh token
POST   /api/auth/refresh             // rotate access token
POST   /api/auth/forgot-password     // email reset link via Resend
POST   /api/auth/reset-password      // argon2id rehash
POST   /api/auth/verify-email        // 6-digit code
POST   /api/auth/mfa/enable          // TOTP via otplib
POST   /api/auth/mfa/verify          // 6-digit TOTP code
GET    /api/auth/session             // current user + tenant
POST   /api/auth/impersonate         // admin-only, audit-logged
GET    /api/users                    // list (tenant-scoped, RLS)
POST   /api/users/invite             // send invite email
PATCH  /api/users/:id/role           // change role (owner/admin/agent/viewer)
DELETE /api/users/:id                // soft-delete
```

### 2.2 CONTACTS / CLIENTS
```
GET    /api/contacts                 // paginated, filtered, RLS-scoped
POST   /api/contacts                 // create + auto-enrich
GET    /api/contacts/:id             // full profile
PATCH  /api/contacts/:id             // partial update
DELETE /api/contacts/:id             // soft-delete + audit
POST   /api/contacts/bulk-import     // CSV → Queue → batch insert
POST   /api/contacts/bulk-tag        // add/remove tags
POST   /api/contacts/:id/notes       // add note
POST   /api/contacts/:id/tasks       // add task
GET    /api/contacts/:id/timeline    // unified activity feed
GET    /api/contacts/:id/documents   // R2 file list
POST   /api/contacts/:id/merge       // dedupe duplicates
GET    /api/contacts/search          // full-text + vector (Vectorize)
```

### 2.3 PIPELINES & DEALS
```
GET    /api/pipelines                // tenant pipelines
POST   /api/pipelines                // create pipeline + stages
PATCH  /api/pipelines/:id            // rename, reorder stages
DELETE /api/pipelines/:id            // archive
GET    /api/deals                    // filter by pipeline/stage
POST   /api/deals                    // create deal
PATCH  /api/deals/:id/stage          // drag-drop → fires workflow trigger
PATCH  /api/deals/:id/value          // update amount
POST   /api/deals/:id/won            // mark won → trigger automations
POST   /api/deals/:id/lost           // mark lost + reason
GET    /api/deals/forecast           // weighted pipeline value
```

### 2.4 CALENDAR & APPOINTMENTS
```
GET    /api/calendar/events          // range query
POST   /api/calendar/events          // create + Google Calendar sync
PATCH  /api/calendar/events/:id      // reschedule
DELETE /api/calendar/events/:id      // cancel + notify
GET    /api/booking-links            // list public booking pages
POST   /api/booking-links            // create slug + availability
GET    /api/booking/:slug/slots      // public — show open times
POST   /api/booking/:slug/book       // public — book + email confirm
POST   /api/calendar/sync/google     // OAuth2 → Google Calendar API
POST   /api/calendar/sync/outlook    // OAuth2 → Microsoft Graph
```

### 2.5 CONVERSATIONS (UNIFIED INBOX)
```
GET    /api/conversations            // all channels merged
GET    /api/conversations/:id        // thread + messages
POST   /api/conversations/:id/reply  // routes to correct channel
POST   /api/sms/send                 // Twilio
POST   /api/sms/inbound              // Twilio webhook
POST   /api/email/send               // Resend
POST   /api/email/inbound            // Resend webhook (parse reply)
POST   /api/whatsapp/send            // Twilio WhatsApp / Meta Cloud
POST   /api/whatsapp/inbound         // webhook
POST   /api/messenger/send           // Meta Graph API
POST   /api/messenger/inbound        // webhook
POST   /api/voice/call               // Twilio Voice
POST   /api/voice/transcribe         // Whisper API → save transcript
```

### 2.6 CAMPAIGNS (EMAIL + SMS)
```
GET    /api/campaigns                // list
POST   /api/campaigns                // create draft
PATCH  /api/campaigns/:id            // edit content/audience
POST   /api/campaigns/:id/schedule   // queue send
POST   /api/campaigns/:id/send-now   // immediate dispatch
POST   /api/campaigns/:id/test       // send to test address
GET    /api/campaigns/:id/stats      // opens/clicks/replies/unsubscribes
POST   /api/campaigns/:id/ab-test    // split audience
POST   /api/campaigns/templates      // save reusable template
GET    /api/campaigns/templates      // list (50+ pre-built)
POST   /api/unsubscribe/:token       // CAN-SPAM compliance
POST   /api/sms-stop/:phone          // 10DLC STOP/HELP handling
```

### 2.7 WORKFLOWS (AUTOMATION ENGINE)
```
GET    /api/workflows                // list (active/draft/archived)
POST   /api/workflows                // save graph (nodes + edges JSON)
PATCH  /api/workflows/:id            // edit
POST   /api/workflows/:id/activate   // turn on
POST   /api/workflows/:id/test-run   // dry-run with sample data
GET    /api/workflows/:id/history    // execution log
POST   /api/workflows/trigger        // external webhook entry point
GET    /api/workflows/templates      // 20 pre-built tax templates
// Internal execution engine (Durable Object + Cloudflare Workflows):
//   - Each workflow = a DO instance
//   - Steps idempotent, state ≤1MiB
//   - step.waitForEvent() for human approvals
//   - retry() with exponential backoff
```

### 2.8 SITES & FUNNELS
```
GET    /api/sites                    // tenant sites
POST   /api/sites                    // create site
PATCH  /api/sites/:id                // update content tree (Craft.js JSON)
POST   /api/sites/:id/publish        // → Cloudflare Pages deploy
GET    /api/sites/:id/versions       // version history
POST   /api/sites/:id/rollback       // revert version
GET    /api/funnels                  // tenant funnels
POST   /api/funnels                  // create multi-step funnel
PATCH  /api/funnels/:id/step/:stepId // update step content
GET    /api/funnels/:id/analytics    // conversion rate per step
POST   /api/funnels/:id/clone        // duplicate
```

### 2.9 FORMS
```
GET    /api/forms                    // list
POST   /api/forms                    // create (drag-drop schema)
GET    /api/forms/:id/embed          // returns JS embed snippet
POST   /api/forms/:id/submit         // public — fires workflow trigger
GET    /api/forms/:id/submissions    // paginated
POST   /api/forms/:id/webhook        // forward submissions to URL
```

### 2.10 TAX MODULE (THE MOAT)
```
// Client tax profiles
GET    /api/tax/clients              // tax-specific roster
POST   /api/tax/clients/:id/profile  // SSN (encrypted), filing status
PATCH  /api/tax/clients/:id/profile  // update
GET    /api/tax/clients/:id/returns  // multi-year history
POST   /api/tax/clients/:id/returns  // start new return year

// Document intelligence
POST   /api/tax/documents/upload     // → R2 → Queue → OCR
GET    /api/tax/documents/:id        // signed R2 URL
POST   /api/tax/documents/:id/parse  // re-run OCR
GET    /api/tax/documents/:id/extracted // W-2/1099/1098 fields
DELETE /api/tax/documents/:id        // soft-delete (7-year retain per IRS)

// TaxSlayer integration
POST   /api/integrations/taxslayer/connect    // store API key (encrypted)
POST   /api/integrations/taxslayer/sync       // bi-directional pull
POST   /api/integrations/taxslayer/push       // send return data
GET    /api/integrations/taxslayer/status     // last sync, errors

// IRS MeF (Phase 2 — A2A channel)
POST   /api/integrations/irs/mef/submit       // file return
GET    /api/integrations/irs/mef/ack          // acknowledgment
POST   /api/integrations/irs/transcript       // request transcript

// E-signature (Form 8879)
POST   /api/tax/esign/send                    // → Verifyle or DocuSign
GET    /api/tax/esign/:id/status              // signed/pending
POST   /api/tax/esign/webhook                 // signature complete

// Refund tracking
GET    /api/tax/refund/:id/status             // IRS Where's My Refund
POST   /api/tax/refund-advance/apply          // bank product

// AI tax features
POST   /api/ai/tax/refund-maximizer           // suggest deductions
POST   /api/ai/tax/audit-shield               // risk score 0-100
POST   /api/ai/tax/document-parse             // OCR + LLM extract
POST   /api/ai/tax/q-and-a                    // year-round chatbot
```

### 2.11 CREDIT REPAIR MODULE
```
GET    /api/credit/clients                    // credit clients
POST   /api/credit/clients/:id/pull-report    // Experian/Equifax/TU
GET    /api/credit/clients/:id/disputes       // active disputes
POST   /api/credit/clients/:id/disputes       // create dispute
POST   /api/credit/disputes/:id/send-letter   // → Lob.com physical mail
GET    /api/credit/disputes/:id/tracking      // USPS tracking
POST   /api/credit/letters/templates          // 609, 623, 611 templates
```

### 2.12 PAYMENTS & BILLING
```
POST   /api/stripe/checkout/create            // Stripe Checkout session
POST   /api/stripe/portal/create              // customer billing portal
POST   /api/stripe/webhook                    // verified signature
GET    /api/billing/subscription              // current tier
POST   /api/billing/upgrade                   // change plan
POST   /api/billing/cancel                    // schedule cancel
GET    /api/billing/invoices                  // history
GET    /api/billing/usage                     // AI tokens, SMS sent, etc.
POST   /api/stripe/connect/onboard            // sub-account Stripe Connect
POST   /api/stripe/connect/payout             // sub-account payouts
```

### 2.13 SUB-ACCOUNTS (WHITE-LABEL)
```
GET    /api/sub-accounts                      // master only
POST   /api/sub-accounts                      // create tenant
PATCH  /api/sub-accounts/:id/branding         // logo, colors, domain
POST   /api/sub-accounts/:id/domain           // custom domain + SSL
GET    /api/sub-accounts/:id/usage            // limits + consumption
POST   /api/sub-accounts/:id/suspend          // freeze access
DELETE /api/sub-accounts/:id                  // full teardown
```

### 2.14 AI ASSISTANT
```
POST   /api/ai/chat                           // streaming SSE response
POST   /api/ai/chat/history                   // persist conversation
GET    /api/ai/agents                         // library (10+ agents)
POST   /api/ai/agents/:name/run               // invoke specific agent
POST   /api/ai/embed                          // create embedding → Vectorize
POST   /api/ai/search                         // semantic search corpus
POST   /api/ai/summarize                      // doc/meeting summary
POST   /api/ai/draft-email                    // generate email copy
POST   /api/ai/draft-sms                      // generate SMS copy
```

### 2.15 ANALYTICS & REPORTING
```
GET    /api/analytics/overview                // KPI tiles
GET    /api/analytics/revenue                 // MRR, churn, LTV
GET    /api/analytics/leads                   // source attribution
GET    /api/analytics/conversion              // funnel rates
GET    /api/analytics/team                    // agent performance
POST   /api/reports/export                    // CSV/PDF
```

### 2.16 SYSTEM / ADMIN
```
GET    /api/audit-log                         // immutable trail
GET    /api/health                            // liveness probe
GET    /api/health/deep                       // checks all integrations
POST   /api/webhooks                          // register outbound webhook
GET    /api/feature-flags                     // KV-backed flags
POST   /api/notifications/send                // in-app notification
GET    /api/notifications                     // user inbox
```

**Total**: ~180 API endpoints across 16 domains.

---

🔌 *PART 3 — INTEGRATION KNOWLEDGE BASE*

Every URL verified live 2026-05-25.

### 3.1 TAX SOFTWARE
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **TaxSlayer Pro** | Bi-directional return sync | https://www.taxslayerpro.com/ (no public API — partner program required; contact partner@taxslayerpro.com) |
| **Drake Software** | Document + return integration | https://www.drakesoftware.com/sharedassets/help/2022/drake-documents-integration.html |
| **IRS MeF (A2A)** | E-file submission | https://www.irs.gov/e-file-providers/modernized-e-file-mef-user-guides-and-publications |
| **IRS Pub 4164** | MeF developer guide | https://www.irs.gov/pub/irs-pdf/p4164.pdf |
| **IRS Pub 4557** | Data safeguards compliance | https://www.irs.gov/pub/irs-pdf/p4557.pdf |
| **SmartVault** | Tax document portal | https://www.smartvault.com/ |
| **Verifyle** | IRS-compliant e-sign (Form 8879/8878) | https://verifyle.com/compliance.html |

### 3.2 COMMUNICATION
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **Twilio (SMS/Voice)** | SMS + voice | https://www.twilio.com/docs |
| **Twilio A2P 10DLC** | US SMS compliance | https://www.twilio.com/docs/messaging/compliance/a2p-10dlc |
| **Twilio WhatsApp** | WhatsApp messaging | https://www.twilio.com/en-us/messaging/channels/whatsapp |
| **Meta WhatsApp Cloud API** | Direct WhatsApp | https://developers.facebook.com/documentation/business-messaging/whatsapp/overview |
| **Meta Graph API** | FB Messenger + Instagram DM | https://developers.facebook.com/ |
| **Resend** | Transactional + marketing email | https://resend.com/docs/api-reference/emails/send-email |
| **Google Calendar API** | Calendar sync | https://developers.google.com/workspace/calendar/api/guides/create-events |

### 3.3 PAYMENTS & BANKING
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **Stripe (Subscriptions)** | Billing | https://docs.stripe.com/api/subscriptions |
| **Stripe Webhooks** | Event handling | https://docs.stripe.com/webhooks |
| **Stripe Billing Webhooks** | Subscription events | https://docs.stripe.com/billing/subscriptions/webhooks |
| **Stripe Connect** | Sub-account payouts | https://docs.stripe.com/connect |
| **Plaid Auth** | Bank account verification | https://plaid.com/products/auth/ |
| **Plaid Identity** | Ownership match | https://plaid.com/products/identity/ |
| **Plaid Docs Home** | All endpoints | https://plaid.com/docs/ |

### 3.4 PHYSICAL MAIL (CREDIT REPAIR + IRS LETTERS)
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **Lob.com** | Direct mail API (letters/postcards/checks) | https://docs.lob.com/ |
| **Lob Integrations** | Mail automation guide | https://www.lob.com/apis-and-integrations |
| **Click2Mail Developer Hub** | REST + Batch XML mail API | https://developers.click2mail.com/ |
| **Click2Mail Create Job** | POST a mail job | https://developers.click2mail.com/reference/post_2 |

### 3.5 E-SIGNATURE
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **DocuSign eSign REST** | Full e-sign | https://developers.docusign.com/docs/esign-rest-api/ |
| **DocuSign API Reference** | All endpoints | https://developers.docusign.com/docs/esign-rest-api/reference/ |
| **Verifyle** | Tax-specific e-sign | https://verifyle.com/ |

### 3.6 CREDIT BUREAUS
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **Experian Developer Hub** | Credit profile API | https://developer.experian.com/ |
| **Experian Connect API** | Embedded credit check | https://www.experian.com/connect/api/ |
| **Experian API Hub** | All APIs | https://www.experian.com/business-information/api-hub |
| **CRS Credit API (multi-bureau)** | Aggregated 3-bureau | https://crscreditapi.redoc.ly/openapi/reference/tag/Experian/ |

### 3.7 AI / LLM
| Integration | Purpose | Primary Doc URL |
|---|---|---|
| **OpenAI API Reference** | GPT-4o, Whisper, Vision | https://developers.openai.com/api/reference/overview/ |
| **OpenAI Chat Completions** | Chat API | https://developers.openai.com/api/reference/chat-completions/overview/ |
| **OpenAI Vision** | Image/doc parsing | https://developers.openai.com/api/docs/guides/images-vision |
| **Anthropic Claude API** | Claude Messages | https://platform.claude.com/docs/en/api/messages |
| **Anthropic Build Guide** | Working with messages | https://platform.claude.com/docs/en/build-with-claude/working-with-messages |
| **Anthropic Intro** | Claude overview | https://platform.claude.com/docs/en/intro |

### 3.8 INFRASTRUCTURE (CLOUDFLARE)
| Service | Purpose | Primary Doc URL |
|---|---|---|
| **Cloudflare Workers Storage** | All storage options | https://developers.cloudflare.com/workers/platform/storage-options/ |
| **Cloudflare Vectorize** | Vector DB for AI memory | https://developers.cloudflare.com/vectorize/ |
| **Cloudflare Workers Pricing** | Limits + costs | https://developers.cloudflare.com/workers/platform/pricing/ |
| **Cloudflare Agents SDK** | Stateful agents on DOs | https://developers.cloudflare.com/agents/ |

### 3.9 AUTH / DATABASE
| Service | Purpose | Primary Doc URL |
|---|---|---|
| **Supabase RLS** | Row-level security | https://supabase.com/docs/guides/database/postgres/row-level-security |
| **Supabase Column Security** | Column-level | https://supabase.com/docs/guides/database/postgres/column-level-security |

---

🧬 *PART 4 — DATA MODELS (CORE TABLES)*

```sql
-- tenants (top-level isolation)
tenants(id, name, subdomain, custom_domain, plan_tier,
        stripe_customer_id, brand_config_json, created_at)

-- users (multi-tenant via tenant_id + RLS)
users(id, tenant_id, email, password_hash, role, mfa_secret,
      last_login_at, created_at)

-- contacts (CRM core)
contacts(id, tenant_id, first_name, last_name, email, phone,
         tags[], custom_fields_json, lifecycle_stage,
         lead_source, owner_id, created_at, updated_at)

-- tax_profiles (1:1 with contacts for tax clients)
tax_profiles(contact_id, tenant_id, ssn_encrypted, filing_status,
             dependents_json, prior_year_agi, refund_history_json,
             irs_pin, ptin_signed)

-- documents (R2 references)
documents(id, tenant_id, contact_id, r2_key, filename, mime_type,
          doc_type, ocr_status, extracted_json,
          retention_until, uploaded_by, created_at)

-- pipelines + deals
pipelines(id, tenant_id, name, stages_json, created_at)
deals(id, tenant_id, pipeline_id, contact_id, stage_id, value_cents,
      expected_close_date, owner_id, won_at, lost_reason)

-- conversations (unified inbox)
conversations(id, tenant_id, contact_id, channel,
              channel_thread_id, last_message_at, unread_count)
messages(id, conversation_id, direction, body, attachments_json,
         channel_message_id, sent_at, read_at)

-- campaigns
campaigns(id, tenant_id, type, status, audience_filter_json,
          content_json, scheduled_at, sent_at, stats_json)

-- workflows
workflows(id, tenant_id, name, status, graph_json,
          version, created_at)
workflow_runs(id, workflow_id, contact_id, status,
              current_step, state_json, started_at, finished_at)

-- subscriptions / billing
subscriptions(id, tenant_id, stripe_subscription_id, plan,
              status, current_period_end, cancel_at_period_end)

-- audit_log (immutable, append-only)
audit_log(id, tenant_id, actor_id, action, resource_type,
          resource_id, before_json, after_json, ip, user_agent, at)

-- ai_memory (Vectorize binding — not SQL, vector index)
-- index: rj-myvirtual-{tenant_id}-memory
-- embeddings of: docs, conversations, contact notes, return summaries
```

---

🔁 *PART 5 — BACKGROUND JOB QUEUES (Cloudflare Queues)*

| Queue Name | Trigger | Handler |
|---|---|---|
| **myvirtual-doc-ocr** | document uploaded | run OCR (OpenAI Vision) → extract → save |
| **myvirtual-email-send** | campaign scheduled | batch send via Resend (100/req) |
| **myvirtual-sms-send** | campaign scheduled | batch send via Twilio (respect 10DLC TPS) |
| **myvirtual-taxslayer-sync** | every 15min cron | pull deltas, push outbound |
| **myvirtual-irs-mef-poll** | every 1hr cron | check MeF acknowledgments |
| **myvirtual-workflow-step** | workflow trigger | execute next DO step |
| **myvirtual-webhook-out** | event fired | retry-with-backoff outbound webhooks |
| **myvirtual-ai-embed** | doc parsed | embed → Vectorize upsert |
| **myvirtual-lob-mail** | dispute letter created | POST to Lob, track delivery |
| **myvirtual-audit-flush** | every action | append to immutable log |

---

🛡 *PART 6 — COMPLIANCE LOGIC (NON-NEGOTIABLE)*

Per IRS Pub 4557 + FTC Safeguards Rule:
* **Encryption at rest**: SSN, bank info, EIN, PTIN — AES-256 via Cloudflare encryption + envelope keys
* **Encryption in transit**: TLS 1.3 only, HSTS preload
* **Access control**: RLS on every Postgres table, role-based on every route
* **Audit log**: every read/write on sensitive fields → `audit_log` table, 7-year retention
* **Session timeout**: 15min idle for tax module routes
* **MFA**: mandatory for any user with tax data access
* **Data retention**: tax records 7 years per IRS, then auto-purge
* **Breach notification**: auto-trigger FTC notification workflow if `audit_log` detects anomaly
* **WISP document**: auto-generated per tenant on signup, stored in R2

Per CAN-SPAM + 10DLC:
* One-click unsubscribe in every email (Resend header)
* `STOP`/`HELP`/`INFO` handlers on every Twilio number
* Quiet hours enforced (no SMS 9pm–8am local)
* Brand registration required before campaigns activate

---

🧠 *PART 7 — AI MEMORY ARCHITECTURE*

```
Per-tenant Vectorize index: rj-myvirtual-{tenant_id}-memory

Indexed content:
  ├── All conversation messages (tagged: contact_id, channel)
  ├── All document OCR extractions (tagged: doc_type, year)
  ├── All contact notes (tagged: contact_id, author)
  ├── All return summaries (tagged: tax_year, contact_id)
  ├── All workflow run outcomes (tagged: workflow_id, success/fail)
  └── All AI assistant Q&A history (tagged: user_id, session)

Embedding model: @cf/baai/bge-large-en-v1.5 (1024 dim)

Retrieval pattern:
  Before any AI chat response:
    1. Embed user query
    2. Vectorize.query(topK=10, filter={tenant_id, contact_id?})
    3. Build context = top-K chunks + recent conversation
    4. Send to Claude/GPT with grounded context
    5. Stream response back via SSE
```

---

✅ *PART 8 — MASTER PROMPT FOR YOUR AI BUILDER*

Paste this at the end of your existing master prompt so the AI has full backend knowledge:

```
═══════════════════════════════════════════════════════════════════════
BACKEND LOGIC + INTEGRATIONS — MANDATORY REFERENCE
═══════════════════════════════════════════════════════════════════════

This system has ~180 API endpoints across 16 domains. Use the spec
in BACKEND-LOGIC-AND-INTEGRATIONS.md as the source of truth.

When you generate any backend code:
  1. Match endpoint names EXACTLY (no renaming)
  2. Tenant-scope every query via RLS
  3. Wrap every external API call in packages/integrations/{vendor}/
  4. Validate with Zod on every route
  5. Audit-log every mutation
  6. Encrypt SSN/EIN/bank fields with AES-256
  7. Use the official doc URLs below for every integration:

     TaxSlayer:    https://www.taxslayerpro.com/
     IRS MeF:      https://www.irs.gov/e-file-providers/modernized-e-file-mef-user-guides-and-publications
     IRS Pub 4164: https://www.irs.gov/pub/irs-pdf/p4164.pdf
     IRS Pub 4557: https://www.irs.gov/pub/irs-pdf/p4557.pdf
     Stripe:       https://docs.stripe.com/api/subscriptions
     Stripe WH:    https://docs.stripe.com/webhooks
     Twilio:       https://www.twilio.com/docs
     Twilio 10DLC: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
     WhatsApp:     https://developers.facebook.com/documentation/business-messaging/whatsapp/overview
     Meta Graph:   https://developers.facebook.com/
     Resend:       https://resend.com/docs/api-reference/emails/send-email
     Google Cal:   https://developers.google.com/workspace/calendar/api/guides/create-events
     Lob:          https://docs.lob.com/
     Click2Mail:   https://developers.click2mail.com/
     DocuSign:     https://developers.docusign.com/docs/esign-rest-api/
     Verifyle:     https://verifyle.com/compliance.html
     Plaid:        https://plaid.com/docs/
     Experian:     https://developer.experian.com/
     OpenAI:       https://developers.openai.com/api/reference/overview/
     Anthropic:    https://platform.claude.com/docs/en/api/messages
     CF Workers:   https://developers.cloudflare.com/workers/platform/storage-options/
     CF Vectorize: https://developers.cloudflare.com/vectorize/
     Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
     SmartVault:   https://www.smartvault.com/

Never hardcode credentials. Always wrangler secret put.
Never skip Zod validation. Never bypass RLS.
Never log SSN/EIN/bank numbers (mask to last-4 only).
═══════════════════════════════════════════════════════════════════════
```
