/**
 * 📇 CONTACT FILE v2.0 — DATABASE SCHEMA (DRIZZLE ORM)
 * 🧠 FOR: Tax Pro Hub University (RJ Business Solutions)
 * 🔒 SECURITY: Tenant Isolation (tenantId RLS) & AES-256 Gated PII Encryption
 */

import { 
  pgTable, 
  uuid, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  date, 
  jsonb, 
  index, 
  numeric 
} from 'drizzle-orm/pg-core';

// 1. PRIMARY CONTACTS & HOUSEHOLDS TABLE
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  householdId: uuid('household_id'),                     // Grouping field to link spouses/dependents
  
  // Identity Details
  legalFirstName: text('legal_first_name').notNull(),
  legalMiddleName: text('legal_middle_name'),
  legalLastName: text('legal_last_name').notNull(),
  suffix: text('suffix'),
  preferredName: text('preferred_name'),
  dateOfBirth: date('date_of_birth'),
  ssnEncrypted: text('ssn_encrypted'),                   // AES-256 crypt, key stored in Cloudflare Secrets
  ssnLast4: text('ssn_last_4'),                           // Stored unencrypted for quick index/masked lookups
  itin: text('itin'),                                     // Masked ITIN field
  driversLicense: jsonb('drivers_license'),               // { number: string, state: string, expiration: string }
  citizenship: text('citizenship'),
  dateOfDeath: date('date_of_death'),                     // For Estate returns
  
  // Contact Channels
  emailPrimary: text('email_primary'),
  emailSecondary: text('email_secondary'),
  phoneMobile: text('phone_mobile'),
  phoneHome: text('phone_home'),
  phoneWork: text('phone_work'),
  preferredChannel: text('preferred_channel'),            // 'SMS' | 'Email' | 'Call' | 'Mail'
  timezone: text('timezone'),
  language: text('language').default('en'),               // 'en' | 'es'
  
  // Addresses
  addressHome: jsonb('address_home'),                     // { street, city, state, zip, country }
  addressMailing: jsonb('address_mailing'),               // Populated if different
  dateMovedIn: date('date_moved_in'),
  priorState: text('prior_state'),                        // Triggers part-year filing
  
  // Demographics
  maritalStatus: text('marital_status'),                  // 'Single' | 'MFJ' | 'MFS' | 'HOH' | 'QW'
  marriageDate: date('marriage_date'),
  divorceDate: date('divorce_date'),
  spouseContactId: uuid('spouse_contact_id'),
  numDependents: integer('num_dependents').default(0),
  flags: jsonb('flags'),                                 // { blind: bool, disabled: bool, veteran: bool, firstResponder: bool }
  
  // Employment
  occupation: text('occupation'),
  employer: text('employer'),
  industry: text('industry'),
  selfEmployed: boolean('self_employed').default(false),
  multipleW2s: boolean('multiple_w2s').default(false),
  scheduleCBusinessNames: jsonb('schedule_c_business_names'), // array of strings
  
  // Emergency Contact
  emergencyContact: jsonb('emergency_contact'),           // { name, relation, phone }

  // Attribution & Marketing
  lifecycleStage: text('lifecycle_stage'),                // 'lead' | 'prospect' | 'customer' | 'churned'
  customerTier: text('customer_tier'),                    // 'tier_1' | 'tier_2' | 'tier_3'
  leadSource: text('lead_source'),
  utm: jsonb('utm'),                                      // { source, medium, campaign, content }
  referrerContactId: uuid('referrer_contact_id'),
  firstTouchDate: timestamp('first_touch_date'),
  conversionDate: timestamp('conversion_date'),
  referralFeeOwed: numeric('referral_fee_owed', { precision: 10, scale: 2 }).default('0.00'),

  // Compliance Consents held
  consents: jsonb('consents'),                            // { tcpaConsent: string (ISO timestamp), emailConsent: string, fcraConsent: string, eFileConsent: string }
  
  // Meta Details
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by'),
}, (t) => ({
  tenantIdx: index('contacts_tenant_idx').on(t.tenantId),
  householdIdx: index('contacts_household_idx').on(t.householdId),
  emailIdx: index('contacts_email_idx').on(t.tenantId, t.emailPrimary),
  ssnLast4Idx: index('contacts_ssn_last_4_idx').on(t.tenantId, t.ssnLast4),
}));

