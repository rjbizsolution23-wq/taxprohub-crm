// Core CRM Types for Tax Pro Hub University Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  subAccountId?: string;
  avatar?: string;
  createdAt: Date;
}

export interface SubAccount {
  id: string;
  name: string;
  businessName: string;
  businessAddress: string;
  email: string;
  phone: string;
  logo?: string;
  colors: BrandColors;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  tags: string[];
  customFields: Record<string, string>;
  source: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  assignedTo?: string;
  pipelineId?: string;
  stageId?: string;
  value?: number;
  notes: Note[];
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
  subAccountId?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  color: string;
  isDefault: boolean;
  createdAt: Date;
  subAccountId?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color?: string;
  subAccountId?: string;
}

export interface Deal {
  id: string;
  title?: string; // Support either title or name
  name: string;
  contactId?: string;
  contactName: string;
  spouseName?: string;
  pipelineId?: string;
  stageId: string;
  value: number;
  probability: number;
  expectedCloseDate?: Date | string;
  assignedTo?: string;
  ownerId?: string;
  ownerName?: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt?: Date | string;
  source?: string;
  subAccountId?: string;

  // Tax Prep Specifics
  dependentsCount?: number;
  filingComplexity?: 'Simple' | 'Moderate' | 'Complex' | 'Multi-State' | 'Business';
  feeStructure?: 'Flat' | 'Hourly' | 'Per-Form' | 'percent_refund';
  estimatedRefund?: number;
  estimatedBalanceDue?: number;
  returnsCount?: number;
  daysInStage: number;
  slaDays: number;
  reviewerName?: string;
  deadlineCountdownDays?: number;
  documentCompleteness?: string;

  // Bookkeeping Specifics
  mrrAmount?: number;
  softwareStack?: string;
  transactionsPerMonth?: number;
  cleanupProject?: boolean;
  onboardingStatus?: string;
  healthScore?: 'green' | 'yellow' | 'red';

  // IRS Rep Specifics
  irsNoticeType?: string;
  taxYearsInvolved?: string;
  amountInDispute?: number;
  resolutionType?: string;
  poaExpired?: boolean;
  solDate?: string;
  estimatedSavings?: number;

  // Credit Repair Specifics
  croaDisclosureSent?: boolean;
  cancellationWindowStatus?: 'Active' | 'Expired' | 'Waived';
  scoreStart?: number;
  scoreCurrent?: number;
  negativeItemsDisputed?: number;
  fundingGoal?: string;

  // Service Bureau Specifics
  customDomain?: string;
  revenueSharePercent?: number;
  projectedVolume?: number;
  setupProgress?: number;
  firstRevenueDate?: string;
  monthlyRevShareOwed?: number;

  // AI Insights
  aiScore: number;
  aiRationale: string[];
  aiNextAction: string;
  aiStageSuggestion?: string;
  aiRenewalRisk?: 'High' | 'Medium' | 'Low';

  // Money Split & Commission
  commissionPlan?: string;
  commissionSplits?: { name: string; pct: number }[];
  managerOverridePercent?: number;
  clawbackWindowDays?: number;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'meeting' | 'call' | 'webinar' | 'consultation';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  contactId?: string;
  assignedTo?: string;
  meetingLink?: string;
  reminders: Reminder[];
  createdAt: Date;
  subAccountId?: string;
}

export interface Reminder {
  id: string;
  type: 'email' | 'sms';
  minutesBefore: number;
  sent?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  subject?: string;
  content: string;
  recipientCount: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  /** Full ordered drip sequence — when present this is a multi-step automated campaign */
  sequence?: DripStep[];
  /** What audience segment this campaign targets */
  audience?: string;
  /** Goal of the drip (book call, file return, collect docs, reactivate...) */
  goal?: string;
  /** Library id it was installed from, if any */
  sourceTemplateId?: string;
  subAccountId?: string;
}

