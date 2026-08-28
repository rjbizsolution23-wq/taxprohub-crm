import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SubAccount, Contact, Pipeline, Deal, Appointment, Campaign, Workflow, Funnel, Website, Form, BlogPost, SocialAccount, Notification, BrandColors, DashboardWidget, Preparer, Payout } from '../types';
import { sendCapiEvent } from '../utils/meta';
import { clearToken, diffFingerprints, enqueueSync, fingerprintState, type BootstrapPayload, type Fingerprint } from '../utils/api';

interface AppState {
  // Authentication
  currentUser: User | null;
  currentSubAccount: SubAccount | null;
  isAuthenticated: boolean;
  
  // Sub Accounts
  subAccounts: SubAccount[];
  
  // CRM Data (Active/Filtered for Current Sub-Account)
  contacts: Contact[];
  pipelines: Pipeline[];
  deals: Deal[];
  appointments: Appointment[];
  campaigns: Campaign[];
  workflows: Workflow[];
  funnels: Funnel[];
  websites: Website[];
  forms: Form[];
  blogPosts: BlogPost[];
  socialAccounts: SocialAccount[];
  
  // Dashboard & UI
  dashboardWidgets: DashboardWidget[];
  notifications: Notification[];
  brandColors: BrandColors;
  sidebarOpen: boolean;
  activeModule: string;

  // Backend connectivity — true when the Cloudflare D1 API is reachable
  backendMode: boolean;

  // Preparers & Payouts (Active/Filtered)
  preparers: Preparer[];
  payouts: Payout[];

  // Master Backing Lists (Unfiltered, used for persistence and cross-tenant Admin viewing)
  allContacts: Contact[];
  allDeals: Deal[];
  allAppointments: Appointment[];
  allCampaigns: Campaign[];
  allWorkflows: Workflow[];
  allFunnels: Funnel[];
  allWebsites: Website[];
  allForms: Form[];
  allBlogPosts: BlogPost[];
  allPreparers: Preparer[];
  allPayouts: Payout[];
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  setCurrentSubAccount: (account: SubAccount | null) => void;
  addSubAccount: (account: SubAccount) => void;
  updateSubAccount: (id: string, data: Partial<SubAccount>) => void;
  deleteSubAccount: (id: string) => void;

  // Preparer & Payout Actions
  addPreparer: (preparer: Preparer) => void;
  updatePreparer: (id: string, data: Partial<Preparer>) => void;
  deletePreparer: (id: string) => void;
  addPayout: (payout: Payout) => void;
  updatePayout: (id: string, data: Partial<Payout>) => void;
  deletePayout: (id: string) => void;
  
  // Contacts
  addContact: (contact: Contact) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  // Pipelines
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, data: Partial<Pipeline>) => void;
  deletePipeline: (id: string) => void;
  
  // Deals
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (dealId: string, stageId: string) => void;
  
  // Appointments
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  // Campaigns
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  
  // Workflows
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, data: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflow: (id: string) => void;
  
  // Funnels
  addFunnel: (funnel: Funnel) => void;
  updateFunnel: (id: string, data: Partial<Funnel>) => void;
  deleteFunnel: (id: string) => void;
  
  // Websites
  addWebsite: (website: Website) => void;
  updateWebsite: (id: string, data: Partial<Website>) => void;
  deleteWebsite: (id: string) => void;
  
  // Forms
  addForm: (form: Form) => void;
  updateForm: (id: string, data: Partial<Form>) => void;
  deleteForm: (id: string) => void;
  
  // Blog
  addBlogPost: (post: BlogPost) => void;
  updateBlogPost: (id: string, data: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  
  // Social
  addSocialAccount: (account: SocialAccount) => void;
  updateSocialAccount: (id: string, data: Partial<SocialAccount>) => void;
  removeSocialAccount: (id: string) => void;
  
  // Notifications
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // UI
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
  updateBrandColors: (colors: BrandColors) => void;
  updateDashboardWidgets: (widgets: DashboardWidget[]) => void;

  // Backend bridge
  setBackendMode: (mode: boolean) => void;
  hydrateBackend: (data: BootstrapPayload) => void;
}

const defaultBrandColors: BrandColors = {
  primary: '#D4AF37',
  secondary: '#111111',
  accent: '#FFD700',
  background: '#030712',
  text: '#F1F5F9',
};

// Seed 3 High-Fidelity Real-World Sub-Accounts
const seedSubAccounts: SubAccount[] = [
  {
    id: 'sub-1',
    name: 'Apex Tax & Wealth Partners',
    businessName: 'Apex Tax & Wealth Partners LLC',
    businessAddress: '100 Sand Hill Road, Suite 400, Menlo Park, CA 94025',
    email: 'info@apextaxwealth.com',
    phone: '(650) 555-0190',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=120&h=120',
    colors: {
      primary: '#0A66FF',
      secondary: '#111827',
      accent: '#38BDF8',
      background: '#030712',
      text: '#F3F4F6'
    },
    domain: 'portal.apextaxwealth.com',
    status: 'active',
    createdAt: new Date('2026-01-10T09:00:00Z'),
    updatedAt: new Date('2026-06-25T14:30:00Z'),
  },
  {
    id: 'sub-2',
    name: 'Southwest IRS Resolution Group',
    businessName: 'Southwest IRS Resolution Group Inc.',
    businessAddress: '400 Gold Ave SW, Suite 1100, Albuquerque, NM 87102',
    email: 'help@southwestirsresolution.com',
    phone: '(505) 555-0150',
    logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=120&h=120',
    colors: {
      primary: '#10B981',
      secondary: '#0F172A',
      accent: '#34D399',
      background: '#030712',
      text: '#F8FAFC'
    },
    domain: 'clients.southwestirsresolution.com',
    status: 'active',
    createdAt: new Date('2026-02-15T10:00:00Z'),
    updatedAt: new Date('2026-06-20T11:00:00Z'),
  },
  {
    id: 'sub-3',
    name: 'Vance & Kaufman Tax Services',
    businessName: 'Vance & Kaufman Tax Services LLP',
    businessAddress: '1342 NM 333, Tijeras, NM 87059',
    email: 'partners@vancekaufmantax.com',
    phone: '(505) 555-0120',
    logo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=120&h=120',
    colors: {
      primary: '#F59E0B',
      secondary: '#18181B',
      accent: '#FBBF24',
      background: '#09090B',
      text: '#FAFAFA'
    },
    domain: 'app.vancekaufmantax.com',
    status: 'active',
    createdAt: new Date('2026-03-01T08:30:00Z'),
    updatedAt: new Date('2026-06-28T16:00:00Z'),
  }
];