// 2. TAX PROFILE
export const taxProfiles = pgTable('tax_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  taxYear: integer('tax_year').notNull(),
  filingStatus: text('filing_status'),
  lastYearFilingStatus: text('last_year_filing_status'),
  wasAmended: boolean('was_amended').default(false),
  lastYearAGI: numeric('last_year_agi', { precision: 12, scale: 2 }),
  lastYearRefundOrBalance: numeric('last_year_refund_or_balance', { precision: 12, scale: 2 }),
  lastYearPreparer: text('last_year_preparer'),
  dateLastFiled: date('date_last_filed'),
  statesFiled: jsonb('states_filed'),                     // Array of states e.g. ['TX', 'NM']
  
  // IRS Codes
  ipPin: text('ip_pin'),                                  // Encrypted 6-digit IP PIN
  cafNumber: text('caf_number'),                          // Centralized Authorization File
  irsAccountLinked: boolean('irs_account_linked').default(false),
  priorYearTranscriptPulled: boolean('prior_year_transcript_pulled').default(false),
  transcriptPullDate: timestamp('transcript_pull_date'),

  // Preparer Permissions
  preparerId: uuid('preparer_id'),
  reviewerId: uuid('reviewer_id'),
  form8821OnFile: boolean('form_8821_on_file').default(false),
  form8821Expiration: date('form_8821_expiration'),
  form2848OnFile: boolean('form_2848_on_file').default(false),
  form2848Expiration: date('form_2848_expiration'),
  form8879Signed: boolean('form_8879_signed').default(false),
  form8879SignedDate: timestamp('form_8879_signed_date'),
  eFileConsentSigned: boolean('e_file_consent_signed').default(false),

  // Tax Conditions Flags
  situationFlags: jsonb('situation_flags'),               // { rental: bool, crypto: bool, foreignAccounts: bool, energyCredits: bool, etc. }
  estimatedQuarterly: jsonb('estimated_quarterly'),       // [ { quarter: 1, amount: 2500, paidDate: '2026-04-15', confirmation: 'CF123' }, ... ]
  complianceStatus: jsonb('compliance_status'),           // { underAudit: bool, outstandingNotices: bool, paymentPlanActive: bool }
});

// 3. DEPENDENTS
export const dependents = pgTable('dependents', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  fullName: text('full_name').notNull(),
  ssnOrItin: text('ssn_or_itin'),                        // Encrypted
  ssnLast4: text('ssn_last_4'),
  dateOfBirth: date('date_of_birth').notNull(),
  relationship: text('relationship').notNull(),           // 'Son' | 'Daughter' | 'Parent' | 'Qualifying Relative'
  monthsLivedWithTaxpayer: integer('months_lived_with_taxpayer').default(12),
  disabled: boolean('disabled').default(false),
  student: boolean('student').default(false),
  schoolName: text('school_name'),
  earnedIncome: numeric('earned_income', { precision: 12, scale: 2 }).default('0.00'),
  qualifyingChild: boolean('qualifying_child').default(true),
  qualifyingRelative: boolean('qualifying_relative').default(false),
  claimedByOtherParent: boolean('claimed_by_other_parent').default(false),
  custodyAgreementUrl: text('custody_agreement_url'),
  childcareExpenses: numeric('childcare_expenses', { precision: 10, scale: 2 }).default('0.00'),
  childcareProviderDetails: jsonb('childcare_provider_details'), // { name, ein, phone }
});