/** One ordered step in a drip sequence. Steps fire in `day`/`order` sequence. */
export interface DripStep {
  id: string;
  order: number;
  /** Days after enrollment this step fires (0 = immediately) */
  day: number;
  /** Optional send time, e.g. '09:00' */
  sendAt?: string;
  channel: 'email' | 'sms';
  /** Email subject (email channel only) */
  subject?: string;
  /** Email preheader (email channel only) */
  preheader?: string;
  /** Full message body. Emails are complete multi-paragraph copy; SMS ≤ 320 chars. */
  body: string;
  /** CTA label + href for emails */
  cta?: { label: string; href: string };
  /** Exit condition — if the contact does this, stop the drip */
  exitOn?: 'reply' | 'booked' | 'purchased' | 'docs_uploaded' | 'filed' | 'none';
  /** Internal note explaining strategy of this touch */
  strategyNote?: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'contact_created' | 'form_submitted' | 'appointment_scheduled' | 'deal_stage_changed' | 'custom';
  conditions?: Record<string, unknown>;
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'create_task' | 'update_contact' | 'add_tag' | 'webhook' | 'delay';
  config: Record<string, unknown>;
  delayMinutes?: number;
}

export interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  domain?: string;
  published: boolean;
  stats: FunnelStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStep {
  id: string;
  name: string;
  slug?: string;
  type: 'landing' | 'checkout' | 'thankyou' | 'custom';
  path: string;
  content: string;
  position: number;
}

export interface FunnelStats {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface Website {
  id: string;
  name: string;
  domain?: string;
  pages: WebPage[];
  theme: WebsiteTheme;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  subAccountId?: string;
}

export interface WebPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isHome: boolean;
  published: boolean;
}

export interface WebsiteTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerStyle: string;
  footerStyle: string;
}

export interface Form {
  id: string;
  name: string;
  fields: FormField[];
  settings: FormSettings;
  submissions: FormSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
  position: number;
}

export interface ConditionalLogic {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
  action: 'show' | 'hide' | 'require';
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  notifyEmail?: string;
  storeSubmissions: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, string>;
  contactId?: string;
  submittedAt: Date;
  ip?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  authorId: string;
  status: 'draft' | 'published' | 'scheduled';
  tags: string[];
  publishedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
  accountName: string;
  accountId: string;
  connected: boolean;
  lastSynced?: Date;
  permissions: string[];
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'sms' | 'meeting' | 'task' | 'note';
  description: string;
  completed: boolean;
  dueDate?: Date;
  completedAt?: Date;
  contactId: string;
  assignedTo?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  timestamp: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'list' | 'calendar' | 'tasks';
  title: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  config: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Preparer {
  id: string;
  subAccountId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'senior_preparer' | 'junior_preparer' | 'tax_attorney' | 'bookkeeper' | 'manager';
  status: 'active' | 'on_leave' | 'inactive';
  ptin: string;
  efin?: string;
  credentials: string[];
  payStructure: 'percentage' | 'flat';
  payoutRate: number;
  assignedClientIds: string[];
  assignedDealIds: string[];
  payoutLedger: Payout[];
  ceCredits: number;
  circular230Status: 'verified' | 'pending' | 'suspended';
  performance: PreparerPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  subAccountId?: string;
  preparerId: string;
  preparerName?: string;
  dealId?: string;
  dealTitle?: string;
  amount: number;
  baseAmount: number;
  commissionAmount: number;
  method: 'direct_deposit' | 'stripe' | 'check' | 'wire';
  status: 'completed' | 'processing' | 'pending' | 'failed';
  referenceNumber: string;
  paymentDate: Date;
  description: string;
  notes?: string;
}

export interface PreparerPerformance {
  completedReturns: number;
  activeFiles: number;
  averageRefundValue: number;
  satisfactionScore: number;
  slaComplianceRate: number;
  revenueGenerated: number;
}