// Seed high-fidelity, real-world multi-tenant contacts
const seedContacts: Contact[] = [
  // Sub 1: Apex Tax & Wealth Partners
  {
    id: 'c-101',
    firstName: 'Marcus',
    lastName: 'Sterling',
    email: 'm.sterling@sterlingholdings.com',
    phone: '(415) 555-0142',
    company: 'Sterling Global Holdings',
    tags: ['HNW', 'Tax Planning', 'Real Estate'],
    customFields: { city: 'San Francisco', state: 'CA', zip: '94104', country: 'US' },
    source: 'Strategic Partner Referral',
    status: 'customer',
    assignedTo: 'prep-1',
    pipelineId: 'default-pipeline',
    stageId: 'stage-6',
    value: 12500,
    notes: [
      { id: 'n-1', content: 'Met with client to discuss Q3 tax planning strategy on Qualified Opportunity Zones.', authorId: 'prep-1', createdAt: new Date('2026-05-15T10:00:00Z') }
    ],
    activities: [
      { id: 'act-1', type: 'meeting', description: 'Real Estate Wealth Structuring Meeting', completed: true, completedAt: new Date('2026-05-15T11:00:00Z'), contactId: 'c-101', createdAt: new Date('2026-05-10T09:00:00Z') }
    ],
    createdAt: new Date('2026-04-10T09:00:00Z'),
    updatedAt: new Date('2026-06-20T14:00:00Z'),
    subAccountId: 'sub-1'
  },
  {
    id: 'c-102',
    firstName: 'Elena',
    lastName: 'Vasiliev',
    email: 'elena@vasilievbiotech.com',
    phone: '(650) 555-0177',
    company: 'Vasiliev BioTech Inc',
    tags: ['Corporate', 'R&D Credits', 'QSBS'],
    customFields: { city: 'Palo Alto', state: 'CA', zip: '94301', country: 'US' },
    source: 'LinkedIn Organic Outbound',
    status: 'prospect',
    assignedTo: 'prep-4',
    pipelineId: 'default-pipeline',
    stageId: 'stage-4',
    value: 8500,
    notes: [
      { id: 'n-2', content: 'Awaiting clean-up ledger from their current bookkeeper before calculating Section 1202 QSBS qualification.', authorId: 'prep-4', createdAt: new Date('2026-06-18T14:20:00Z') }
    ],
    activities: [
      { id: 'act-2', type: 'call', description: 'Follow up on bookkeeping ledger release', completed: false, contactId: 'c-102', createdAt: new Date('2026-06-22T08:00:00Z') }
    ],
    createdAt: new Date('2026-05-20T10:30:00Z'),
    updatedAt: new Date('2026-06-22T08:00:00Z'),
    subAccountId: 'sub-1'
  },

  // Sub 2: Southwest IRS Resolution Group
  {
    id: 'c-201',
    firstName: 'Carlos',
    lastName: 'Alvarez',
    email: 'carlos@alvarezconcrete.com',
    phone: '(505) 555-0161',
    company: 'Alvarez Concrete & Framing LLC',
    tags: ['IRS Notice', '941 Payroll Tax', 'Lien Release'],
    customFields: { city: 'Albuquerque', state: 'NM', zip: '87105', country: 'US' },
    source: 'Google Local Ads',
    status: 'customer',
    assignedTo: 'prep-3',
    pipelineId: 'default-pipeline',
    stageId: 'stage-6',
    value: 9500,
    notes: [
      { id: 'n-3', content: 'Form 2848 Power of Attorney successfully processed by CAF Unit. Levy on business checking account successfully released.', authorId: 'prep-3', createdAt: new Date('2026-05-28T09:00:00Z') }
    ],
    activities: [
      { id: 'act-3', type: 'sms', description: 'Sent updates regarding completed Form 433-B submission.', completed: true, completedAt: new Date('2026-06-02T15:00:00Z'), contactId: 'c-201', createdAt: new Date('2026-06-02T14:45:00Z') }
    ],
    createdAt: new Date('2026-05-01T08:00:00Z'),
    updatedAt: new Date('2026-06-02T15:00:00Z'),
    subAccountId: 'sub-2'
  },
  {
    id: 'c-202',
    firstName: 'Samantha',
    lastName: 'Gomez',
    email: 'sam@gomezconsulting.co',
    phone: '(505) 555-0133',
    company: 'Gomez Consulting',
    tags: ['Offer In Compromise', 'Audit Defense', 'CP504'],
    customFields: { city: 'Santa Fe', state: 'NM', zip: '87501', country: 'US' },
    source: 'Radio Broadcast CTA',
    status: 'lead',
    assignedTo: 'prep-3',
    pipelineId: 'default-pipeline',
    stageId: 'stage-1',
    value: 5000,
    notes: [],
    activities: [],
    createdAt: new Date('2026-06-25T11:00:00Z'),
    updatedAt: new Date('2026-06-25T11:00:00Z'),
    subAccountId: 'sub-2'
  },

  // Sub 3: Vance & Kaufman Tax Services
  {
    id: 'c-301',
    firstName: 'Robert',
    lastName: 'Henderson',
    email: 'r.henderson@hendersonhome.net',
    phone: '(505) 555-0182',
    company: 'Henderson Family Ranch',
    tags: ['Family Tax', 'W-2', 'Sch-C'],
    customFields: { city: 'Tijeras', state: 'NM', zip: '87059', country: 'US' },
    source: 'Walk-In Customer',
    status: 'customer',
    assignedTo: 'prep-1',
    pipelineId: 'default-pipeline',
    stageId: 'stage-6',
    value: 1250,
    notes: [
      { id: 'n-4', content: 'Completed federal 1040 and NM state return. Client owes local NM gross receipts tax for part-time consulting.', authorId: 'prep-1', createdAt: new Date('2026-05-12T16:00:00Z') }
    ],
    activities: [],
    createdAt: new Date('2026-05-10T10:00:00Z'),
    updatedAt: new Date('2026-05-15T14:00:00Z'),
    subAccountId: 'sub-3'
  },
  {
    id: 'c-302',
    firstName: 'Gregory',
    lastName: 'Oak',
    email: 'gregory@oakridgelogistics.com',
    phone: '(505) 555-0129',
    company: 'Oak Ridge Logistics Inc',
    tags: ['S-Corp', '1120-S', 'Bookkeeping Client'],
    customFields: { city: 'Edgewood', state: 'NM', zip: '87015', country: 'US' },
    source: 'Partner Referral',
    status: 'customer',
    assignedTo: 'prep-2',
    pipelineId: 'default-pipeline',
    stageId: 'stage-6',
    value: 6500,
    notes: [],
    activities: [],
    createdAt: new Date('2026-04-20T08:30:00Z'),
    updatedAt: new Date('2026-05-28T14:30:00Z'),
    subAccountId: 'sub-3'
  }
];

