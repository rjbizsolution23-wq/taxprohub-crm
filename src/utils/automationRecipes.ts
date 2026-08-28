/**
 * AUTOMATION RECIPES — pre-engineered workflow blueprints that wire
 * the whole platform together: triggers → drip enrollment → CRM moves
 * → tasks → notifications. Each recipe installs as a real Workflow
 * and references the drip campaigns it enrolls contacts into.
 */
import { Workflow, WorkflowAction, WorkflowTrigger } from '../types';

export interface AutomationRecipe {
  id: string;
  name: string;
  category: 'lead' | 'client' | 'season' | 'retention' | 'operations' | 'compliance';
  description: string;
  /** Which drip template(s) this recipe enrolls contacts into */
  enrollsDrip?: string[];
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  /** Human-readable wiring map shown in the UI */
  wiring: string[];
}

let aSeq = 0;
const aid = () => `wa-${++aSeq}`;
const act = (type: WorkflowAction['type'], config: Record<string, unknown>, delayMinutes?: number): WorkflowAction => ({
  id: aid(), type, config, ...(delayMinutes !== undefined ? { delayMinutes } : {}),
});

export const AUTOMATION_RECIPES: AutomationRecipe[] = [
  {
    id: 'auto-speed-to-lead',
    name: 'Speed-to-Lead Machine',
    category: 'lead',
    description: 'The moment any lead is created (form, ad, referral, import) — instant SMS, instant email, tagged, dropped into the pipeline, and a call task created for the assigned preparer. Enrolls into the New Lead drip automatically.',
    enrollsDrip: ['drip-new-lead'],
    trigger: { type: 'contact_created' },
    actions: [
      act('send_sms', { template: 'drip-new-lead:step-1', note: 'Speed-to-lead SMS inside 60 seconds' }),
      act('send_email', { template: 'drip-new-lead:step-2', note: 'Confirmation + booking link' }, 15),
      act('add_tag', { tags: ['new-lead', 'drip:new-lead-active'] }),
      act('update_contact', { field: 'pipelineStage', value: 'stage-1' }),
      act('create_task', { title: 'Call new lead within 1 hour', assignTo: 'round-robin:preparers', priority: 'high' }),
      act('webhook', { url: '/api/notify', event: 'lead.created', channel: 'team-slack' }),
    ],
    wiring: [
      'Trigger: Contact created (any source: forms, Funnel Genie pages, Document Intelligence, ad webhooks, CSV import)',
      'Enrolls → “New Lead → Booked Call” drip (8 touches / 10 days, exits on booking)',
      'Moves contact → Sales Pipeline: New Lead stage',
      'Creates call task → round-robin across active preparers',
      'Exit: booking an appointment fires the Appointment recipe and halts this drip',
    ],
  },
  {
    id: 'auto-onboard-signed',
    name: 'Client Signed → Full Onboarding',
    category: 'client',
    description: 'When a deal moves to Client Signed: engagement letter goes out, portal is provisioned, the Onboarding & Doc Collection drip starts, and the preparer gets a prep task. Exits the moment docs are complete.',
    enrollsDrip: ['drip-onboarding'],
    trigger: { type: 'deal_stage_changed', conditions: { toStage: 'Client Signed' } },
    actions: [
      act('send_email', { template: 'drip-onboarding:step-1', note: 'Welcome + engagement letter + portal' }),
      act('send_sms', { template: 'drip-onboarding:step-2' }, 120),
      act('add_tag', { tags: ['client-active', 'docs-pending'] }),
      act('create_task', { title: 'Verify engagement letter signed within 48h', assignTo: 'deal-owner' }),
      act('webhook', { url: '/api/portal/provision', event: 'client.signed' }),
    ],
    wiring: [
      'Trigger: Deal stage → “Client Signed”',
      'Provisions secure portal via worker endpoint /api/portal/provision',
      'Enrolls → “New Client Onboarding & Doc Collection” drip (7 touches / 14 days)',
      'Exit: Document Intelligence marks checklist complete → tag docs-pending removed → drip stops',
      'Hand-off: docs complete fires “Docs In → Preparation Queue” recipe',
    ],
  },
  {
    id: 'auto-docs-complete',
    name: 'Docs In → Preparation Queue',
    category: 'operations',
    description: 'When Document Intelligence confirms the checklist is complete: deal advances, preparer is assigned work, the client gets a "we\'ve started" confirmation, and an SLA timer begins.',
    trigger: { type: 'custom', conditions: { event: 'documents_complete' } },
    actions: [
      act('update_contact', { field: 'pipelineStage', value: 'stage-4' }),
      act('add_tag', { tags: ['in-preparation'], removeTags: ['docs-pending'] }),
      act('send_email', { subject: 'We\'ve started on your return', note: 'Preparation-started confirmation with SLA promise' }),
      act('create_task', { title: 'Prepare return — SLA 5 business days', assignTo: 'assigned-preparer', priority: 'high', sla: '5bd' }),
      act('webhook', { url: '/api/notify', event: 'file.ready_for_prep' }),
    ],
    wiring: [
      'Trigger: Document Intelligence checklist 100% (custom event documents_complete)',
      'Stops → Onboarding drip (exit condition docs_uploaded)',
      'Advances deal → Proposal/Preparation stage',
      'Starts 5-business-day preparation SLA tracked on the preparer scorecard',
    ],
  },
  {
    id: 'auto-return-filed',
    name: 'Return Filed → Refund Concierge',
    category: 'client',
    description: 'E-file confirmation triggers the full post-filing experience: milestone emails/SMS, IRS acceptance monitoring, review harvesting at deposit week, and preparer payout ledger entry.',
    enrollsDrip: ['drip-refund'],
    trigger: { type: 'deal_stage_changed', conditions: { toStage: 'Return Filed' } },
    actions: [
      act('send_email', { template: 'drip-refund:step-1', note: 'Filed confirmation + timeline' }),
      act('add_tag', { tags: ['filed-this-season', 'refund-tracking'] }),
      act('webhook', { url: '/api/payouts/accrue', event: 'return.filed', note: 'Creates pending payout ledger entry for preparer' }),
      act('create_task', { title: 'Confirm IRS acceptance within 48h', assignTo: 'assigned-preparer' }),
    ],
    wiring: [
      'Trigger: Deal stage → “Return Filed”',
      'Enrolls → “Post-Filing Refund Concierge” drip (6 touches / 35 days)',
      'Accrues preparer payout in the ledger (percentage/flat per pay structure) — visible in Preparers & Payouts',
      'Review ask fires automatically on day 24 (deposit week)',
      'Hand-off: refund received fires Referral Engine recipe',
    ],
  },
  {
    id: 'auto-referral-engine',
    name: 'Refund Landed → Referral Engine',
    category: 'retention',
    description: 'The week the refund lands (peak happiness), start the referral drip, generate the client\'s referral link, and track reward accruals both directions.',
    enrollsDrip: ['drip-referral'],
    trigger: { type: 'deal_stage_changed', conditions: { toStage: 'Refund Received' } },
    actions: [
      act('webhook', { url: '/api/referrals/link', event: 'referral.link.generate' }),
      act('send_email', { template: 'drip-referral:step-1' }),
      act('add_tag', { tags: ['referral-eligible'] }),
    ],
    wiring: [
      'Trigger: Deal stage → “Refund Received”',
      'Generates personal referral link via worker endpoint',
      'Enrolls → “Referral Engine” drip (5 touches / 30 days)',
      'Referred signups create contacts tagged referred-by:{clientId} → both-sides rewards tracked in Payouts',
    ],
  },
  {
    id: 'auto-appointment-guard',
    name: 'Appointment Guard (Reminders + No-Show Rescue)',
    category: 'operations',
    description: 'Every booked appointment gets confirmation, 48h and 2h reminders, and — if missed — an automatic two-step rescue that rebooks without human effort.',
    enrollsDrip: ['drip-appointment'],
    trigger: { type: 'appointment_scheduled' },
    actions: [
      act('send_email', { template: 'drip-appointment:step-1', note: 'Instant confirmation + prep list' }),
      act('send_sms', { template: 'drip-appointment:step-2' }, 5),
      act('send_sms', { template: 'drip-appointment:step-3', schedule: 'T-48h' }),
      act('send_sms', { template: 'drip-appointment:step-4', schedule: 'T-2h' }),
      act('send_sms', { template: 'drip-appointment:step-5', schedule: 'missed+15m', condition: 'no_show' }),
      act('send_email', { template: 'drip-appointment:step-6', schedule: 'missed+4h', condition: 'no_show' }),
    ],
    wiring: [
      'Trigger: Appointment scheduled (Calendar or booking page)',
      'Reminder ladder: instant → 48h → 2h (SMS + email)',
      'No-show branch: 15-min SMS rescue + 4-hour email rescue with 1-click rebooking',
      'Show: marks attendance, advances deal if first consult',
    ],
  },
  {
    id: 'auto-season-kickoff',
    name: 'Season Kickoff Blast (Jan 15)',
    category: 'season',
    description: 'On season open, every unfiled active client enters the Tax Season Filing Push; every dormant past client enters Win-Back. One switch starts the whole season.',
    enrollsDrip: ['drip-tax-season', 'drip-reactivation'],
    trigger: { type: 'custom', conditions: { event: 'season_open', date: 'Jan 15' } },
    actions: [
      act('send_email', { template: 'drip-tax-season:step-1', segment: 'active-clients-unfiled' }),
      act('send_email', { template: 'drip-reactivation:step-1', segment: 'past-clients-dormant' }),
      act('add_tag', { tags: ['season-2027-active'] }),
      act('create_task', { title: 'Season capacity plan: review preparer load board', assignTo: 'admin' }),
    ],
    wiring: [
      'Trigger: season_open event (Jan 15, manual or scheduled)',
      'Segments contacts: active-unfiled → Filing Push drip · dormant past clients → Win-Back drip',
      'Exits per-contact the moment they file (deal stage Return Filed)',
      'Feeds Analytics → Sub-Account Performance with season cohort tracking',
    ],
  },
  {
    id: 'auto-extension-guardian',
    name: 'Extension Filed → Compliance Guardian',
    category: 'compliance',
    description: 'Extended clients enter a 180-day guardian: quarterly estimated-payment alerts, summer filing invitations, and an escalating October run-up. Nobody blows October 15.',
    enrollsDrip: ['drip-compliance'],
    trigger: { type: 'deal_stage_changed', conditions: { toStage: 'Extension Filed' } },
    actions: [
      act('send_email', { template: 'drip-compliance:step-1', note: 'Extension explainer + safe-harbor recap' }),
      act('add_tag', { tags: ['on-extension', 'oct-15-watch'] }),
      act('create_task', { title: 'Verify safe-harbor payment posted', assignTo: 'assigned-preparer' }),
      act('create_task', { title: 'September pre-deadline file review', assignTo: 'assigned-preparer', schedule: 'Sep 1' }),
    ],
    wiring: [
      'Trigger: Deal stage → “Extension Filed”',
      'Enrolls → “Extension & Compliance Guardian” drip (6 touches / 180 days)',
      'Q2 (Jun 15) & Q3 (Sep 15) estimated-payment SMS alerts built in',
      'Exit: filing the return (any time) stops the guardian instantly',
    ],
  },
  {
    id: 'auto-irs-notice',
    name: 'IRS Notice Intake → Resolution Track',
    category: 'compliance',
    description: 'Client uploads or reports an IRS letter: the notice decoder classifies it, the client gets a same-day "we\'ve got this" response, and a priority resolution task is created with the correct playbook attached.',
    trigger: { type: 'custom', conditions: { event: 'irs_notice_received' } },
    actions: [
      act('webhook', { url: '/api/notices/classify', event: 'notice.classify', note: 'Runs the IRS notice decoder' }),
      act('send_email', { subject: 'We received your IRS letter — here\'s what happens next', note: 'Same-day reassurance with decoded plain-English explanation' }),
      act('send_sms', { body: 'Got your IRS letter — decoded it & it\'s handled. Full explanation in your email. Nothing for you to do right now.' }),
      act('create_task', { title: 'IRS notice resolution — respond within deadline window', assignTo: 'assigned-preparer', priority: 'urgent' }),
      act('add_tag', { tags: ['irs-notice-open'] }),
    ],
    wiring: [
      'Trigger: notice uploaded to Document Intelligence or reported via Conversations',
      'Notice decoder (IRS Intelligence engine) classifies: CP2000, CP12, 5071C, CP05, CP14, LT11…',
      'Same-day dual-channel client reassurance (email + SMS)',
      'Priority task with the notice-specific playbook + statutory response deadline',
      'Resolution closes the tag and logs to the Audit Shield history',
    ],
  },
  {
    id: 'auto-payout-cycle',
    name: 'Bi-Weekly Preparer Payout Cycle',
    category: 'operations',
    description: 'Every other Friday: accrued preparer commissions are bundled into payout records, sent for one-click approval, and (with Stripe Connect wired) disbursed automatically with full ledger history.',
    trigger: { type: 'custom', conditions: { event: 'payout_cycle', schedule: 'biweekly Friday' } },
    actions: [
      act('webhook', { url: '/api/payouts/bundle', event: 'payouts.bundle', note: 'Aggregates accrued ledger entries per preparer' }),
      act('create_task', { title: 'Approve payout batch', assignTo: 'admin', priority: 'high' }),
      act('webhook', { url: '/api/payouts/disburse', event: 'payouts.disburse', note: 'Stripe Connect transfer on approval' }),
      act('send_email', { segment: 'preparers-with-payout', subject: 'Your payout statement is ready', note: 'Itemized statement per preparer' }),
    ],
    wiring: [
      'Trigger: bi-weekly schedule (Cloudflare Worker cron)',
      'Bundles per-return accruals (created by the Return Filed recipe) into payout records',
      'Admin one-click approval in Preparers & Payouts → Stripe Connect transfer',
      'Preparers get itemized statements; ledger + 1099-NEC totals maintained automatically',
    ],
  },
];

/** Install a recipe as a live Workflow */
export function installRecipe(recipe: AutomationRecipe, subAccountId?: string): Workflow & { subAccountId?: string } {
  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: recipe.name,
    trigger: recipe.trigger,
    actions: recipe.actions.map(a => ({ ...a, id: `${a.id}-${Math.random().toString(36).slice(2, 6)}` })),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    subAccountId,
  };
}
