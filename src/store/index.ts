import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SubAccount, Contact, Pipeline, Deal, Appointment, Campaign, Workflow, Funnel, Website, Form, BlogPost, SocialAccount, Notification, BrandColors, DashboardWidget, Preparer, Payout } from '../types';
import { sendCapiEvent } from '../utils/meta';
import { demoSubAccounts, demoContacts, demoDeals, demoAppointments, demoPreparers } from '../data/demoSeed';
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

// ── DEMO SEED ───────────────────────────────────────────────────────────────
// The app runs on LIVE D1 data. Only 2 sample records per object are seeded
// for offline/demo mode; every other collection starts EMPTY (placeholders).
const seedSubAccounts: SubAccount[] = demoSubAccounts;
const seedContacts: Contact[] = demoContacts;
const seedDeals: Deal[] = demoDeals;
const seedAppointments: Appointment[] = demoAppointments;
const seedPreparers: Preparer[] = demoPreparers;

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
      preparers: seedPreparers,
      payouts: [],

      // Master Backing Lists (Maintains all records in absolute truth-source arrays)
      allContacts: seedContacts,
      allDeals: seedDeals,
      allAppointments: seedAppointments,
      allCampaigns: [],
      allWorkflows: [],
      allFunnels: [],
      allWebsites: [],
      allForms: [],
      allBlogPosts: [],
      allPreparers: seedPreparers,
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