// 4. INCOME SOURCES
export const incomeSources = pgTable('income_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  taxYear: integer('tax_year').notNull(),
  type: text('type').notNull(),                           // 'W-2' | '1099-NEC' | '1099-MISC' | '1099-K' | '1099-INT' | 'K-1' | 'Schedule-C' | 'Crypto' | 'Foreign'
  issuerName: text('issuer_name').notNull(),
  issuerEIN: text('issuer_ein'),
  grossAmount: numeric('gross_amount', { precision: 15, scale: 2 }).notNull(),
  federalWithholding: numeric('federal_withholding', { precision: 15, scale: 2 }).default('0.00'),
  stateWithholding: numeric('state_withholding', { precision: 15, scale: 2 }).default('0.00'),
  extractedValues: jsonb('extracted_values'),             // Full OCR JSON payload
  documentId: uuid('document_id'),                        // Reference link inside Documents Vault
});

// 5. DOCUMENTS (R2 STORAGE METADATA)
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  taxYear: integer('tax_year').notNull(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(),                  // 'W-2' | '1099-NEC' | 'Receipt' | 'ID_Card' | 'Tax_Return_Draft'
  s3Key: text('s3_key').notNull(),                        // Cloudflare R2 path key
  uploadedBy: text('uploaded_by').notNull(),              // 'Client' | 'Preparer_Loyce'
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  fileSize: integer('file_size'),
  ocrStatus: text('ocr_status').default('pending'),       // 'pending' | 'processed' | 'failed'
  ocrExtractedValues: jsonb('ocr_extracted_values'),
  isVerified: boolean('is_verified').default(false),
  isRequiredForFiling: boolean('is_required_for_filing').default(true),
  isLocked: boolean('is_locked').default(false),          // Prevent edit/delete post-filing compliance
  retentionExpiration: date('retention_expiration'),      // 7-year date check
});

// 6. RETURNS RECORD HISTORY
export const returns = pgTable('returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  taxYear: integer('tax_year').notNull(),
  filingStatus: text('filing_status').notNull(),
  federalAGI: numeric('federal_agi', { precision: 15, scale: 2 }).notNull(),
  federalTax: numeric('federal_tax', { precision: 15, scale: 2 }),
  federalRefundOrOwed: numeric('federal_refund_or_owed', { precision: 15, scale: 2 }),
  stateRefundOrOwed: jsonb('state_refund_or_owed'),       // [ { state: 'NM', amount: 520, type: 'refund' } ]
  dateFiled: date('date_filed'),
  efileSubmissionId: text('e_file_submission_id'),
  irsAcceptanceDate: timestamp('irs_acceptance_date'),
  irsRejectCodes: jsonb('irs_reject_codes'),              // Array of error objects
  refundDisbursementDate: date('refund_disbursement_date'),
  refundMethod: text('refund_method'),                    // 'Direct_Deposit' | 'Paper_Check' | 'RAL' | 'RAC'
  isAmended: boolean('is_amended').default(false),
  preparerName: text('preparer_name'),
  feeCharged: numeric('fee_charged', { precision: 10, scale: 2 }),
  pdfCopyUrl: text('pdf_copy_url'),
  taxSlayerReturnId: text('tax_slayer_return_id'),
});

// 7. BANK ACCOUNTS
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  bankName: text('bank_name').notNull(),
  routingNumberEncrypted: text('routing_number_encrypted'), // Encrypted AES-256
  routingNumberLast4: text('routing_number_last_4'),
  accountNumberEncrypted: text('account_number_encrypted'), // Encrypted AES-256
  accountNumberLast4: text('account_number_last_4'),
  accountType: text('account_type').notNull(),            // 'Checking' | 'Savings'
  accountHolderName: text('account_holder_name').notNull(),
  isJoint: boolean('is_joint').default(false),
  plaidVerified: boolean('plaid_verified').default(false),
  plaidVerifiedDate: timestamp('plaid_verified_date'),
  isDefaultRefundAccount: boolean('is_default_refund_account').default(true),
  refundProducts: jsonb('refund_products'),               // { advanceApplied: bool, provider: 'Republic', approved: bool, serviceFeeSigned: bool }
});