// Seed high-fidelity, real-world multi-tenant deals
const seedDeals: Deal[] = [
  // Sub 1: Apex Tax & Wealth Partners (High-End Structuring)
  {
    id: 'deal-101',
    name: 'Corporate Structuring & Tax Plan - Sterling Global',
    contactId: 'c-101',
    contactName: 'Marcus Sterling',
    value: 12500,
    probability: 90,
    stageId: 'stage-6', // Closed Won
    assignedTo: 'prep-1',
    ownerId: 'usr-1',
    ownerName: 'Loyce Smith',
    tags: ['Corporate', 'QSBS', 'Section-1202'],
    createdAt: new Date('2026-04-10T09:00:00Z'),
    updatedAt: new Date('2026-06-20T14:00:00Z'),
    source: 'Partner Referral',
    daysInStage: 15,
    slaDays: 7,
    filingComplexity: 'Complex',
    feeStructure: 'Flat',
    aiScore: 94,
    aiRationale: ['Corporate engagement signed, retainer paid.', 'Excellent match for advanced tax sheltering models.'],
    aiNextAction: 'Proceed to draft definitive structure memo and submit files to CPA reviewer.',
    commissionPlan: 'Senior Prep Plan (15%)',
    commissionSplits: [{ name: 'Loyce Smith', pct: 100 }],
    subAccountId: 'sub-1'
  },
  {
    id: 'deal-102',
    name: 'QSBS Advisory - Elena Vasiliev',
    contactId: 'c-102',
    contactName: 'Elena Vasiliev',
    value: 8500,
    probability: 60,
    stageId: 'stage-4', // Proposal
    assignedTo: 'prep-4',
    ownerId: 'usr-1',
    ownerName: 'Loyce Smith',
    tags: ['QSBS', 'Biotech', 'R&D Credits'],
    createdAt: new Date('2026-05-20T10:30:00Z'),
    updatedAt: new Date('2026-06-22T08:00:00Z'),
    source: 'LinkedIn Organic Outbound',
    daysInStage: 4,
    slaDays: 5,
    filingComplexity: 'Complex',
    feeStructure: 'Hourly',
    aiScore: 82,
    aiRationale: ['High value venture-backed QSBS valuation.', 'Awaiting official stock purchase agreement details.'],
    aiNextAction: 'Send missing document request regarding stock purchase agreement files.',
    commissionPlan: 'Corporate Partner Plan (20%)',
    commissionSplits: [{ name: 'Loyce Smith', pct: 100 }],
    subAccountId: 'sub-1'
  },

  // Sub 2: Southwest IRS Resolution Group (IRS Cases)
  {
    id: 'deal-201',
    name: 'Payroll Tax Settlement - Alvarez Concrete',
    contactId: 'c-201',
    contactName: 'Carlos Alvarez',
    value: 9500,
    probability: 100,
    stageId: 'stage-6', // Closed Won
    assignedTo: 'prep-3',
    ownerId: 'usr-2',
    ownerName: 'Eugene Vance',
    tags: ['Payroll Tax', 'Lien Release', '941 Notice'],
    createdAt: new Date('2026-05-01T08:00:00Z'),
    updatedAt: new Date('2026-06-02T15:00:00Z'),
    source: 'Google Local Ads',
    daysInStage: 12,
    slaDays: 14,
    filingComplexity: 'Complex',
    feeStructure: 'Flat',
    irsNoticeType: 'CP2000 Underreported Income',
    taxYearsInvolved: '2022-2024',
    amountInDispute: 82000,
    resolutionType: 'Offer In Compromise (OIC)',
    estimatedSavings: 65000,
    aiScore: 98,
    aiRationale: ['Offer accepted by IRS Centralized OIC Unit.', 'Lien withdrawal successfully recorded.'],
    aiNextAction: 'Issue client settlement letter and request review of the installment terms.',
    commissionPlan: 'Audit Rep Mastery (18%)',
    commissionSplits: [{ name: 'Eugene Vance', pct: 100 }],
    subAccountId: 'sub-2'
  },
  {
    id: 'deal-202',
    name: 'Offer in Compromise - Samantha Gomez',
    contactId: 'c-202',
    contactName: 'Samantha Gomez',
    value: 5000,
    probability: 20,
    stageId: 'stage-1', // New Lead
    assignedTo: 'prep-3',
    ownerId: 'usr-2',
    ownerName: 'Eugene Vance',
    tags: ['OIC', 'Notice', 'Tax Debt'],
    createdAt: new Date('2026-06-25T11:00:00Z'),
    updatedAt: new Date('2026-06-25T11:00:00Z'),
    source: 'Radio Broadcast CTA',
    daysInStage: 3,
    slaDays: 7,
    filingComplexity: 'Moderate',
    feeStructure: 'Flat',
    amountInDispute: 41200,
    aiScore: 54,
    aiRationale: ['Lead captured via CRM form submission.', 'Initial consultation scheduled for tomorrow.'],
    aiNextAction: 'Conduct financial analysis via Form 433-A (OIC) eligibility.',
    commissionPlan: 'Audit Rep Mastery (18%)',
    commissionSplits: [{ name: 'Eugene Vance', pct: 100 }],
    subAccountId: 'sub-2'
  },

  // Sub 3: Vance & Kaufman Tax Services (B2C & Small Business)
  {
    id: 'deal-301',
    name: 'Household Tax Prep - Henderson Family',
    contactId: 'c-301',
    contactName: 'Robert Henderson',
    spouseName: 'Sarah Henderson',
    value: 1250,
    probability: 100,
    stageId: 'stage-6', // Closed Won
    assignedTo: 'prep-1',
    ownerId: 'usr-1',
    ownerName: 'Loyce Smith',
    tags: ['Family Return', 'W-2', 'Sch-C'],
    createdAt: new Date('2026-05-10T10:00:00Z'),
    updatedAt: new Date('2026-05-15T14:00:00Z'),
    source: 'Walk-In Customer',
    daysInStage: 4,
    slaDays: 5,
    filingComplexity: 'Moderate',
    feeStructure: 'Flat',
    estimatedRefund: 4210,
    returnsCount: 2,
    aiScore: 100,
    aiRationale: ['Signed 1040 submitted, direct deposit refund processing.', 'Perfect filing without audit flags.'],
    aiNextAction: 'Deliver client copies of the returns and file in permanent cloud vault.',
    commissionPlan: 'Senior Prep Plan (15%)',
    commissionSplits: [{ name: 'Loyce Smith', pct: 100 }],
    subAccountId: 'sub-3'
  },
  {
    id: 'deal-302',
    name: 'Corporate Return & Bookkeeping - Oak Ridge Logistics',
    contactId: 'c-302',
    contactName: 'Gregory Oak',
    value: 6500,
    probability: 100,
    stageId: 'stage-6', // Closed Won
    assignedTo: 'prep-2',
    ownerId: 'usr-2',
    ownerName: 'Eugene Vance',
    tags: ['S-Corp', 'Bookkeeping', '1120S'],
    createdAt: new Date('2026-04-20T08:30:00Z'),
    updatedAt: new Date('2026-05-28T14:30:00Z'),
    source: 'Partner Referral',
    daysInStage: 11,
    slaDays: 7,
    filingComplexity: 'Complex',
    feeStructure: 'Flat',
    estimatedBalanceDue: 14800,
    returnsCount: 5,
    aiScore: 92,
    aiRationale: ['Completed corporate filing packages.', 'Assigned to junior preparer with partner final sign-off.'],
    aiNextAction: 'Email corporate copies to general manager for corporate archives.',
    commissionPlan: 'Corporate Partner Plan (20%)',
    commissionSplits: [{ name: 'Eugene Vance', pct: 100 }],
    subAccountId: 'sub-3'
  }
];

const seedAppointments: Appointment[] = [
  {
    id: 'a-1',
    title: 'Advanced Trust Advisory Consultation',
    description: 'Structure tax sheltering model for trust properties.',
    startTime: new Date('2026-07-02T10:00:00Z'),
    endTime: new Date('2026-07-02T11:00:00Z'),
    location: 'Silicon Valley Branch Office',
    type: 'meeting',
    status: 'scheduled',
    contactId: 'c-101',
    assignedTo: 'prep-1',
    reminders: [],
    createdAt: new Date(),
    subAccountId: 'sub-1'
  },
  {
    id: 'a-2',
    title: 'OIC IRS Negotiation Phone Call',
    description: 'Call IRS Agent to review Form 433-A asset disclosures.',
    startTime: new Date('2026-07-03T14:00:00Z'),
    endTime: new Date('2026-07-03T14:30:00Z'),
    location: 'Phone Conference',
    type: 'call',
    status: 'confirmed',
    contactId: 'c-201',
    assignedTo: 'prep-3',
    reminders: [],
    createdAt: new Date(),
    subAccountId: 'sub-2'
  },
  {
    id: 'a-3',
    title: 'Henderson Family Return Delivery',
    description: 'Go over federal tax liability and e-filing authorization form.',
    startTime: new Date('2026-07-04T09:00:00Z'),
    endTime: new Date('2026-07-04T09:30:00Z'),
    location: 'Tijeras Office',
    type: 'meeting',
    status: 'confirmed',
    contactId: 'c-301',
    assignedTo: 'prep-1',
    reminders: [],
    createdAt: new Date(),
    subAccountId: 'sub-3'
  }
];

// Helper to filter state data based on sub-account ID
const getFilteredTenantData = (subAccount: SubAccount | null, state: any) => {
  if (!subAccount) {
    // Master admin view: Return all elements
    return {
      contacts: state.allContacts,
      deals: state.allDeals,
      appointments: state.allAppointments,
      campaigns: state.allCampaigns,
      workflows: state.allWorkflows,
      funnels: state.allFunnels,
      websites: state.allWebsites,
      forms: state.allForms,
      blogPosts: state.allBlogPosts,
      preparers: state.allPreparers,
      payouts: state.allPayouts,
      brandColors: defaultBrandColors,
    };
  }

  const subId = subAccount.id;
  return {
    contacts: state.allContacts.filter((c: any) => c.subAccountId === subId),
    deals: state.allDeals.filter((d: any) => d.subAccountId === subId),
    appointments: state.allAppointments.filter((a: any) => a.subAccountId === subId),
    campaigns: state.allCampaigns.filter((c: any) => c.subAccountId === subId),
    workflows: state.allWorkflows.filter((w: any) => w.subAccountId === subId),
    funnels: state.allFunnels.filter((f: any) => f.subAccountId === subId),
    websites: state.allWebsites.filter((w: any) => w.subAccountId === subId),
    forms: state.allForms.filter((f: any) => f.subAccountId === subId),
    blogPosts: state.allBlogPosts.filter((b: any) => b.subAccountId === subId),
    preparers: state.allPreparers.filter((p: any) => p.subAccountId === subId || !p.subAccountId),
    payouts: state.allPayouts.filter((p: any) => p.subAccountId === subId || p.preparerId && state.allPreparers.find((prep: any) => prep.id === p.preparerId)?.subAccountId === subId),
    brandColors: subAccount.colors,
  };
};

