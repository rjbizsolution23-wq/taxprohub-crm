import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { useEffect } from 'react';
import { BackendBridge } from './utils/backendBridge';

// Layout Components
import AppShell from './components/layout/AppShell';
import AuthLayout from './components/layout/AuthLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ClientPortalPage from './pages/ClientPortalPage';
import CompliancePage from './pages/CompliancePage';
import SignPage from './pages/SignPage';
import SecurityPage from './pages/SecurityPage';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import PipelinesPage from './pages/PipelinesPage';
import CalendarPage from './pages/CalendarPage';
import ConversationsPage from './pages/ConversationsPage';
import CampaignsPage from './pages/CampaignsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import FunnelsPage from './pages/FunnelsPage';
import WebsitesPage from './pages/WebsitesPage';
import FormBuilder from './pages/FormBuilder';
import AIAssistant from './pages/AIAssistant';
import EmailWriter from './pages/EmailWriter';
import LeadIntelligence from './pages/LeadIntelligence';
import ContentGenerator from './pages/ContentGenerator';
// Specialized Tax Practice Operations Panel
import TaxModule from './pages/TaxModule';
// Zero-Key Document Intelligence (On-Device OCR → IRS Parse → CRM Autofill)
import DocumentIntelligence from './pages/DocumentIntelligence';
// Funnel Genie — Natural-Language Branded Funnel & Campaign Generator
import FunnelGenie from './pages/FunnelGenie';
import VideoCallPage from './pages/VideoCallPage';
import HelpCenterPage from './pages/HelpCenterPage';
import BillingPage from './pages/BillingPage';
import BlogPage from './pages/BlogPage';
import SocialPage from './pages/SocialPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import EcosystemPage from './pages/EcosystemPage';

// Preparers & Staff Pages
import PreparersPage from './pages/PreparersPage';
import PreparerDetailPage from './pages/preparers/PreparerDetailPage';

// Growth, Bank Products, Migration & Developer Platform
import NetworkPage from './pages/NetworkPage';
import BankProductsPage from './pages/BankProductsPage';
import MigrationPage from './pages/MigrationPage';
import DeveloperPage from './pages/DeveloperPage';

// Credit Repair, Lead Magnets, Integrations & Multi-Tenant Provisioning
import CreditRepairPage from './pages/CreditRepairPage';
import LeadMagnetsPage from './pages/LeadMagnetsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OnboardPage from './pages/OnboardPage';
import TenantStudioPage from './pages/TenantStudioPage';

// Sub-view Editors / Builders
import ContactDetailPage from './pages/contacts/ContactDetailPage';
import CampaignEditor from './pages/campaigns/CampaignEditor';
import WorkflowEditor from './pages/workflows/WorkflowEditor';
import FunnelBuilder from './pages/funnels/FunnelBuilder';
import WebsiteBuilder from './pages/websites/WebsiteBuilder';
import FormEditor from './pages/forms/FormEditor';
import BlogEditor from './pages/blog/BlogEditor';