// 8. CREDIT REPORTS (FCRA ROLE-GATED)
export const creditReports = pgTable('credit_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  pulledByUserId: uuid('pulled_by_user_id').notNull(),
  pullDate: timestamp('pull_date').defaultNow(),
  fcraPermissiblePurposeSignedUrl: text('fcra_permissible_purpose_signed_url').notNull(),
  croaFiveDayExpiration: date('croa_five_day_expiration'),
  scores: jsonb('scores'),                               // { transunion: 680, equifax: 672, experian: 685 }
  tradelinesSummary: jsonb('tradelines_summary'),         // { total: 12, negative: 2, utilization: 28 }
  disputes: jsonb('disputes'),                           // [ { id, item: 'Capital One', bureau: 'Experian', reason: 'Not mine', status: 'Mailed', letterTrack: 'USPS999' } ]
  creditGoals: jsonb('credit_goals'),                     // { targetScore: 740, applicationDate: '2026-08-01', lender: 'Chase' }
});

// 9. COMMUNICATIONS
export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  channel: text('channel').notNull(),                     // 'Email' | 'SMS' | 'WhatsApp' | 'Call' | 'Letter' | 'Portal'
  direction: text('direction').notNull(),                 // 'Inbound' | 'Outbound'
  timestamp: timestamp('timestamp').defaultNow(),
  sender: text('sender').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  attachments: jsonb('attachments'),                     // Array of file metadata { url, name, size }
  deliveryStatus: text('delivery_status').default('sent'), // 'sent' | 'delivered' | 'read' | 'bounced'
  complianceTags: jsonb('compliance_tags'),               // { tcpaConsentRespected: bool, quietHoursRespected: bool }
});

// 10. NOTES (TIPTAP RICH TEXT)
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  authorId: uuid('author_id').notNull(),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),                     // HTML or JSON content from TipTap
  createdAt: timestamp('created_at').defaultNow(),
  isPinned: boolean('is_pinned').default(false),
  visibility: text('visibility').default('team'),         // 'private' | 'team' | 'preparer-only'
  tags: jsonb('tags'),                                    // Array of tags
});

// 11. TASKS
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  priority: text('priority').default('medium'),           // 'low' | 'medium' | 'high' | 'urgent'
  status: text('status').default('todo'),                 // 'todo' | 'in-progress' | 'blocked' | 'done'
  assigneeId: uuid('assignee_id'),
  createdByUserId: uuid('created_by_user_id'),
  createdAt: timestamp('created_at').defaultNow(),
  linkedDocumentId: uuid('linked_document_id'),
  autoGeneratedByWorkflow: boolean('auto_generated_by_workflow').default(false),
});

// 12. TIMELINE EVENTS (IMMUTABLE AUDIT TRAIL)
export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  eventType: text('event_type').notNull(),                // 'Contact_Created' | 'Email_Sent' | 'Document_Uploaded' | 'Profile_Updated' | 'SSN_Accessed' | 'Filing_Success'
  eventDescription: text('event_description').notNull(),
  metadata: jsonb('metadata'),                            // Event specific identifiers e.g. { ip: '192.168.1.1', user: 'Loyce' }
  createdAt: timestamp('created_at').defaultNow(),        // Append-only, database triggers prevent Update/Delete
});

// 13. INVOICES & RETAIINERS
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  issuedDate: date('issued_date').notNull(),
  dueDate: date('due_date'),
  lineItems: jsonb('line_items'),                         // [ { desc: 'Form 1040 Preparation', qty: 1, rate: 350 } ]
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('sent'),                 // 'draft' | 'sent' | 'paid' | 'overdue'
  stripeInvoiceId: text('stripe_invoice_id'),
  stripePaymentLink: text('stripe_payment_link'),
  paymentDate: timestamp('payment_date'),
  paymentMethod: text('payment_method'),                  // 'Card' | 'ACH' | 'Check' | 'Refund_Deduction'
});

// 14. ACCESS COMPLIANCE LOGS (IMMUTABLE SEC_AUDIT)
export const accessLog = pgTable('access_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  userName: text('user_name').notNull(),
  accessedField: text('accessed_field').notNull(),        // 'SSN_REVEAL' | 'ITIN_REVEAL' | 'BANK_INFO' | 'CREDIT_PULL'
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  purpose: text('purpose').notNull(),                     // 'Tax preparation audit'
  timestamp: timestamp('timestamp').defaultNow(),         // Database trigger prevents updates
});
