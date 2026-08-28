// packages/db/schema/pipelines-v2.ts
// RJ Business Solutions - Tax Firm Revenue OS Relational Schema (Drizzle Specs)
// Fully compliant with IRS Pub 4557, GLBA, CROA, FCRA, and FTC guidelines.
// Created: 2026-05-26 01:07:00 MST by Rick Jefferson, Supreme Meta AGI

import { pgTable, uuid, text, integer, numeric, boolean, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core';
import { contacts } from './contacts'; // Linked household records

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),                  // e.g., 'Tax Prep 2026', 'Bookkeeping MRR', 'IRS Audit Rep'
  type: text('type').notNull(),                  // 'tax_prep' | 'bookkeeping' | 'irs_rep' | 'credit' | 'bureau' | 'custom'
  currency: text('currency').default('USD'),
  defaultProbabilityModel: text('default_probability_model').default('stage_based'), // stage_based | ai_predicted | manual
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  ownerId: uuid('owner_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  tenantIdx: index('pipelines_tenant_idx').on(t.tenantId),
}));

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  probability: integer('probability').notNull(),        // Default stage probability (0-100)
  slaHours: integer('sla_hours'),                       // Service Level Agreement maximum dwell time
  requiredFields: jsonb('required_fields'),             // Form field validation list needed to advance (e.g. ['signedContractDocId'])
  entryActions: jsonb('entry_actions'),                 // Auto workflows/webhooks to trigger on entry (e.g., send mail, billing push)
  exitActions: jsonb('exit_actions'),                   // Auto actions to trigger on stage exit
  color: text('color'),                                 // Styling token (hex/tailwind class)
  icon: text('icon'),                                   // Lucide icon key mapping
  isWonStage: boolean('is_won_stage').default(false),
  isLostStage: boolean('is_lost_stage').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  stageId: uuid('stage_id').notNull().references(() => pipelineStages.id),
  name: text('name').notNull(),
  primaryContactId: uuid('primary_contact_id').references(() => contacts.id),
  householdId: uuid('household_id'),                     // One dossier per household
  
  // Money & Pricing Struct (Flexible vertical modeling)
  value: numeric('value', { precision: 12, scale: 2 }).notNull().default('0.00'),
  currency: text('currency').default('USD'),
  probability: integer('probability'),                  // Overrides default stage probability if set manually or by AI
  recurringValue: numeric('recurring_value', { precision: 12, scale: 2 }),
  recurringInterval: text('recurring_interval'),         // monthly | quarterly | annual
  feeStructure: text('fee_structure'),                  // flat | per_form | hourly | percent_refund | subscription | contingency
  feeBreakdown: jsonb('fee_breakdown'),                   // Array of detailed charge items (quantity, unit rate, description)
  discountPercent: integer('discount_percent').default(0),
  salesTaxPercent: integer('sales_tax_percent').default(0),
  netContractValue: numeric('net_contract_value', { precision: 12, scale: 2 }),
  
  // Tax-Industry Specialized Variables
  taxYear: integer('tax_year'),
  filingComplexity: text('filing_complexity'),           // simple | moderate | complex | multi_state | business
  federalReturnsCount: integer('federal_returns_count').default(1),
  stateReturnsCount: integer('state_returns_count').default(0),
  estimatedRefund: numeric('estimated_refund', { precision: 12, scale: 2 }),
  estimatedBalanceDue: numeric('estimated_balance_due', { precision: 12, scale: 2 }),
  
  // IRS Representation Specifics
  irsNoticeType: text('irs_notice_type'),                 // CP2000 | CP504 | LT11 | etc.
  amountInDispute: numeric('amount_in_dispute', { precision: 12, scale: 2 }),
  resolutionType: text('resolution_type'),               // OIC (Offer in Compromise) | Installment | CNC (Currently Not Collectible)
  poaExpirationDate: date('poa_expiration_date'),
  statuteOfLimitationsDate: date('statute_of_limitations_date'),
  estimatedClientSavings: numeric('estimated_client_savings', { precision: 12, scale: 2 }),
  
  // Credit Repair Specifics (CROA / FCRA Gated)
  croaDisclosureSentAt: timestamp('croa_disclosure_sent_at'),
  cancellationWindowExpiresAt: timestamp('cancellation_window_expires_at'), // Strict 3-day statutory cooling window
  creditScoreStart: integer('credit_score_start'),
  creditScoreCurrent: integer('credit_score_current'),
  negativeItemsCount: integer('negative_items_count'),
  disputeMailedCount: integer('dispute_mailed_count'),
  fundingGoal: text('funding_goal'),                     // mortgage | business | auto
  
  // Service Bureau / White-label Reseller Specifics
  subAccountId: text('sub_account_id'),
  customDomainName: text('custom_domain_name'),
  revenueSharePercent: integer('revenue_share_percent'),  // e.g. 30 for 30/70 split
  projectedClientVolume: integer('projected_client_volume'),
  brandingSetupCompleted: boolean('branding_setup_completed').default(false),
  firstRevenueDate: date('first_revenue_date'),
  
  // Ownership & Split Commissions
  ownerId: uuid('owner_id'),                             // Lead owner
  splitOwners: jsonb('split_owners'),                    // Splits database list, e.g. [{ userId: 'uuid', pct: 30 }]
  commissionPlanId: uuid('commission_plan_id'),
  managerOverridePercent: integer('manager_override_percent').default(0),
  clawbackWindowDays: integer('clawback_window_days').default(30), // Reverse split if client requests refund
  
  // AI Copilot Brain Integration
  aiScore: integer('ai_score'),                          // 0-100 close-likelihood scoring index
  aiScoreRationale: text('ai_score_rationale'),          // Multi-bullet structured reasoning points
  aiNextAction: text('ai_next_action'),                  // Context-aware recommended task
  aiForecastOverride: numeric('ai_forecast_override', { precision: 12, scale: 2 }),
  aiRenewalRiskScore: integer('ai_renewal_risk_score'),  // 0-100 bookkeeping churn risk
  aiUpdatedAt: timestamp('ai_updated_at'),
  
  // Compliance Controls & Auditing
  fieldAccessRoleLevel: text('field_access_role_level').default('preparer'), // Field tier masking
  isClosedWonLocked: boolean('is_closed_won_locked').default(false),       // Freeze deal once Closed Won
  approvalRequiredByPartner: boolean('approval_required_by_partner').default(false), // High-ticket/discount gate
  
  // Metadata & Lifecycles
  status: text('status').default('open'),                // open | won | lost | abandoned | on_extension
  wonReason: text('won_reason'),
  lostReason: text('lost_reason'),
  lostToCompetitor: text('lost_to_competitor'),
  tags: jsonb('tags').default('[]'),
  customFields: jsonb('custom_fields'),
  source: text('source'),                                // utm, referral, website
  sourceUtmCampaign: text('source_utm_campaign'),
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
}, (t) => ({
  tenantPipelineIdx: index('deals_tenant_pipeline_idx').on(t.tenantId, t.pipelineId),
  stageIdx: index('deals_stage_idx').on(t.stageId),
  ownerIdx: index('deals_owner_idx').on(t.ownerId),
  closeDateIdx: index('deals_close_date_idx').on(t.expectedCloseDate),
  statusIdx: index('deals_status_idx').on(t.status),
}));