function App() {
  const { isAuthenticated, currentSubAccount, brandColors } = useAppStore();

  // Apply brand colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentSubAccount?.colors || brandColors || { primary: '#D4AF37', secondary: '#111111', accent: '#FFD700' };
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    if (colors.accent) {
      root.style.setProperty('--color-accent', colors.accent);
    }
  }, [currentSubAccount, brandColors]);

  return (
    <HashRouter>
      {/* Connects the app to the Cloudflare D1 backend (falls back to demo mode) */}
      <BackendBridge />
      <Routes>
        {/* Public Marketing & Guest Routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Public self-serve signup — tax companies can onboard without logging in */}
        {/* Passwordless client portal — public, tenant-scoped by magic link */}
        <Route path="/portal" element={<ClientPortalPage />} />
        <Route path="/sign" element={<SignPage />} />

        <Route path="/signup-company" element={<div className="min-h-screen bg-slate-950"><OnboardPage /></div>} />

        {/* Protected Admin & Practice Owner Routes - Full AppShell */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Contacts Directory */}
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          
          {/* Pipeline Boards */}
          <Route path="/pipelines" element={<PipelinesPage />} />
          
          {/* Scheduling & Calendars */}
          <Route path="/calendar" element={<CalendarPage />} />
          
          {/* Unified Communications Inbox */}
          <Route path="/conversations" element={<ConversationsPage />} />
          
          {/* Analytics Hub */}
          <Route path="/analytics" element={<AnalyticsPage />} />
          
          {/* Marketing Campaigns */}
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CampaignEditor />} />
          <Route path="/campaigns/:id" element={<CampaignEditor />} />
          
          {/* Visual Automation Workflows */}
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/new" element={<WorkflowEditor />} />
          <Route path="/workflows/:id" element={<WorkflowEditor />} />
          
          {/* Funnels & Sites Route Handler (Supports redirects/aliases) */}
          <Route path="/sites" element={<Navigate to="/funnels" />} />
          <Route path="/funnels" element={<FunnelsPage />} />
          <Route path="/funnels/new" element={<FunnelBuilder />} />
          <Route path="/funnels/:id" element={<FunnelBuilder />} />
          
          <Route path="/websites" element={<WebsitesPage />} />
          <Route path="/websites/new" element={<WebsiteBuilder />} />
          <Route path="/websites/:id" element={<WebsiteBuilder />} />
          
          {/* Form Builder & Intake Designer */}
          <Route path="/forms" element={<FormBuilder />} />
          <Route path="/forms/new" element={<FormEditor />} />
          <Route path="/forms/:id" element={<FormEditor />} />
          
          {/* Editorial Blog Publisher */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/new" element={<BlogEditor />} />
          <Route path="/blog/:id" element={<BlogEditor />} />
          
          {/* Social Media Planner */}
          <Route path="/social" element={<SocialPage />} />
          
          {/* Specialized Tax Practice Operations Panel */}
          <Route path="/tax" element={<TaxModule />} />

          {/* Zero-Key Document Intelligence Center */}
          <Route path="/documents" element={<DocumentIntelligence />} />

          {/* Funnel Genie — AI Branded Funnel Generator */}
          <Route path="/genie" element={<FunnelGenie />} />

          {/* Video Consultation Suite */}
          <Route path="/video" element={<VideoCallPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/billing" element={<BillingPage />} />

          {/* Preparers & Staff */}
          <Route path="/preparers" element={<PreparersPage />} />
          <Route path="/preparers/:id" element={<PreparerDetailPage />} />

          {/* Recruiting Network & Downline Earnings Monitor */}
          <Route path="/network" element={<NetworkPage />} />

          {/* Bank Products — Refund Transfers, Advances & Bureau Overrides */}
          <Route path="/bank-products" element={<BankProductsPage />} />

          {/* Universal Migration Center — import from any tax platform */}
          <Route path="/migration" element={<MigrationPage />} />

          {/* Developer Hub — API Keys, Webhooks & Integration Docs */}
          <Route path="/developer" element={<DeveloperPage />} />

          {/* Credit Repair as a Service */}
          <Route path="/credit-repair" element={<CreditRepairPage />} />

          {/* Premium Lead Magnets Studio */}
          <Route path="/lead-magnets" element={<LeadMagnetsPage />} />

          {/* Integrations Hub — IRS keys, banks, payments, comms, everything */}
          <Route path="/integrations" element={<IntegrationsPage />} />

          {/* Self-Serve Tenant Onboarding (also public below) */}
          <Route path="/onboard" element={<OnboardPage />} />

          {/* Master Admin — No-Code Tenant Studio */}
          <Route path="/tenant-studio" element={<TenantStudioPage />} />
          
          {/* AI Copilot Suite */}
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/ai/email" element={<EmailWriter />} />
          <Route path="/ai/leads" element={<LeadIntelligence />} />
          <Route path="/ai/content" element={<ContentGenerator />} />
          
          {/* Enterprise Ecosystem Portal (40 Premium Modules) */}
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/ecosystem" element={<EcosystemPage />} />
          
          {/* Administration & Customizer Settings */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