/* ═══════════ BACKEND BRIDGE HELPERS (D1 → Zustand) ═══════════ */

const toDate = (v: unknown): Date => {
  if (v instanceof Date) return v;
  if (!v) return new Date();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

/** Coerce server payloads (ISO strings, camelCase) into store-shaped items. */
const hydrateItem = <T extends Record<string, any>>(item: T, tenantId: string): T => ({
  ...item,
  subAccountId: item.subAccountId || tenantId,
  createdAt: toDate(item.createdAt),
  updatedAt: item.updatedAt !== undefined ? toDate(item.updatedAt) : item.updatedAt,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Authentication & Initial State
      currentUser: null,
      currentSubAccount: null,
      isAuthenticated: false,
      backendMode: false,
      subAccounts: seedSubAccounts,

      // Filtered data properties initialized with empty lists (or master values before selection)
      contacts: seedContacts,
      pipelines: [
        {
          id: 'default-pipeline',
          name: 'Sales Pipeline',
          stages: [
            { id: 'stage-1', name: 'New Lead', position: 0 },
            { id: 'stage-2', name: 'Contacted', position: 1 },
            { id: 'stage-3', name: 'Qualified', position: 2 },
            { id: 'stage-4', name: 'Proposal', position: 3 },
            { id: 'stage-5', name: 'Negotiation', position: 4 },
            { id: 'stage-6', name: 'Closed Won', position: 5 },
            { id: 'stage-7', name: 'Closed Lost', position: 6 },
          ],
          color: '#4F46E5',
          isDefault: true,
          createdAt: new Date(),
        },
      ],
      deals: seedDeals,
      appointments: seedAppointments,
      campaigns: [],
      workflows: [],
      funnels: [],
      websites: [],
      forms: [],
      blogPosts: [],
      socialAccounts: [],
      
      dashboardWidgets: [
        { id: 'w1', type: 'stats', title: 'Overview', position: { x: 0, y: 0 }, size: { w: 4, h: 2 }, config: {} },
        { id: 'w2', type: 'chart', title: 'Pipeline Value', position: { x: 4, y: 0 }, size: { w: 4, h: 2 }, config: {} },
        { id: 'w3', type: 'list', title: 'Recent Activities', position: { x: 8, y: 0 }, size: { w: 4, h: 2 }, config: {} },
        { id: 'w4', type: 'calendar', title: 'Upcoming Appointments', position: { x: 0, y: 2 }, size: { w: 6, h: 3 }, config: {} },
        { id: 'w5', type: 'tasks', title: 'Tasks', position: { x: 6, y: 2 }, size: { w: 6, h: 3 }, config: {} },
      ],
      notifications: [],
      brandColors: defaultBrandColors,
      sidebarOpen: true,
      activeModule: 'dashboard',

      // Preparers & Payouts seeded state
      preparers: [
        {
          id: 'prep-1',
          firstName: 'Marcus',
          lastName: 'Vance',
          email: 'm.vance@vancekaufmantax.com',
          phone: '(505) 555-0120',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          role: 'senior_preparer',
          status: 'active',
          ptin: 'P01234567',
          efin: '123456',
          credentials: ['EA', 'IRS Cert'],
          payStructure: 'percentage',
          payoutRate: 40,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 24,
          circular230Status: 'verified',
          performance: {
            completedReturns: 48,
            activeFiles: 12,
            averageRefundValue: 4850,
            satisfactionScore: 4.9,
            slaComplianceRate: 98.5,
            revenueGenerated: 16800,
          },
          createdAt: new Date('2026-01-15T08:00:00Z'),
          updatedAt: new Date('2026-06-01T12:00:00Z'),
          payoutLedger: []
        },
        {
          id: 'prep-2',
          firstName: 'Sarah',
          lastName: 'Kaufman',
          email: 's.kaufman@vancekaufmantax.com',
          phone: '(505) 555-0145',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          role: 'junior_preparer',
          status: 'active',
          ptin: 'P07654321',
          credentials: ['AFSP Cert'],
          payStructure: 'flat',
          payoutRate: 125,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 15,
          circular230Status: 'verified',
          performance: {
            completedReturns: 32,
            activeFiles: 8,
            averageRefundValue: 3120,
            satisfactionScore: 4.7,
            slaComplianceRate: 96.0,
            revenueGenerated: 8000,
          },
          createdAt: new Date('2026-02-10T09:00:00Z'),
          updatedAt: new Date('2026-05-28T14:30:00Z'),
          payoutLedger: []
        },
        {
          id: 'prep-3',
          firstName: 'Jonathan',
          lastName: 'Esquire',
          email: 'j.esquire@southwestirsresolution.com',
          phone: '(505) 555-0180',
          role: 'tax_attorney',
          status: 'active',
          ptin: 'P09988776',
          credentials: ['JD', 'LLM Tax', 'State Bar NM'],
          payStructure: 'percentage',
          payoutRate: 50,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 36,
          circular230Status: 'verified',
          performance: {
            completedReturns: 14,
            activeFiles: 4,
            averageRefundValue: 12400,
            satisfactionScore: 5.0,
            slaComplianceRate: 100.0,
            revenueGenerated: 34500,
          },
          createdAt: new Date('2025-11-01T08:30:00Z'),
          updatedAt: new Date('2026-06-03T16:15:00Z'),
          payoutLedger: []
        }
      ],
      payouts: [],

      // Master Backing Lists (Maintains all records in absolute truth-source arrays)
      allContacts: seedContacts,
      allDeals: seedDeals,
      allAppointments: seedAppointments,
      allCampaigns: [
        {
          id: 'cmp-101',
          name: 'HNW Wealth & Pass-Through Entity Tax Shield',
          type: 'both',
          status: 'completed',
          subject: 'Stop Overpaying Business Taxes: S-Corp Optimization Strategy Inside',
          content: 'Hello {{contact.firstName}},\n\nWith IRS Revenue Procedure 2025-32 adjustments taking active effect for Tax Year 2026, proper coordination of your pass-through distributions and Section 199A QBI deductions can save you up to 20% on pass-through liability.\n\nLet\'s coordinate a 15-minute file audit.\n\nBest regards,\nRick Jefferson\nsupport@rjbusinesssolutions.org',
          recipientCount: 142,
          sentCount: 142,
          openedCount: 121,
          clickedCount: 88,
          createdAt: new Date('2026-06-01T09:00:00Z'),
          subAccountId: 'sub-1'
        },
        {
          id: 'cmp-201',
          name: 'IRS CP-2000 Notice Settlement & Relief Campaign',
          type: 'email',
          status: 'sending',
          subject: 'URGENT: Your IRS Notice Response Deadline is Looming',
          content: 'Dear Taxpayer,\n\nReceiving a CP-2000 notice can be intimidating, but our team specializes in IRS representation. Under Circular 230 safe harbors, we review, audit, and contest automated notices to settle for fractions of the disputed amount.\n\nUpload your notice document directly inside our secure portal for immediate analysis.\n\nBest regards,\nSouthwest IRS Resolution Group',
          recipientCount: 85,
          sentCount: 52,
          openedCount: 48,
          clickedCount: 30,
          createdAt: new Date('2026-06-15T10:00:00Z'),
          subAccountId: 'sub-2'
        },
        {
          id: 'cmp-301',
          name: 'S-Corp retro Election & Retroactive Tax Mitigation',
          type: 'sms',
          status: 'draft',
          content: 'Hi {{contact.firstName}}, it\'s Vance & Kaufman Tax. Did you know we can execute a retroactive S-Corp election for your business? Click here to book an intake: vancekaufman.com/scorp',
          recipientCount: 220,
          sentCount: 0,
          openedCount: 0,
          clickedCount: 0,
          createdAt: new Date('2026-06-28T14:00:00Z'),
          subAccountId: 'sub-3'
        }
      ],
      allWorkflows: [
        {
          id: 'wf-101',
          name: 'HNW Seasonal Welcome & Secure Document Lockbox sequence',
          trigger: { type: 'contact_created' },
          actions: [
            { id: 'a1', type: 'add_tag', config: { tag: 'HNW-Incoming' } },
            { id: 'a2', type: 'send_sms', config: { message: 'Hi {{contact.firstName}}, welcome to Tax Pro Hub University! We have established your secure Document Lockbox. Please check your email for secure upload parameters.' } },
            { id: 'a3', type: 'delay', config: { delayMinutes: 10 } },
            { id: 'a4', type: 'send_email', config: { subject: 'Setup your Secure Taxpayer Organizer Client Portal', body: 'Dear {{contact.firstName}},\n\nWelcome to Tax Pro Hub University. Please upload your W-2s, 1099s, and prior-year returns using this link: {{portal.link}}\n\nPowered by RJ Business Solutions' } }
          ],
          isActive: true,
          createdAt: new Date('2026-05-10T10:00:00Z'),
          updatedAt: new Date('2026-06-25T11:00:00Z'),
          subAccountId: 'sub-1'
        },
        {
          id: 'wf-201',
          name: 'OIC IRS Settlement Stage Trigger with Twilio Notification',
          trigger: { type: 'deal_stage_changed' },
          actions: [
            { id: 'b1', type: 'add_tag', config: { tag: 'OIC-Active' } },
            { id: 'b2', type: 'create_task', config: { taskName: 'Assign Power of Attorney & Draft Form 2848' } },
            { id: 'b3', type: 'webhook', config: { url: 'https://api.taxprohubuniversity.com/v1/sync-irs' } }
          ],
          isActive: true,
          createdAt: new Date('2026-05-20T12:00:00Z'),
          updatedAt: new Date('2026-06-20T14:30:00Z'),
          subAccountId: 'sub-2'
        },
        {
          id: 'wf-301',
          name: 'Form 8879 Direct e-File Authorization SMS Alert sequence',
          trigger: { type: 'custom' },
          actions: [
            { id: 'c1', type: 'send_sms', config: { message: 'Hi {{contact.firstName}}, Vance & Kaufman Tax has completed your return. Please access the portal to sign Form 8879 so we can e-File with the IRS.' } }
          ],
          isActive: false,
          createdAt: new Date('2026-06-01T08:00:00Z'),
          updatedAt: new Date('2026-06-01T08:00:00Z'),
          subAccountId: 'sub-3'
        }
      ],
      allFunnels: [
        {
          id: 'fun-101',
          name: 'HNW Wealth & Deductions Capture Funnel',
          steps: [
            { id: 'fs1', name: 'Luxury Landing Strategy Overview', slug: 'scorp-shield', type: 'landing', path: '/scorp-shield', content: 'HNW Tax Shield strategy explanation and value prop cards.', position: 0 },
            { id: 'fs2', name: 'Form 1040 secure Intake Questionnaire', slug: 'intake', type: 'checkout', path: '/intake', content: 'Taxpayer demographic and filing status selection fields.', position: 1 },
            { id: 'fs3', name: 'Confirmation & Advisory Booking Desk', slug: 'scheduled', type: 'thankyou', path: '/thanks', content: 'Success dashboard with scheduling widget integration.', position: 2 }
          ],
          published: true,
          stats: { views: 1840, conversions: 112, conversionRate: 6.08, revenue: 14500 },
          createdAt: new Date('2026-04-15T09:00:00Z'),
          updatedAt: new Date('2026-06-28T16:00:00Z'),
          subAccountId: 'sub-1'
        },
        {
          id: 'fun-201',
          name: 'IRS Notice Help Desk & CP-2000 Settlement Funnel',
          steps: [
            { id: 'fs4', name: 'Notice Resolution Landing Page', slug: 'irs-notice', type: 'landing', path: '/irs-notice', content: 'Emergency CP-Notice relief help desk landing layout.', position: 0 },
            { id: 'fs5', name: 'Emergency notice document upload portal', slug: 'upload', type: 'checkout', path: '/upload', content: 'Secure lockbox document drag-and-drop element.', position: 1 }
          ],
          published: true,
          stats: { views: 950, conversions: 42, conversionRate: 4.42, revenue: 21000 },
          createdAt: new Date('2026-05-01T10:00:00Z'),
          updatedAt: new Date('2026-06-20T11:00:00Z'),
          subAccountId: 'sub-2'
        }
      ],
      allWebsites: [
        {
          id: 'web-101',
          name: 'Main Firm Portal & Advisory Services Showcase',
          pages: [
            { id: 'p1', title: 'Home Portfolio', slug: 'home', content: 'Main welcome layout highlighting partner biographies and Circular 230 certification badges.', isHome: true, published: true }
          ],
          theme: {
            primaryColor: '#D4AF37',
            secondaryColor: '#111111',
            fontFamily: 'Inter',
            headerStyle: 'modern',
            footerStyle: 'clean'
          },
          published: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          subAccountId: 'sub-1'
        }
      ],
      allForms: [
        {
          id: 'frm-101',
          name: 'Federal Form 1040 HNW Intake Questionnaire',
          fields: [
            { id: 'fld1', type: 'text', label: 'Full Name', placeholder: 'Marcus Sterling', required: true, position: 0 },
            { id: 'fld2', type: 'email', label: 'Email Address', placeholder: 'm.sterling@sterling.com', required: true, position: 1 },
            { id: 'fld3', type: 'phone', label: 'Phone Number', placeholder: '(415) 555-0142', required: true, position: 2 },
            { id: 'fld4', type: 'select', label: 'Filing Status', required: true, position: 3, options: ['Single', 'Married Filing Jointly', 'Head of Household'] }
          ],
          settings: { submitButtonText: 'Authorize Secure Sync', successMessage: 'Success! Your taxpayer profile is successfully synchronized with our tax ledger.', storeSubmissions: true },
          submissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          subAccountId: 'sub-1'
        },
        {
          id: 'frm-201',
          name: 'IRS Notice Emergency Upload Secure Intake',
          fields: [
            { id: 'fld5', type: 'text', label: 'Taxpayer Name', required: true, position: 0 },
            { id: 'fld6', type: 'text', label: 'IRS Notice Code', placeholder: 'e.g. CP-2000 or CP-504', required: true, position: 1 },
            { id: 'fld7', type: 'file', label: 'Secure Document Upload', required: true, position: 2 }
          ],
          settings: { submitButtonText: 'Initialize Laser OCR Scan', successMessage: 'Document received. Launching deep cognitive extraction sequence...', storeSubmissions: true },
          submissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          subAccountId: 'sub-2'
        }
      ],
      allBlogPosts: [
        {
          id: 'blog-101',
          title: 'S-Corp Reasonable Compensation Requirements for 2026 Tax Season',
          slug: 'scorp-reasonable-compensation-2026',
          excerpt: 'Unpacking current standard deductions, Section 179 expansion, and pass-through tax shields under IRS Revenue Procedure 2025-32.',
          content: 'S-Corporation business structures are under closer audit scrutiny this year. Officers must take a "Reasonable Compensation" prior to distributing dividends. We review salary ranges and local industry benchmarks to ensure safe harbor filings.',
          tags: ['S-Corp', 'IRS Audits', 'Business Strategy'],
          status: 'published',
          authorId: 'prep-1',
          createdAt: new Date('2026-06-10T08:00:00Z'),
          updatedAt: new Date('2026-06-10T08:00:00Z'),
          subAccountId: 'sub-1'
        },
        {
          id: 'blog-201',
          title: 'Demystifying IRS CP-2000 Notices: Steps to Avoid Audits',
          slug: 'irs-cp-2000-notice-guide',
          excerpt: 'Received an automated underreporting letter? Here is your CISA and C230 compliant defense roadmap.',
          content: 'CP-2000 notices are automatically generated when IRS computers detect differences between what you reported and what employers filed (like W-2s or 1099s). Settle this proactively without triggering deep-dive manual reviews.',
          tags: ['IRS Notice', 'CP-2000', 'Tax Relief'],
          status: 'published',
          authorId: 'prep-3',
          createdAt: new Date('2026-06-22T09:00:00Z'),
          updatedAt: new Date('2026-06-22T09:00:00Z'),
          subAccountId: 'sub-2'
        }
      ],
      allPreparers: [
        {
          id: 'prep-1',
          firstName: 'Marcus',
          lastName: 'Vance',
          email: 'm.vance@vancekaufmantax.com',
          phone: '(505) 555-0120',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          role: 'senior_preparer',
          status: 'active',
          ptin: 'P01234567',
          efin: '123456',
          credentials: ['EA', 'IRS Cert'],
          payStructure: 'percentage',
          payoutRate: 40,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 24,
          circular230Status: 'verified',
          performance: {
            completedReturns: 48,
            activeFiles: 12,
            averageRefundValue: 4850,
            satisfactionScore: 4.9,
            slaComplianceRate: 98.5,
            revenueGenerated: 16800,
          },
          createdAt: new Date('2026-01-15T08:00:00Z'),
          updatedAt: new Date('2026-06-01T12:00:00Z'),
          payoutLedger: [],
          subAccountId: 'sub-3'
        },
        {
          id: 'prep-2',
          firstName: 'Sarah',
          lastName: 'Kaufman',
          email: 's.kaufman@vancekaufmantax.com',
          phone: '(505) 555-0145',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          role: 'junior_preparer',
          status: 'active',
          ptin: 'P07654321',
          credentials: ['AFSP Cert'],
          payStructure: 'flat',
          payoutRate: 125,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 15,
          circular230Status: 'verified',
          performance: {
            completedReturns: 32,
            activeFiles: 8,
            averageRefundValue: 3120,
            satisfactionScore: 4.7,
            slaComplianceRate: 96.0,
            revenueGenerated: 8000,
          },
          createdAt: new Date('2026-02-10T09:00:00Z'),
          updatedAt: new Date('2026-05-28T14:30:00Z'),
          payoutLedger: [],
          subAccountId: 'sub-3'
        },
        {
          id: 'prep-3',
          firstName: 'Jonathan',
          lastName: 'Esquire',
          email: 'j.esquire@southwestirsresolution.com',
          phone: '(505) 555-0180',
          role: 'tax_attorney',
          status: 'active',
          ptin: 'P09988776',
          credentials: ['JD', 'LLM Tax', 'State Bar NM'],
          payStructure: 'percentage',
          payoutRate: 50,
          assignedClientIds: [],
          assignedDealIds: [],
          ceCredits: 36,
          circular230Status: 'verified',
          performance: {
            completedReturns: 14,
            activeFiles: 4,
            averageRefundValue: 12400,
            satisfactionScore: 5.0,
            slaComplianceRate: 100.0,
            revenueGenerated: 34500,
          },
          createdAt: new Date('2025-11-01T08:30:00Z'),
          updatedAt: new Date('2026-06-03T16:15:00Z'),
          payoutLedger: [],
          subAccountId: 'sub-2'
        }
      ],
      allPayouts: [],

      // Authentication Actions
      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => {
        clearToken();
        set({ currentUser: null, currentSubAccount: null, isAuthenticated: false, backendMode: false });
      },

      // Backend bridge — flips into Cloudflare-backed mode and replaces the
      // localStorage snapshot with the tenant's D1 data.
      setBackendMode: (mode) => set({ backendMode: mode }),
      hydrateBackend: (data) => set(() => {
        const t = (data.tenant || {}) as any;
        const tenant: SubAccount = {
          id: t.id,
          name: t.name || t.businessName || 'Tax Pro Hub Practice',
          businessName: t.businessName || t.name || '',
          businessAddress: t.businessAddress || '',
          email: t.email || '',
          phone: t.phone || '',
          logo: t.logo,
          colors: t.colors || defaultBrandColors,
          domain: t.domain,
          status: (t.status || 'active') as SubAccount['status'],
          createdAt: toDate(t.createdAt),
          updatedAt: toDate(t.updatedAt),
        };
        const u = (data.user || {}) as any;
        const user: User = {
          id: u.id,
          email: u.email || '',
          name: u.name || '',
          role: (u.role || 'admin') as User['role'],
          subAccountId: tenant.id,
          createdAt: toDate(u.createdAt),
        };
        const tid = tenant.id;
        return {
          backendMode: true,
          currentUser: user,
          currentSubAccount: tenant,
          isAuthenticated: true,
          subAccounts: [tenant],
          pipelines: (data.pipelines || []).map((p: any) => hydrateItem(p, tid)),
          allContacts: (data.contacts || []).map((c: any) => hydrateItem(c, tid)),
          allDeals: (data.deals || []).map((d: any) => hydrateItem(d, tid)),
          allAppointments: (data.appointments || []).map((a: any) => hydrateItem(a, tid)),
          allCampaigns: (data.campaigns || []).map((c: any) => hydrateItem(c, tid)),
          allWorkflows: (data.workflows || []).map((w: any) => hydrateItem(w, tid)),
          allFunnels: (data.funnels || []).map((f: any) => hydrateItem(f, tid)),
          allWebsites: (data.websites || []).map((w: any) => hydrateItem(w, tid)),
          allForms: (data.forms || []).map((f: any) => hydrateItem(f, tid)),
          allBlogPosts: (data.blogPosts || []).map((b: any) => hydrateItem(b, tid)),
          allPreparers: (data.preparers || []).map((p: any) => hydrateItem(p, tid)),
          allPayouts: (data.payouts || []).map((p: any) => hydrateItem(p, tid)),
          contacts: (data.contacts || []).map((c: any) => hydrateItem(c, tid)),
          deals: (data.deals || []).map((d: any) => hydrateItem(d, tid)),
          appointments: (data.appointments || []).map((a: any) => hydrateItem(a, tid)),
          campaigns: (data.campaigns || []).map((c: any) => hydrateItem(c, tid)),
          workflows: (data.workflows || []).map((w: any) => hydrateItem(w, tid)),
          funnels: (data.funnels || []).map((f: any) => hydrateItem(f, tid)),
          websites: (data.websites || []).map((w: any) => hydrateItem(w, tid)),
          forms: (data.forms || []).map((f: any) => hydrateItem(f, tid)),
          blogPosts: (data.blogPosts || []).map((b: any) => hydrateItem(b, tid)),
          preparers: (data.preparers || []).map((p: any) => hydrateItem(p, tid)),
          payouts: (data.payouts || []).map((p: any) => hydrateItem(p, tid)),
        };
      }),
      
      // Dynamic Sub-Account switcher with instant, leak-proof multi-tenant routing filter
      setCurrentSubAccount: (account) => set((state) => {
        const filteredData = getFilteredTenantData(account, state);
        return {
          currentSubAccount: account,
          ...filteredData,
        };
      }),
      
      // Sub Account Actions
      addSubAccount: (account) => set((state) => ({ subAccounts: [...state.subAccounts, account] })),
      updateSubAccount: (id, data) => set((state) => {
        const updatedAccounts = state.subAccounts.map((a) => (a.id === id ? { ...a, ...data } : a));
        const updatedCurrent = state.currentSubAccount?.id === id ? { ...state.currentSubAccount, ...data } : state.currentSubAccount;
        return {
          subAccounts: updatedAccounts,
          currentSubAccount: updatedCurrent,
        };
      }),
      deleteSubAccount: (id) => set((state) => ({
        subAccounts: state.subAccounts.filter((a) => a.id !== id),
        currentSubAccount: state.currentSubAccount?.id === id ? null : state.currentSubAccount,
      })),

      // Preparer & Payout Actions
      addPreparer: (preparer) => set((state) => {
        const subId = preparer.subAccountId || state.currentSubAccount?.id;
        const withSub = { ...preparer, subAccountId: subId };
        const all = [...state.allPreparers, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPreparers: all });
        return { allPreparers: all, preparers: filtered.preparers };
      }),
      updatePreparer: (id, data) => set((state) => {
        const all = state.allPreparers.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPreparers: all });
        return { allPreparers: all, preparers: filtered.preparers };
      }),
      deletePreparer: (id) => set((state) => {
        const all = state.allPreparers.filter((p) => p.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPreparers: all });
        return { allPreparers: all, preparers: filtered.preparers };
      }),
      addPayout: (payout) => set((state) => {
        const all = [...state.allPayouts, payout];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPayouts: all });
        return { allPayouts: all, payouts: filtered.payouts };
      }),
      updatePayout: (id, data) => set((state) => {
        const all = state.allPayouts.map((p) => (p.id === id ? { ...p, ...data } : p));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPayouts: all });
        return { allPayouts: all, payouts: filtered.payouts };
      }),
      deletePayout: (id) => set((state) => {
        const all = state.allPayouts.filter((p) => p.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allPayouts: all });
        return { allPayouts: all, payouts: filtered.payouts };
      }),

      // Contact Actions (Backed and Filtered)
      addContact: (contact) => set((state) => {
        const subId = contact.subAccountId || state.currentSubAccount?.id;
        const withSub = { ...contact, subAccountId: subId };
        const all = [...state.allContacts, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allContacts: all });
        
        // Dispatch CAPI event in background
        sendCapiEvent('Lead', {
          em: contact.email,
          ph: contact.phone,
          fn: contact.firstName,
          ln: contact.lastName,
          ct: contact.customFields?.city,
          st: contact.customFields?.state,
          zp: contact.customFields?.zip,
          country: contact.customFields?.country || 'US',
        }, {
          value: contact.value || 0,
          content_name: `${contact.firstName} ${contact.lastName}`,
        }, contact.id).catch(err => console.error('CAPI Lead dispatch error:', err));

        return { allContacts: all, contacts: filtered.contacts };
      }),
      updateContact: (id, data) => set((state) => {
        const contact = state.allContacts.find((c) => c.id === id);
        if (contact && data.status === 'customer' && contact.status !== 'customer') {
          sendCapiEvent('CompleteRegistration', {
            em: data.email || contact.email,
            ph: data.phone || contact.phone,
            fn: data.firstName || contact.firstName,
            ln: data.lastName || contact.lastName,
            ct: data.customFields?.city || contact.customFields?.city,
            st: data.customFields?.state || contact.customFields?.state,
            zp: data.customFields?.zip || contact.customFields?.zip,
            country: data.customFields?.country || contact.customFields?.country || 'US',
          }, {
            value: data.value || contact.value || 0,
            content_name: `${data.firstName || contact.firstName} ${data.lastName || contact.lastName}`,
            status: 'customer',
          }, `reg_${id}_${Date.now()}`).catch(err => console.error('CAPI CompleteRegistration error:', err));
        }

        const all = state.allContacts.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date() } : c));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allContacts: all });
        return { allContacts: all, contacts: filtered.contacts };
      }),
      deleteContact: (id) => set((state) => {
        const all = state.allContacts.filter((c) => c.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allContacts: all });
        return { allContacts: all, contacts: filtered.contacts };
      }),

      // Pipeline Actions
      addPipeline: (pipeline) => set((state) => ({ pipelines: [...state.pipelines, pipeline] })),
      updatePipeline: (id, data) => set((state) => ({
        pipelines: state.pipelines.map((p) => (p.id === id ? { ...p, ...data } : p)),
      })),
      deletePipeline: (id) => set((state) => ({ pipelines: state.pipelines.filter((p) => p.id !== id) })),

      // Deal Actions (Backed and Filtered)
      addDeal: (deal) => set((state) => {
        const subId = deal.subAccountId || state.currentSubAccount?.id;
        const withSub = { ...deal, subAccountId: subId };
        const all = [...state.allDeals, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allDeals: all });
        return { allDeals: all, deals: filtered.deals };
      }),
      updateDeal: (id, data) => set((state) => {
        const all = state.allDeals.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date() } : d));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allDeals: all });
        return { allDeals: all, deals: filtered.deals };
      }),
      deleteDeal: (id) => set((state) => {
        const all = state.allDeals.filter((d) => d.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allDeals: all });
        return { allDeals: all, deals: filtered.deals };
      }),
      moveDeal: (dealId, stageId) => set((state) => {
        const deal = state.allDeals.find((d) => d.id === dealId);
        let newPayouts = state.allPayouts;
        let newPreparers = state.allPreparers;

        if (deal && stageId === 'stage-6' && deal.stageId !== 'stage-6') {
          // Find contact details to populate CAPI
          const contact = state.allContacts.find((c) => c.id === deal.contactId);
          if (contact) {
            sendCapiEvent('Purchase', {
              em: contact.email,
              ph: contact.phone,
              fn: contact.firstName,
              ln: contact.lastName,
              ct: contact.customFields?.city,
              st: contact.customFields?.state,
              zp: contact.customFields?.zip,
              country: contact.customFields?.country || 'US',
            }, {
              value: deal.value || contact.value || 0,
              currency: 'USD',
              content_name: deal.title || deal.name,
              content_category: 'Tax Preparation / Resolution Services',
            }, `pur_${dealId}_${Date.now()}`).catch(err => console.error('CAPI Purchase moveDeal error:', err));
          }

          // Calculate pending payout for the assigned preparer
          if (deal.assignedTo) {
            const preparer = state.allPreparers.find((p) => p.id === deal.assignedTo);
            if (preparer) {
              const baseAmount = deal.value || 0;
              let commissionAmount = 0;
              if (preparer.payStructure === 'percentage') {
                commissionAmount = Math.round(baseAmount * (preparer.payoutRate / 100));
              } else {
                commissionAmount = preparer.payoutRate;
              }

              const newPayout: Payout = {
                id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                preparerId: preparer.id,
                preparerName: `${preparer.firstName} ${preparer.lastName}`,
                dealId: deal.id,
                dealTitle: deal.title || deal.name,
                baseAmount,
                commissionAmount,
                amount: commissionAmount,
                method: 'direct_deposit',
                status: 'pending',
                referenceNumber: `ACH-PEND-${Math.floor(100000 + Math.random() * 900000)}`,
                paymentDate: new Date(),
                description: `Automated payout commission for closed deal: ${deal.title || deal.name}`,
              };

              newPayouts = [...state.allPayouts, newPayout];
              newPreparers = state.allPreparers.map((p) => {
                if (p.id === preparer.id) {
                  return {
                    ...p,
                    payoutLedger: [...(p.payoutLedger || []), newPayout],
                    performance: {
                      ...p.performance,
                      completedReturns: (p.performance.completedReturns || 0) + 1,
                      revenueGenerated: (p.performance.revenueGenerated || 0) + baseAmount,
                    },
                    updatedAt: new Date(),
                  };
                }
                return p;
              });
            }
          }
        }

        const all = state.allDeals.map((d) => (d.id === dealId ? { ...d, stageId, updatedAt: new Date() } : d));
        const nextState = { ...state, allDeals: all, allPayouts: newPayouts, allPreparers: newPreparers };
        const filtered = getFilteredTenantData(state.currentSubAccount, nextState);
        return {
          allDeals: all,
          allPayouts: newPayouts,
          allPreparers: newPreparers,
          deals: filtered.deals,
          payouts: filtered.payouts,
          preparers: filtered.preparers,
        };
      }),

      // Appointment Actions (Backed and Filtered)
      addAppointment: (appointment) => set((state) => {
        const subId = appointment.subAccountId || state.currentSubAccount?.id;
        const withSub = { ...appointment, subAccountId: subId };
        const all = [...state.allAppointments, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allAppointments: all });
        return { allAppointments: all, appointments: filtered.appointments };
      }),
      updateAppointment: (id, data) => set((state) => {
        const all = state.allAppointments.map((a) => (a.id === id ? { ...a, ...data } : a));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allAppointments: all });
        return { allAppointments: all, appointments: filtered.appointments };
      }),
      deleteAppointment: (id) => set((state) => {
        const all = state.allAppointments.filter((a) => a.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allAppointments: all });
        return { allAppointments: all, appointments: filtered.appointments };
      }),

      // Campaign Actions
      addCampaign: (campaign) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...campaign, subAccountId: subId };
        const all = [...state.allCampaigns, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allCampaigns: all });
        return { allCampaigns: all, campaigns: filtered.campaigns };
      }),
      updateCampaign: (id, data) => set((state) => {
        const all = state.allCampaigns.map((c) => (c.id === id ? { ...c, ...data } : c));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allCampaigns: all });
        return { allCampaigns: all, campaigns: filtered.campaigns };
      }),
      deleteCampaign: (id) => set((state) => {
        const all = state.allCampaigns.filter((c) => c.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allCampaigns: all });
        return { allCampaigns: all, campaigns: filtered.campaigns };
      }),

      // Workflow Actions
      addWorkflow: (workflow) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...workflow, subAccountId: subId };
        const all = [...state.allWorkflows, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWorkflows: all });
        return { allWorkflows: all, workflows: filtered.workflows };
      }),
      updateWorkflow: (id, data) => set((state) => {
        const all = state.allWorkflows.map((w) => (w.id === id ? { ...w, ...data, updatedAt: new Date() } : w));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWorkflows: all });
        return { allWorkflows: all, workflows: filtered.workflows };
      }),
      deleteWorkflow: (id) => set((state) => {
        const all = state.allWorkflows.filter((w) => w.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWorkflows: all });
        return { allWorkflows: all, workflows: filtered.workflows };
      }),
      toggleWorkflow: (id) => set((state) => {
        const all = state.allWorkflows.map((w) => (w.id === id ? { ...w, isActive: !w.isActive, updatedAt: new Date() } : w));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWorkflows: all });
        return { allWorkflows: all, workflows: filtered.workflows };
      }),

      // Funnel Actions
      addFunnel: (funnel) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...funnel, subAccountId: subId };
        const all = [...state.allFunnels, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allFunnels: all });
        return { allFunnels: all, funnels: filtered.funnels };
      }),
      updateFunnel: (id, data) => set((state) => {
        const all = state.allFunnels.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date() } : f));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allFunnels: all });
        return { allFunnels: all, funnels: filtered.funnels };
      }),
      deleteFunnel: (id) => set((state) => {
        const all = state.allFunnels.filter((f) => f.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allFunnels: all });
        return { allFunnels: all, funnels: filtered.funnels };
      }),

      // Website Actions
      addWebsite: (website) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...website, subAccountId: subId };
        const all = [...state.allWebsites, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWebsites: all });
        return { allWebsites: all, websites: filtered.websites };
      }),
      updateWebsite: (id, data) => set((state) => {
        const all = state.allWebsites.map((w) => (w.id === id ? { ...w, ...data, updatedAt: new Date() } : w));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWebsites: all });
        return { allWebsites: all, websites: filtered.websites };
      }),
      deleteWebsite: (id) => set((state) => {
        const all = state.allWebsites.filter((w) => w.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allWebsites: all });
        return { allWebsites: all, websites: filtered.websites };
      }),

      // Form Actions
      addForm: (form) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...form, subAccountId: subId };
        const all = [...state.allForms, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allForms: all });
        return { allForms: all, forms: filtered.forms };
      }),
      updateForm: (id, data) => set((state) => {
        const all = state.allForms.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date() } : f));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allForms: all });
        return { allForms: all, forms: filtered.forms };
      }),
      deleteForm: (id) => set((state) => {
        const all = state.allForms.filter((f) => f.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allForms: all });
        return { allForms: all, forms: filtered.forms };
      }),

      // Blog Actions
      addBlogPost: (post) => set((state) => {
        const subId = state.currentSubAccount?.id;
        const withSub = { ...post, subAccountId: subId };
        const all = [...state.allBlogPosts, withSub];
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allBlogPosts: all });
        return { allBlogPosts: all, blogPosts: filtered.blogPosts };
      }),
      updateBlogPost: (id, data) => set((state) => {
        const all = state.allBlogPosts.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p));
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allBlogPosts: all });
        return { allBlogPosts: all, blogPosts: filtered.blogPosts };
      }),
      deleteBlogPost: (id) => set((state) => {
        const all = state.allBlogPosts.filter((p) => p.id !== id);
        const filtered = getFilteredTenantData(state.currentSubAccount, { ...state, allBlogPosts: all });
        return { allBlogPosts: all, blogPosts: filtered.blogPosts };
      }),

      // Social Account Actions
      addSocialAccount: (account) => set((state) => ({ socialAccounts: [...state.socialAccounts, account] })),
      updateSocialAccount: (id, data) => set((state) => ({
        socialAccounts: state.socialAccounts.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })),
      removeSocialAccount: (id) => set((state) => ({ socialAccounts: state.socialAccounts.filter((s) => s.id !== id) })),

      // Notification Actions
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      })),

      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setActiveModule: (module) => set({ activeModule: module }),
      updateBrandColors: (colors) => set({ brandColors: colors }),
      updateDashboardWidgets: (widgets) => set({ dashboardWidgets: widgets }),
    }),
    {
      name: 'myvirtual-crm-storage-v2',
      partialize: (state) => ({
        brandColors: state.brandColors,
        dashboardWidgets: state.dashboardWidgets,
        currentUser: state.currentUser,
        currentSubAccount: state.currentSubAccount,
        isAuthenticated: state.isAuthenticated,
        subAccounts: state.subAccounts,
        allContacts: state.allContacts,
        allDeals: state.allDeals,
        allAppointments: state.allAppointments,
        allCampaigns: state.allCampaigns,
        allWorkflows: state.allWorkflows,
        allFunnels: state.allFunnels,
        allWebsites: state.allWebsites,
        allForms: state.allForms,
        allBlogPosts: state.allBlogPosts,
        socialAccounts: state.socialAccounts,
        allPreparers: state.allPreparers,
        allPayouts: state.allPayouts,
      }),
    }
  )
);

/* ═══════════════════════════════════════════════════════════════════
 * BACKEND MIRROR — optimistic replication of every store mutation to D1.
 * When backendMode is on, each state change is diffed against the last
 * snapshot; creates/updates are pushed as upserts, removals as deletes.
 * The first snapshot after entering backend mode is the baseline (no
 * re-upload of existing data).
 * ═══════════════════════════════════════════════════════════════════ */
let backendBaseline: Fingerprint | null = null;

useAppStore.subscribe((state, prev) => {
  if (!state.backendMode) return;
  // First transition or first observed state in backend mode → capture baseline.
  if (!backendBaseline || !prev.backendMode) {
    backendBaseline = fingerprintState(state as any);
    return;
  }
  const ops = diffFingerprints(backendBaseline, state as any);
  backendBaseline = fingerprintState(state as any);
  for (const op of ops) enqueueSync(op);
});

/** Replaces the mirror baseline (used after a manual pull/sync). */
export const resetBackendBaseline = () => { backendBaseline = null; };