export const dealStageHistory = pgTable('deal_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  fromStageId: uuid('from_stage_id'),
  toStageId: uuid('to_stage_id').notNull(),
  daysInPrevStage: integer('days_in_prev_stage'),
  movedBy: uuid('moved_by'),
  movedAt: timestamp('moved_at').defaultNow(),
  reason: text('reason'),
  ipAddress: text('ip_address'),                        // Audited compliance tracking
  userBrowserAgent: text('user_browser_agent'),
});

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  userId: uuid('user_id').notNull(),                     // Rep getting paid
  role: text('role').notNull(),                          // closer | sdr | manager_override
  allocatedPercentage: integer('allocated_percentage').notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  clawbackApplied: boolean('clawback_applied').default(false),
  paymentStatus: text('payment_status').default('pending'), // pending | approved | paid | disputed
  disputeNotes: text('dispute_notes'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pipelineSnapshots = pgTable('pipeline_snapshots', {
  // CFO Monthly Snapshot Table for Waterfalls & Overages
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  snapshotYear: integer('snapshot_year').notNull(),
  snapshotMonth: integer('snapshot_month').notNull(),
  recurringStarting: numeric('recurring_starting', { precision: 12, scale: 2 }),
  newWonAmount: numeric('new_won_amount', { precision: 12, scale: 2 }),
  expansionAmount: numeric('expansion_amount', { precision: 12, scale: 2 }),
  churnAmount: numeric('churn_amount', { precision: 12, scale: 2 }),
  endingForecast: numeric('ending_forecast', { precision: 12, scale: 2 }),
  savedAt: timestamp('saved_at').defaultNow(),
});
