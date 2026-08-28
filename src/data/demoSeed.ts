/**
 * DEMO SEED — Tax Pro Hub University
 * ----------------------------------
 * The platform runs on LIVE data from the Cloudflare D1 backend.
 * This file contains exactly TWO sample records per core object, used only when
 * the app is running in offline/demo mode (no backend session). Every other
 * collection ships EMPTY so the UI renders real empty-state placeholders
 * instead of fabricated numbers.
 *
 * Anything seeded here is clearly labelled "SAMPLE" in the UI and is replaced
 * the moment a real tenant signs in (see src/utils/backendBridge.ts).
 */
import type { SubAccount, Contact, Deal, Appointment, Preparer } from '../types';

export const DEMO_TENANT_ID = 'demo-tenant';

/** Single demo workspace — real tenants come from D1. */
export const demoSubAccounts: SubAccount[] = [
  {
    id: DEMO_TENANT_ID,
    name: 'Demo Practice (Sample Data)',
    businessName: 'Demo Practice LLC',
    businessAddress: '1342 NM 333, Tijeras, NM 87059',
    email: 'support@rjbusinesssolutions.org',
    phone: '(414) 430-4277',
    colors: {
      primary: '#D4AF37',
      secondary: '#111111',
      accent: '#FFD700',
      background: '#030712',
      text: '#F1F5F9',
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/** Exactly 2 sample contacts. */
export const demoContacts: Contact[] = [
  {
    id: 'sample-contact-1',
    firstName: 'Sample',
    lastName: 'Client One',
    email: 'sample.one@example.com',
    phone: '(555) 010-0001',
    company: 'Sample Client One LLC',
    tags: ['SAMPLE', 'Tax Prep'],
    customFields: { city: 'Tijeras', state: 'NM', zip: '87059', country: 'US' },
    source: 'Sample Data',
    status: 'lead',
    pipelineId: 'default-pipeline',
    stageId: 'stage-1',
    value: 0,
    notes: [],
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subAccountId: DEMO_TENANT_ID,
  },
  {
    id: 'sample-contact-2',
    firstName: 'Sample',
    lastName: 'Client Two',
    email: 'sample.two@example.com',
    phone: '(555) 010-0002',
    company: 'Sample Client Two Inc',
    tags: ['SAMPLE', 'IRS Resolution'],
    customFields: { city: 'Albuquerque', state: 'NM', zip: '87102', country: 'US' },
    source: 'Sample Data',
    status: 'prospect',
    pipelineId: 'default-pipeline',
    stageId: 'stage-3',
    value: 0,
    notes: [],
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subAccountId: DEMO_TENANT_ID,
  },
];

/** Exactly 2 sample deals — one per sample contact. */
export const demoDeals: Deal[] = [
  {
    id: 'sample-deal-1',
    name: 'SAMPLE — Individual 1040 Preparation',
    contactId: 'sample-contact-1',
    contactName: 'Sample Client One',
    value: 0,
    probability: 10,
    stageId: 'stage-1',
    tags: ['SAMPLE'],
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'Sample Data',
    daysInStage: 0,
    slaDays: 0,
    aiScore: 0,
    aiRationale: [],
    aiNextAction: '',
    subAccountId: DEMO_TENANT_ID,
  },
  {
    id: 'sample-deal-2',
    name: 'SAMPLE — IRS Notice Resolution',
    contactId: 'sample-contact-2',
    contactName: 'Sample Client Two',
    value: 0,
    probability: 30,
    stageId: 'stage-3',
    tags: ['SAMPLE'],
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'Sample Data',
    daysInStage: 0,
    slaDays: 0,
    aiScore: 0,
    aiRationale: [],
    aiNextAction: '',
    subAccountId: DEMO_TENANT_ID,
  },
];

/** Exactly 2 sample appointments — one per sample contact. */
export const demoAppointments: Appointment[] = [
  {
    id: 'sample-appt-1',
    title: 'SAMPLE — Discovery Call',
    description: 'Placeholder appointment. Real appointments sync from the live backend.',
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 86400000 + 1800000),
    type: 'call',
    status: 'scheduled',
    contactId: 'sample-contact-1',
    reminders: [],
    createdAt: new Date(),
    subAccountId: DEMO_TENANT_ID,
  },
  {
    id: 'sample-appt-2',
    title: 'SAMPLE — Document Review',
    description: 'Placeholder appointment. Real appointments sync from the live backend.',
    startTime: new Date(Date.now() + 172800000),
    endTime: new Date(Date.now() + 172800000 + 3600000),
    type: 'meeting',
    status: 'scheduled',
    contactId: 'sample-contact-2',
    reminders: [],
    createdAt: new Date(),
    subAccountId: DEMO_TENANT_ID,
  },
];

/** Exactly 2 sample preparers. */
export const demoPreparers: Preparer[] = [
  {
    id: 'sample-preparer-1',
    firstName: 'Sample',
    lastName: 'Preparer One',
    email: 'preparer.one@example.com',
    phone: '(555) 010-1001',
    ptin: '',
    role: 'senior_preparer',
    status: 'active',
    credentials: [],
    payStructure: 'percentage',
    payoutRate: 0,
    assignedClientIds: [],
    assignedDealIds: [],
    ceCredits: 0,
    circular230Status: 'pending',
    performance: {
      completedReturns: 0,
      activeFiles: 0,
      averageRefundValue: 0,
      satisfactionScore: 0,
      slaComplianceRate: 0,
      revenueGenerated: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    payoutLedger: [],
    subAccountId: DEMO_TENANT_ID,
  },
  {
    id: 'sample-preparer-2',
    firstName: 'Sample',
    lastName: 'Preparer Two',
    email: 'preparer.two@example.com',
    phone: '(555) 010-1002',
    ptin: '',
    role: 'junior_preparer',
    status: 'active',
    credentials: [],
    payStructure: 'flat',
    payoutRate: 0,
    assignedClientIds: [],
    assignedDealIds: [],
    ceCredits: 0,
    circular230Status: 'pending',
    performance: {
      completedReturns: 0,
      activeFiles: 0,
      averageRefundValue: 0,
      satisfactionScore: 0,
      slaComplianceRate: 0,
      revenueGenerated: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    payoutLedger: [],
    subAccountId: DEMO_TENANT_ID,
  },
];
