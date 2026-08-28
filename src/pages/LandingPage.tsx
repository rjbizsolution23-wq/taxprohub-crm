import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, Sparkles, Users, 
  Database, Calendar, Check, HelpCircle, Mail, Phone, MessageSquare,
  CreditCard, Shield, X, Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getAppConfig } from '../utils/config';
import { useAppStore } from '../store';

// Custom Intersection Observer Hook for Scroll Animations
function useIntersectionObserver() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
      }
    }, { threshold: 0.15 });

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isIntersecting] as const;
}

// Custom hook to observe scroll progress for scroll progress bar
function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollProgress;
}

// Interactive Animated Counter
interface CounterProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  trigger: boolean;
}

function AnimatedCounter({ end, duration = 1500, decimals = 0, prefix = '', suffix = '', trigger }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(easeProgress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, trigger]);

  return (
    <span className="font-mono">
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
}

// Canvas-based dynamic background for floating gold particles
function CanvasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      lifecycle: number;
      maxLifecycle: number;
    }> = [];

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: Math.random() * height + height, // Start below viewport
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.6, // Float upwards
        radius: 1 + Math.random() * 1.8,
        alpha: 0.15 + Math.random() * 0.35,
        lifecycle: 0,
        maxLifecycle: 350 + Math.random() * 550,
      };
    };

    // Initialize particles across screen
    for (let i = 0; i < 25; i++) {
      const p = createParticle();
      p.y = Math.random() * height; // Distribute at startup
      particles.push(p);
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial top gradient ambient light
      const radialGlow = ctx.createRadialGradient(
        width / 2, 0, 0,
        width / 2, 0, Math.max(width, height) * 0.65
      );
      radialGlow.addColorStop(0, 'rgba(212, 175, 55, 0.14)');
      radialGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Render & update particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifecycle++;

        let currentAlpha = p.alpha;
        if (p.lifecycle < 50) {
          currentAlpha = (p.lifecycle / 50) * p.alpha;
        } else if (p.lifecycle > p.maxLifecycle - 50) {
          currentAlpha = ((p.maxLifecycle - p.lifecycle) / 50) * p.alpha;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${currentAlpha})`;
        ctx.fill();

        // Recycle if out of bounds or old
        if (p.y < -10 || p.lifecycle >= p.maxLifecycle || p.x < -10 || p.x > width + 10) {
          particles[idx] = createParticle();
          particles[idx].y = height + 5;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full -z-10"
    />
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const config = getAppConfig();
  const { login, addSubAccount, setCurrentSubAccount } = useAppStore();

  const [activeFaq, setActiveTab] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<{name: string, price: string} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
  const [showMobileSticky, setShowMobileSticky] = useState(false);
  const [customCursor, setCustomCursor] = useState({ x: 0, y: 0, hover: false });

  // Form Fields for dynamic registration + billing
  const [cardName, setCardName] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardBusiness, setCardBusiness] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardPass, setCardPass] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [payError, setPayError] = useState('');

  // --- SQL SCHEMA INSPECTOR STATE & SCHEMAS ---
  const [selectedSchemaTable, setSelectedSchemaTable] = useState('taxpayers');

  const schemaTables = {
    'taxpayers': {
      name: 'taxpayers',
      desc: 'Stores core taxpayer details with mandatory IRC §7216 RLS policy checks.',
      ddl: `CREATE TABLE taxpayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ssn_encrypted BYTEA NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  consent_7216_signed BOOLEAN DEFAULT FALSE,
  consent_7216_date TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      rls: `ALTER TABLE taxpayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY sec_7216_consent_policy ON taxpayers
  FOR ALL TO authenticated
  USING (
    consent_7216_signed = TRUE 
    OR (SELECT auth.role() = 'tax_professional_owner')
  );`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'household_id', type: 'UUID', constraint: 'FOREIGN KEY -> households' },
        { name: 'ssn_encrypted', type: 'BYTEA', constraint: 'NOT NULL' },
        { name: 'consent_7216_signed', type: 'BOOLEAN', constraint: 'DEFAULT FALSE' }
      ]
    },
    'households': {
      name: 'households',
      desc: 'Relational households map to support multi-generational wealth & tax planning advisory.',
      ddl: `CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  primary_contact_id UUID,
  advisory_tier VARCHAR(50) CHECK (advisory_tier IN ('Standard', 'Premium_Wealth', 'Multi_Generational_Elite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      rls: `ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY household_tenant_isolation ON households
  FOR ALL TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id');`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'name', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
        { name: 'advisory_tier', type: 'VARCHAR(50)', constraint: 'CHECK constraint' }
      ]
    },
    'form_2848': {
      name: 'form_2848',
      desc: 'Power of Attorney submissions to IRS e-Services (TDS & Transcript parsing authorization).',
      ddl: `CREATE TABLE form_2848 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL CHECK (tax_year >= 2020),
  representative_caf_number VARCHAR(100) NOT NULL,
  signature_status VARCHAR(50) DEFAULT 'Pending' CHECK (signature_status IN ('Pending', 'E-Signed', 'IRS_Accepted')),
  irs_acknowledgment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      rls: `ALTER TABLE form_2848 ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_2848_security_gate ON form_2848
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM taxpayers t 
      WHERE t.id = taxpayer_id 
        AND t.consent_7216_signed = TRUE
    )
  );`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'taxpayer_id', type: 'UUID', constraint: 'FOREIGN KEY -> taxpayers' },
        { name: 'tax_year', type: 'INTEGER', constraint: 'CHECK >= 2020' },
        { name: 'signature_status', type: 'VARCHAR(50)', constraint: 'CHECK constraint' }
      ]
    },
    'transcript_requests': {
      name: 'transcript_requests',
      desc: 'High-speed TDS requests and automated OCR/XML ingestion of tax transcript datasets.',
      ddl: `CREATE TABLE transcript_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  transcript_type VARCHAR(100) CHECK (transcript_type IN ('WageAndIncome', 'Account', 'Return', 'RecordOfAccount')),
  requested_years INTEGER[] NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending_IRS_Queue', 'Completed_Parsed', 'Auth_Error')),
  parsed_r2_key VARCHAR(512),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      rls: `ALTER TABLE transcript_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY request_restrict_7216 ON transcript_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM taxpayers t 
      WHERE t.id = taxpayer_id 
        AND t.consent_7216_signed = TRUE
    )
  );`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'taxpayer_id', type: 'UUID', constraint: 'FOREIGN KEY -> taxpayers' },
        { name: 'transcript_type', type: 'VARCHAR(100)', constraint: 'CHECK constraint' },
        { name: 'requested_years', type: 'INTEGER[]', constraint: 'NOT NULL' }
      ]
    },
    'extracted_documents': {
      name: 'extracted_documents',
      desc: 'Visual cognitive OCR laser-parsed form payloads synced directly to secure Cloudflare R2 vaults.',
      ddl: `CREATE TABLE extracted_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  document_type VARCHAR(100) CHECK (document_type IN ('W2', 'Form_1099_NEC', 'Form_1099_INT', 'K1')),
  confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0.00 AND 100.00),
  raw_json_data JSONB NOT NULL,
  file_vault_url VARCHAR(512) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      rls: `ALTER TABLE extracted_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_restrict_7216 ON extracted_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM taxpayers t 
      WHERE t.id = taxpayer_id 
        AND t.consent_7216_signed = TRUE
    )
  );`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'taxpayer_id', type: 'UUID', constraint: 'FOREIGN KEY -> taxpayers' },
        { name: 'document_type', type: 'VARCHAR(100)', constraint: 'CHECK constraint' },
        { name: 'confidence_score', type: 'DECIMAL(5,2)', constraint: 'CHECK 0-100' }
      ]
    },
    'billing_gates': {
      name: 'billing_gates',
      desc: 'Rigid invoice and billing table enforcing Circular 230 §10.27 (no percentage-of-refund billing).',
      ddl: `CREATE TABLE billing_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id UUID NOT NULL REFERENCES taxpayers(id) ON DELETE CASCADE,
  invoice_amount DECIMAL(12,2) NOT NULL CHECK (invoice_amount > 0.00),
  contingent_percentage DECIMAL(5,2) CHECK (contingent_percentage IS NULL OR contingent_percentage = 0.00),
  is_refund_dependent BOOLEAN DEFAULT FALSE CHECK (is_refund_dependent = FALSE),
  billing_error_log VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enforce Circular 230 §10.27 strict barrier preventing percentage-of-refund pricing
CREATE OR REPLACE FUNCTION check_contingent_fee_restrictions() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_refund_dependent = TRUE OR NEW.contingent_percentage > 0 THEN
    RAISE EXCEPTION 'Circular 230 §10.27 Violation: Contingent or refund-dependent fee structures are strictly prohibited for original tax return preparation.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_circular_230_billing
  BEFORE INSERT OR UPDATE ON billing_gates
  FOR EACH ROW
  EXECUTE FUNCTION check_contingent_fee_restrictions();`,
      rls: `ALTER TABLE billing_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_gate_isolation ON billing_gates
  FOR ALL TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id');`,
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'invoice_amount', type: 'DECIMAL(12,2)', constraint: 'CHECK > 0.00' },
        { name: 'is_refund_dependent', type: 'BOOLEAN', constraint: 'CHECK = FALSE' },
        { name: 'contingent_percentage', type: 'DECIMAL(5,2)', constraint: 'CHECK NULL OR 0.00' }
      ]
    }
  };

  // --- TAX PRO HUB UNIVERSITY INTERACTIVE HOOKS & MODELS ---

  // 1. Connected Integrations Matrix State
  const [selectedIntegration, setSelectedIntegration] = useState('google-ads');

  // 2. 11-Stage Revenue OS Pipeline Blueprint State
  const [activePipelineTab, setActivePipelineTab] = useState(0);

  // 3. Drag-and-Drop Funnel & Site Builder Simulator State
  const [builderCanvas, setBuilderCanvas] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [deployedUrl, setDeployedUrl] = useState('');

  // 4. 180+ REST API Sandbox & Explorer State
  const [selectedApiDomain, setSelectedApiDomain] = useState('tax');
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('doc_upload');

  // 5. AI Form Parser & Cognitive OCR Laser Simulator State
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrData, setOcrData] = useState({
    ein: 'Pending scan...',
    employer: 'Pending scan...',
    wages: 'Pending scan...',
    withholding: 'Pending scan...',
    ssn: 'Pending scan...',
    employee: 'Pending scan...',
    status: 'Ready to process'
  });

  // Data lists
  const integrationData: Record<string, { name: string; desc: string; flow: string; details: string }> = {
    'google-ads': {
      name: 'Google Ads Leads',
      desc: 'Seamlessly capture high-ticket tax and representation leads. Automatically fires webhook triggers to inject leads into the CRM pipeline.',
      flow: 'User Clicks Ad ➔ Webhook ➔ CRM Contact Enriched ➔ AI Trigger Email ➔ Text Notification To Agent',
      details: 'Wired to capture UTM tracking parameters, attribution modeling, and lead value parameters automatically.'
    },
    'twilio': {
      name: 'Twilio SMS & Voice',
      desc: 'The communications engine. Routes automatic text alerts, dialer calls, and voicemail drops directly from the Unified Inbox.',
      flow: 'CRM Deal Moved ➔ Twilio API Call ➔ Multi-channel SMS Delivery ➔ Twilio Voice IVR Call Routed',
      details: '10DLC registered campaigns, automated STOP/HELP compliance, call recording with Whisper AI transcripts.'
    },
    'gmail': {
      name: 'Gmail & G-Suite Sync',
      desc: 'Bidirectional sync. Every email sent or received with a tax client updates their unified activity timeline in real-time.',
      flow: 'Client Emails Partner ➔ Gmail Webhook ➔ Timeline Logged ➔ Sentiment-analysis ➔ Auto-reply Drafted',
      details: 'SSL secure authentication, full attachments extraction, inline image preservation.'
    },
    'google-calendar': {
      name: 'Google Calendar Sync',
      desc: 'Round-robin booking slots. Let tax preparers map availability and let clients book directly into open times.',
      flow: 'Booking Link Visited ➔ Slots Calculated ➔ Appointment Confirmed ➔ Google Calendar Event Dispatched',
      details: 'Automated timezone offsets, dual-calendar conflict avoidance, custom booking question sheets.'
    },
    'stripe': {
      name: 'Stripe Billing & Invoices',
      desc: 'Monetize tax services. Issue instant retainers, monthly MRR, or customized tax preparation fee invoices.',
      flow: 'Tax Return Finalized ➔ Invoice Generated ➔ Stripe ACH/Card Link Dispatched ➔ Payment Logged to Ledger',
      details: 'PCI-compliant tokenization, automatic recurring payment retries, custom billing portal interfaces.'
    },
    'resend': {
      name: 'Resend Transactional Mail',
      desc: 'Secure transactional emailing engine. Send onboarding links, secure document codes, and automated checklists.',
      flow: 'Onboarding Requested ➔ Secure Verification Code ➔ Resend API Delivery ➔ SSL Tracking Event Registered',
      details: 'DKIM and SPF hardened domains, high-deliverability routing, custom Tailwind CSS styled templates.'
    },
    'openrouter': {
      name: 'OpenRouter Cognitive Engine',
      desc: 'Connect to elite models (Gemini Pro, GPT-4, Llama 3) without individual billing accounts. Automate drafts and analysis.',
      flow: 'W-2 Uploaded ➔ Image Matrix Extracted ➔ Llama-3 Vision Parsing ➔ Structured JSON Returned to CRM',
      details: 'Failover routing, latency protection, cost-per-token tracking across multiple workspaces.'
    },
    'click2mail': {
      name: 'Lob & Click2Mail Physical Print',
      desc: 'Direct dispatch of hard-copy IRS notices, POA requests, or formal client welcome letters directly to physical mailboxes.',
      flow: 'IRS Dispute Deal Triggered ➔ PDF Document Compiled ➔ Lob API Dispatch ➔ USPS Tracking Active',
      details: 'Automatic address verification, standard letter printing, certified delivery with proof-of-delivery receipts.'
    }
  };

  const pipelineData = [
    {
      title: 'Seasonal Tax Prep',
      desc: 'Workflow tracking client organizers, refund values, 8879 approvals, and live e-file accepted statuses.',
      cards: [
        { name: 'Arthur Pendragon', info: 'W-2 & 1099 Uploaded', refund: '$8,420', status: 'Ready to File', badge: '🟢 1040 Complex', sla: '2h remaining' },
        { name: 'Guinevere Du Lac', info: 'Form 8879 Sent', refund: '$12,150', status: 'Pending Esign', badge: '🟡 Joint Return', sla: '6h remaining' },
        { name: 'Tristan Liones', info: 'E-File Transmitted', refund: '$4,110', status: 'IRS Processing', badge: '⚡ IRS MeF Active', sla: 'Completed' }
      ]
    },
    {
      title: 'IRS CP Notice Rep',
      desc: 'High-ticket litigation boards displaying POA authorization flags, IRS CP Notice types, and dispute values.',
      cards: [
        { name: 'Merlin Ambrosius', info: 'Notice CP2000 Received', refund: 'Disputed: $24,500', status: 'POA Authorized', badge: '🔴 Audit Risk High', sla: '4d remaining' },
        { name: 'Morgan Le Fay', info: 'Appeal Response Filed', refund: 'Disputed: $84,100', status: 'IRS Reviewing', badge: '🟡 Under Appeal', sla: '12d remaining' },
        { name: 'Uther Pendragon', info: 'Case Settled (OIC)', refund: 'Settled: $3,200', status: 'Closed - Won', badge: '🟢 OIC Accepted', sla: 'Completed' }
      ]
    },
    {
      title: 'CFO Forecast',
      desc: 'Scenario planning (Best/Commit/Worst-case) with live Revenue Waterfall charts and coverage targets.',
      cards: [
        { name: 'Camelot Holdings', info: 'S-Corp Scenario Run', refund: 'Value: $480,000', status: 'Proposal Sent', badge: '⚡ Weighted 85%', sla: '1d remaining' },
        { name: 'Excalibur Capital', info: 'Q3 Tax Mitigation Plan', refund: 'Value: $1,250,000', status: 'Negotiation', badge: '🔴 Enterprise Tier', sla: '3d remaining' }
      ]
    },
    {
      title: 'Bookkeeping MRR',
      desc: 'Manage year-round recurring cleanup pipelines, software stack assignments, and cleanup complexity values.',
      cards: [
        { name: 'Gawain Logistics', info: 'QBO Audit Complete', refund: 'MRR: $1,500/mo', status: 'Active Bookkeeping', badge: '🟢 Ledger Clean', sla: '28d remaining' },
        { name: 'Percival Craft', info: 'Xero Feed Connecting', refund: 'Setup Fee: $4,500', status: 'Onboarding', badge: '🟡 12-Month Backlog', sla: '5h remaining' }
      ]
    },
    {
      title: 'Credit Repair (CROA)',
      desc: 'Strict CROA 3-day cooling window countdowns, credit score differentials, and bureau dispute tracking.',
      cards: [
        { name: 'Lancelot Robson', info: 'Dispute Letters Sent', refund: 'Score: 540 ➔ 680', status: 'Bureau Response Pending', badge: '⚡ Experian Active', sla: '14d remaining' },
        { name: 'Galahad Vance', info: 'FCRA Validation Drafted', refund: 'Score: 490 ➔ 620', status: '3-Day Cooling Window', badge: '🔴 Urgent Draft', sla: '2h remaining' }
      ]
    },
    {
      title: 'Service Bureau',
      desc: 'Manage sub-account licenses, white-label branding assets, and partner software setup packages.',
      cards: [
        { name: 'Apex Tax Partners', info: '12 Active Preparers', refund: 'Partner Revenue: $18,400', status: 'Active Reseller', badge: '🟢 White-Label Live', sla: 'Unlimited' },
        { name: 'Summit Financial', info: 'Logo & Colors Uploaded', refund: 'Partner Revenue: $5,200', status: 'Provisioning', badge: '🟡 Pending DNS', sla: '12m remaining' }
      ]
    },
    {
      title: 'Estate & Trust',
      desc: 'Comprehensive assets preservation board detailing wills, trust alignments, probate timelines, and designated asset distribution rules.',
      cards: [
        { name: 'The Pendragon Estate', info: 'Living Trust Established', refund: 'Asset Value: $4.2M', status: 'Aligned & Executed', badge: '🟢 1041 Complete', sla: 'Completed' },
        { name: 'Avalon Heritage Trust', info: 'Pour-over Will Alignment', refund: 'Asset Value: $1.8M', status: 'Draft Review', badge: '🟡 Pending Signatures', sla: '2d remaining' }
      ]
    },
    {
      title: 'Corporate Structuring',
      desc: 'S-Corp conversion pipelines, entity registrations, state franchise tax logs, and federal EIN lookup workflows.',
      cards: [
        { name: 'RoundTable Agency LLC', info: 'S-Corp Election (2553)', refund: 'Tax Savings: $14,200', status: 'State Registered', badge: '🟢 EIN Issued', sla: '1d remaining' }
      ]
    }
  ];

  const apiSandboxData: Record<string, { name: string; endpoints: Array<{ id: string; method: string; url: string; desc: string; curl: string; headers: Record<string, string>; payload: Record<string, any>; response: Record<string, any> }> }> = {
    'auth': {
      name: 'Authentication & Tenant Security',
      endpoints: [
        {
          id: 'signup',
          method: 'POST',
          url: '/api/auth/signup',
          desc: 'Provision a brand-new multi-tenant workspace & admin user, configuring local Cloudflare KV mappings.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_name": "RJ Business Solutions",
    "email": "rjbizsolution23@gmail.com",
    "password": "SecurePasswordHash123",
    "timezone": "America/Denver"
  }'`,
          headers: {
            'Content-Type': 'application/json',
            'X-Build-ID': 'NEL-20260602-847291'
          },
          payload: {
            company_name: 'RJ Business Solutions',
            email: 'rjbizsolution23@gmail.com',
            timezone: 'America/Denver'
          },
          response: {
            status: 'success',
            tenant_id: 'ten_9a8f27c3_8291',
            user: {
              id: 'usr_f1082c9e',
              email: 'rjbizsolution23@gmail.com',
              role: 'owner'
            },
            token: {
              access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
              expires_in: 900
            }
          }
        },
        {
          id: 'mfa_verify',
          method: 'POST',
          url: '/api/auth/mfa/verify',
          desc: 'Validate 6-digit cryptographic TOTP tokens for IRS-level security compliance checks.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/auth/mfa/verify \\
  -H "Authorization: Bearer eyJhbGciOiJS..." \\
  -d '{"code": "482910"}'`,
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1...',
            'Content-Type': 'application/json'
          },
          payload: {
            code: '482910'
          },
          response: {
            verified: true,
            session_id: 'ses_28a9c10f',
            ip_address: '174.56.220.10',
            location: 'Tijeras, NM'
          }
        }
      ]
    },
    'contacts': {
      name: 'Contacts & Enrichment Engine',
      endpoints: [
        {
          id: 'bulk_import',
          method: 'POST',
          url: '/api/contacts/bulk-import',
          desc: 'Push thousands of client contacts into Cloudflare Queues for asynchronous background enrichment and timeline stitching.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/contacts/bulk-import \\
  -H "Authorization: Bearer eyJhbGciOiJS..." \\
  -d '{"csv_url": "https://secure-vault.r2.dev/import.csv"}'`,
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1...',
            'Content-Type': 'application/json'
          },
          payload: {
            csv_url: 'https://secure-vault.r2.dev/import.csv'
          },
          response: {
            status: 'queued',
            job_id: 'job_8829ac81',
            expected_records: 1480,
            webhook_callback: 'https://webhook.site/callback'
          }
        }
      ]
    },
    'tax': {
      name: 'Tax Core & OCR Extraction',
      endpoints: [
        {
          id: 'doc_upload',
          method: 'POST',
          url: '/api/tax/documents/upload',
          desc: 'Direct file upload stream directly into Cloudflare R2 bucket with automated OCR triggering.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/tax/documents/upload \\
  -H "Authorization: Bearer eyJhbGciOiJS..." \\
  -F "file=@w2_form_2025.pdf" \\
  -F "contact_id=con_338a8f10"`,
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1...',
            'Content-Type': 'multipart/form-data'
          },
          payload: {
            contact_id: 'con_338a8f10',
            file: 'w2_form_2025.pdf (Binary Stream)'
          },
          response: {
            status: 'success',
            document_id: 'doc_72b8c29d',
            r2_key: 'ten_9a8f27c3_8291/contacts/con_338a8f10/w2_form_2025.pdf',
            mimetype: 'application/pdf',
            size_bytes: 498210,
            ocr_queued: true
          }
        },
        {
          id: 'taxslayer_sync',
          method: 'POST',
          url: '/api/integrations/taxslayer/sync',
          desc: 'Synchronize client tax profile data with TaxSlayer bi-directionally to check filing statuses and e-file flags.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/integrations/taxslayer/sync \\
  -H "Authorization: Bearer eyJhbGciOiJS..." \\
  -d '{"client_id": "con_338a8f10"}'`,
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1...',
            'Content-Type': 'application/json'
          },
          payload: {
            client_id: 'con_338a8f10'
          },
          response: {
            sync_status: 'completed',
            records_updated: {
              filing_status: 'Married Filing Jointly',
              dependents_count: 3,
              refund_expected: 8420.00,
              efile_status: 'ACCEPTED_BY_IRS',
              acknowledgment_date: '2026-03-15T14:22:10Z'
            }
          }
        }
      ]
    },
    'integrations': {
      name: 'Stripe, Twilio & Click2Mail Bridges',
      endpoints: [
        {
          id: 'click2mail_send',
          method: 'POST',
          url: '/api/integrations/click2mail/send',
          desc: 'Dispatches physical letters containing WORM document access codes directly to USPS mailing nodes.',
          curl: `curl -X POST https://api.taxprohubuniversity.com/v1/integrations/click2mail/send \\
  -H "Authorization: Bearer eyJhbGciOiJS..." \\
  -d '{
    "recipient_address": "1342 NM 333, Tijeras, NM 87059",
    "pdf_url": "https://secure-vault.r2.dev/notice_cp2000_appeal.pdf"
  }'`,
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1...',
            'Content-Type': 'application/json'
          },
          payload: {
            recipient_address: '1342 NM 333, Tijeras, NM 87059',
            pdf_url: 'https://secure-vault.r2.dev/notice_cp2000_appeal.pdf'
          },
          response: {
            mail_id: 'c2m_77ac2d9f_1829',
            status: 'dispatched_to_printer',
            carrier: 'USPS_CERTIFIED',
            estimated_delivery: '2026-06-05'
          }
        }
      ]
    },
    'schema': {
      name: 'Schema Inspector (PostgreSQL 17)',
      endpoints: []
    }
  };

  const builderPresetElements = [
    { id: 'intake_form', name: 'W2 Secure Intake Form', desc: 'Encrypted W-2/1099 drag-drop document field.' },
    { id: 'scheduler', name: 'Round-Robin Scheduler', desc: 'Interactive booking slot widget synchronized with CRM.' },
    { id: 'esign_pad', name: 'Form 8879 Esign Pad', desc: 'Secure digital signature element compliant with IRS Pub 4557.' },
    { id: 'video_banner', name: 'Video Hero Banner', desc: 'Full-bleed high-definition background with CTA overlays.' },
    { id: 'testimonial_wheel', name: 'Review Showcase Reel', desc: 'Rotational card carousel pulling real CRM feedback.' },
    { id: 'sms_optin', name: '10DLC Compliant Opt-in', desc: 'Lead collection banner with terms of service checkboxes.' }
  ];

  const deployStepLogs = [
    'Initializing local build wrapper inside Cloudflare Edge Worker...',
    'Fetching layout graph templates from Cloudflare D1 (tenant-scoped)...',
    'Bundling Tailwind CSS static styles and tree-shaking JSX layouts...',
    'Compressing SVG graphics and embedding secure uploader endpoints...',
    'Generating static build package in memory (Vite Static Optimizer)...',
    'Publishing static bundle to Cloudflare Pages CDN edge nodes...',
    'Configuring SSL certificate with LetsEncrypt TLS 1.3 encryption...',
    'Mapping custom subdomain DNS CNAMES on Cloudflare DNS...'
  ];

  // --- END TAX PRO HUB UNIVERSITY INTERACTIVE HOOKS & MODELS ---

  // Intersection Observers for various scroll animations
  const [problemHeaderRef, problemHeaderInView] = useIntersectionObserver();
  const [statStripRef, statStripInView] = useIntersectionObserver();
  const [howItWorksRef, howItWorksInView] = useIntersectionObserver();
  const [pillarsRef, pillarsInView] = useIntersectionObserver();
  const [liveNumbersRef, liveNumbersInView] = useIntersectionObserver();
  const [differenceRef, differenceInView] = useIntersectionObserver();
  const [pricingHeaderRef, pricingHeaderInView] = useIntersectionObserver();
  const [complianceRef, complianceInView] = useIntersectionObserver();
  const [faqHeaderRef, faqHeaderInView] = useIntersectionObserver();
  const [finalCtaRef, finalCtaInView] = useIntersectionObserver();

  const scrollProgress = useScrollProgress();

  // Scroll handler for mobile sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20 && !hasShownExitIntent) {
        setShowExitIntent(true);
        setHasShownExitIntent(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShownExitIntent]);

  // Custom cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCustomCursor(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleHoverStart = () => setCustomCursor(prev => ({ ...prev, hover: true }));
    const handleHoverEnd = () => setCustomCursor(prev => ({ ...prev, hover: false }));

    window.addEventListener('mousemove', handleMouseMove);
    
    const interactives = document.querySelectorAll('button, a, input, select, textarea');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', handleHoverStart);
      el.addEventListener('mouseleave', handleHoverEnd);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverStart);
        el.removeEventListener('mouseleave', handleHoverEnd);
      });
    };
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardCvc(val);
  };

  const handlePlanSelection = (planName: string, planPrice: string) => {
    if (planPrice === 'Free') {
      navigate('/signup?plan=Starter');
      return;
    }

    if (planName.toLowerCase().includes('pro')) {
      if (config.stripeProLink) {
        window.location.href = config.stripeProLink;
        return;
      }
    } else if (planName.toLowerCase().includes('enterprise')) {
      if (config.stripeEnterpriseLink) {
        window.location.href = config.stripeEnterpriseLink;
        return;
      }
    }

    setCheckoutPlan({ name: planName, price: planPrice });
    setModalOpen(true);
    setPaySuccess(false);
    setIsPaying(false);
    setPayError('');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!cardName || !cardEmail || !cardBusiness || !cardPass || !cardNumber || !cardExpiry || !cardCvc) {
      setPayError('All billing and registration fields are required.');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setPayError('Invalid card number length.');
      return;
    }

    if (!cardExpiry.includes('/')) {
      setPayError('Invalid expiration date format (MM/YY).');
      return;
    }

    setIsPaying(true);

    // Simulate Stripe Gateway Handshake
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsPaying(false);
    setPaySuccess(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const user = {
      id: `user-${Date.now()}`,
      email: cardEmail,
      name: cardName,
      role: 'admin' as const,
      createdAt: new Date(),
    };

    const newAccount = {
      id: `sub-${Date.now()}`,
      name: cardBusiness,
      businessName: cardBusiness,
      businessAddress: '1342 NM 333, Tijeras, New Mexico 87059',
      email: cardEmail,
      phone: cardPhone || '+1 (414) 430-4277',
      colors: {
        primary: '#D4AF37',
        secondary: '#111111',
        accent: '#FFD700',
        background: '#000000',
        text: '#E8E8E8',
      },
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addSubAccount(newAccount);
    setCurrentSubAccount(newAccount);
    login(user);

    navigate('/dashboard');
  };

  const toggleFaq = (index: number) => {
    setActiveTab(activeFaq === index ? null : index);
  };

  const features = [
    { title: 'TaxSlayer Sync', desc: 'Real-time bidirectional synchronization with TaxSlayer database integrations.', icon: ShieldCheck },
    { title: 'AI Assistant', desc: 'Draft tax season reminder newsletters, auto-summarize filings, and prioritize high-value client leads.', icon: Sparkles },
    { title: 'Unified Inbox', desc: 'Combine client SMS, emails, WhatsApp, and Facebook Messenger inside one unified feed.', icon: MessageSquare },
    { title: 'Drag & Drop Funnels', desc: 'Generate landing pages, intake widgets, and conversion flows.', icon: Globe },
    { title: 'Smart Pipelines', desc: 'Visual stages tracking client filings from new lead to closed returns.', icon: Users },
    { title: 'Visual Automations', desc: 'Connect form triggers, automated SMS updates, and custom status alerts.', icon: Zap },
    { title: 'Document Vault', desc: 'Secure uploader tied with Cloudflare R2 bucket S3 configurations.', icon: Database },
    { title: 'Client Calendars', desc: 'Round-robin booking calendars with smart notification buffers.', icon: Calendar },
    { title: 'Physical Postmaster', desc: 'Generate Click2Mail letters, audit representations, and physical notices directly.', icon: Mail },
    { title: 'Form Submissions', desc: 'Interactive form designer with file upload and digital signatures.', icon: Check },
    { title: 'Sub-Accounts', desc: 'White-label resale system to manage separate client organizations.', icon: Users },
    { title: 'Security Pro', desc: 'Enterprise-grade encryption, role permissions, and full audit logs.', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#E8E8E8] selection:bg-[#D4AF37] selection:text-black relative overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🚀 Custom Style Injections */}
      <style>{`
        /* Elite Brand Styles */
        .playfair-heading {
          font-family: 'Playfair Display', serif;
        }
        .gold-foil-text {
          background: linear-gradient(110deg, #F4E5B0 0%, #FFD700 25%, #D4AF37 50%, #FFD700 75%, #F4E5B0 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .gold-btn-gradient {
          background: linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%);
        }

        /* Custom Scrolling styling for API console */
        .console-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .console-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .console-scroll::-webkit-scrollbar-thumb {
          background: rgba(212,175,55,0.25);
          border-radius: 4px;
        }
        .console-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(212,175,55,0.45);
        }

        /* Golden Laser Sweep effect */
        @keyframes laser-sweep-anim {
          0% { top: 0%; opacity: 0.2; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0.2; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #FFD700, #D4AF37, #FFD700, transparent);
          box-shadow: 0 0 12px #FFD700, 0 0 4px #D4AF37;
          animation: laser-sweep-anim 3.5s infinite ease-in-out;
          pointer-events: none;
        }

        /* SVG flow pulse */
        @keyframes flow-pulse {
          0% { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }
        .flow-path-pulse {
          stroke-dasharray: 6 4;
          animation: flow-pulse 8s infinite linear;
        }

        /* Glass card definitions */
        .glass-card {
          background: rgba(14, 14, 14, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .glass-card-gold {
          background: rgba(14, 14, 14, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.25);
        }
        
        /* Shimmer Animation */
        @keyframes shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-active {
          position: relative;
          overflow: hidden;
        }
        .shimmer-active::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,215,0,0.3) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer-sweep 4s infinite linear;
          pointer-events: none;
        }
        .shimmer-hover:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,215,0,0.4) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer-sweep 1.2s ease-out;
          pointer-events: none;
        }

        /* Ambient background glow pulsing */
        @keyframes radial-pulse {
          0%, 100% { opacity: 0.8; transform: translate(-50%, -20%) scale(1); }
          50% { opacity: 1.0; transform: translate(-50%, -20%) scale(1.08); }
        }
        .glow-pulse {
          animation: radial-pulse 4s ease-in-out infinite;
        }

        /* Conic Border Variables and Keyframes */
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-border {
          0% { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        .conic-glow-card {
          position: relative;
          border-radius: 24px;
        }
        .conic-glow-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          background: conic-gradient(from var(--angle), #D4AF37, #FFD700, #B8860B, #D4AF37);
          animation: rotate-border 6s linear infinite;
          z-index: 1;
        }
        .conic-glow-card-inner {
          position: relative;
          background: #0a0a0a;
          border-radius: 22px;
          z-index: 2;
          height: calc(100% - 4px);
        }

        /* SVG drawing path animations on intersection */
        @keyframes draw-path {
          to { stroke-dashoffset: 0; }
        }
        .draw-svg path, .draw-svg line, .draw-svg polyline, .draw-svg rect, .draw-svg circle {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: draw-path 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* 🔴 Custom Cursor (desktop only) */}
      <div 
        className="hidden md:block fixed pointer-events-none z-[9999] rounded-full transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${customCursor.x}px`,
          top: `${customCursor.y}px`,
          width: customCursor.hover ? '48px' : '32px',
          height: customCursor.hover ? '48px' : '32px',
          border: '1.5px solid #D4AF37',
          backgroundColor: customCursor.hover ? 'rgba(212,175,55,0.08)' : 'transparent',
          transform: `translate(-50%, -50%) scale(${customCursor.hover ? 1.2 : 1})`,
          boxShadow: customCursor.hover ? '0 0 15px rgba(212,175,55,0.25)' : 'none'
        }}
      >
        <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* 📊 Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B] z-[100] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      {/* 🧭 Navigation Topbar */}
      <nav className="border-b border-white/5 bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center relative group overflow-hidden">
            <span className="playfair-heading font-black text-[#D4AF37] text-base group-hover:scale-110 transition-transform">M</span>
            <div className="absolute inset-0 border border-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 shadow-[0_0_8px_#D4AF37]"></div>
          </div>
          <div>
            <div className="playfair-heading font-extrabold text-2xl tracking-tighter gold-foil-text leading-none">MYVIRTUAL</div>
            <div className="text-[10px] text-[#D4AF37]/70 mt-1 uppercase font-semibold tracking-[0.25em]" style={{ letterSpacing: '0.25em' }}>TAX PROFESSIONAL PLATFORM</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="px-6 py-2.5 gold-btn-gradient text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#D4AF37]/15 hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5 cursor-pointer shimmer-hover"
          >
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* 🌌 Hero Section */}
      <header className="relative px-6 lg:px-12 py-24 lg:py-36 overflow-hidden flex flex-col items-center text-center">
        {/* Particle and Glow Layer */}
        <CanvasParticles />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#D4AF37]/15 to-transparent blur-[120px] rounded-full -z-20 glow-pulse"></div>
        
        {/* SVG Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none -z-15" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}></div>

        {/* Shimmering Badge */}
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/8 border border-[#D4AF37]/30 rounded-full px-5 py-2 text-xs font-semibold mb-8 select-none text-[#D4AF37] tracking-[0.15em] shimmer-active">
          <span>✦ TAX YEAR 2026 · TRUSTED BY 1,247+ TAX PROS</span>
        </div>
        
        {/* Animated Headline */}
        <h1 className="playfair-heading text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight max-w-5xl text-white leading-[1.05] pb-2 transition-all duration-700">
          The All-In-One CRM Built for <span className="gold-foil-text font-black">Tax Professionals</span>
        </h1>
        
        <p className="mt-8 text-[#B8B8B8] text-lg md:text-xl max-w-2xl leading-relaxed">
          Supercharge your tax agency with automated client intake, direct TaxSlayer pipeline sync, AI-powered document parsing, and physical letter dispatch.
        </p>
        
        {/* Dual CTA Button Cluster */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 z-10">
          <button 
            onClick={() => navigate('/signup')} 
            className="px-8 py-4.5 gold-btn-gradient hover:scale-[1.03] text-black font-bold rounded-lg flex items-center gap-3 shadow-xl shadow-[#D4AF37]/20 transition-all cursor-pointer shimmer-hover"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="px-8 py-4.5 bg-white/[0.04] border border-[#D4AF37]/35 text-white font-semibold rounded-lg transition-all backdrop-blur-md hover:border-[#D4AF37] hover:bg-white/[0.08] cursor-pointer"
          >
            Access Dashboard
          </button>
        </div>

        {/* Minimalist Trust Strip */}
        <p className="mt-14 text-xs text-[#888888] font-medium flex flex-wrap justify-center items-center gap-3">
          <span>★★★★★ 4.9/5</span>
          <span className="text-[#D4AF37]">•</span>
          <span>No credit card required</span>
          <span className="text-[#D4AF37]">•</span>
          <span>SOC 2 Type II</span>
          <span className="text-[#D4AF37]">•</span>
          <span>IRS Pub 4557</span>
        </p>
      </header>

      {/* ⚠️ Problem / Pain Grid */}
      <section ref={problemHeaderRef} className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          {/* Custom Section Header Format */}
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ THE CHAOTIC TRUTH</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Why Traditional CRMs Fall Short for Tax Practices
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Tax practices operate on secure document tracking, IRS timelines, and tax software filings. Generic CRMs leave you copy-pasting SSNs, chasing down clients for missing W-2s, and running in circles during peak filing season.
            </p>
          </div>

          {/* Above Grid Stat Strip with dynamic counter */}
          <div ref={statStripRef} className="bg-[#141414]/50 border border-[#D4AF37]/15 rounded-2xl p-6 text-center mb-12 select-none">
            <p className="text-lg font-medium text-[#E8E8E8]">
              Tax pros lose <span className="playfair-heading font-extrabold text-2xl md:text-3xl gold-foil-text ml-1 mr-1">
                <AnimatedCounter end={14} trigger={statStripInView} /> hours per week
              </span> to manual administrative work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-[#141414]/45 border border-[#D4AF37]/12 rounded-2xl relative overflow-hidden group hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-[10px] border-t-[#D4AF37] border-r-[#D4AF37]"></div>
              <div className={`w-10 h-10 text-[#D4AF37] mb-4 ${problemHeaderInView ? 'draw-svg' : ''}`}>
                <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                  <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h3 className="font-bold text-[#D4AF37] text-lg mb-3">Stale Pipelines</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">Chasing clients manually via phone calls to verify return status and refund amounts is highly inefficient.</p>
            </div>

            <div className="p-8 bg-[#141414]/45 border border-[#D4AF37]/12 rounded-2xl relative overflow-hidden group hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-[10px] border-t-[#D4AF37] border-r-[#D4AF37]"></div>
              <div className={`w-10 h-10 text-[#D4AF37] mb-4 ${problemHeaderInView ? 'draw-svg' : ''}`}>
                <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="font-bold text-[#D4AF37] text-lg mb-3">Scattered Files</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">Document uploads spread across messy email chains, physical papers, and insecure drive files.</p>
            </div>

            <div className="p-8 bg-[#141414]/45 border border-[#D4AF37]/12 rounded-2xl relative overflow-hidden group hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-[10px] border-t-[#D4AF37] border-r-[#D4AF37]"></div>
              <div className={`w-10 h-10 text-[#D4AF37] mb-4 ${problemHeaderInView ? 'draw-svg' : ''}`}>
                <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                </svg>
              </div>
              <h3 className="font-bold text-[#D4AF37] text-lg mb-3">Disconnected AI</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">Generative tools that do not understand tax rules, IRS forms, or active customer profiles.</p>
            </div>

            <div className="p-8 bg-[#141414]/45 border border-[#D4AF37]/12 rounded-2xl relative overflow-hidden group hover:border-[#D4AF37]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-[10px] border-t-[#D4AF37] border-r-[#D4AF37]"></div>
              <div className={`w-10 h-10 text-[#D4AF37] mb-4 ${problemHeaderInView ? 'draw-svg' : ''}`}>
                <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className="font-bold text-[#D4AF37] text-lg mb-3">No Post Bridge</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">Inability to easily generate and dispatch formal IRS letters directly to physical paper mail.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ⚙️ "HOW IT WORKS" Section */}
      <section ref={howItWorksRef} className="px-6 lg:px-12 py-24 bg-[#000000] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ HOW IT WORKS</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Seamless Deployment Timeline
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Integrate, deploy, and scale in three straightforward steps built for modern enterprise firms.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {/* Timeline connector line */}
            <div className="hidden md:block absolute top-[70px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent -z-10"></div>
            
            <div className="text-center flex flex-col items-center">
              <div className="playfair-heading text-7xl md:text-8xl font-black gold-foil-text leading-none select-none mb-6">01</div>
              <h3 className="text-xl font-bold text-white mb-3">CONNECT</h3>
              <p className="text-sm text-[#B8B8B8] max-w-xs leading-relaxed">
                Plug in TaxSlayer, import client contacts, and instantly brand the platform.
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="playfair-heading text-7xl md:text-8xl font-black gold-foil-text leading-none select-none mb-6">02</div>
              <h3 className="text-xl font-bold text-white mb-3">AUTOMATE</h3>
              <p className="text-sm text-[#B8B8B8] max-w-xs leading-relaxed">
                AI parses W2/1099 docs, constructs automated communication streams, and updates pipelines.
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="playfair-heading text-7xl md:text-8xl font-black gold-foil-text leading-none select-none mb-6">03</div>
              <h3 className="text-xl font-bold text-white mb-3">SCALE</h3>
              <p className="text-sm text-[#B8B8B8] max-w-xs leading-relaxed">
                Resell custom sub-accounts, white-label client instances, and maximize tax agency yield.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🧱 Core Pillars Section */}
      <section ref={pillarsRef} className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ THE SOLUTION</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              The Three Pillars of Modern Tax Operations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#141414]/50 border border-[#D4AF37]/12 rounded-2xl p-8 hover:border-[#D4AF37]/45 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#D4AF37]/8 rounded-lg flex items-center justify-center text-[#D4AF37] mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="playfair-heading text-2xl font-bold text-white mb-3">Unified CRM Module</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Consolidate full demographic tax profiles, custom SSN fields, dependents data, and historical return histories in a unified dashboard sync.
              </p>
            </div>
            
            <div className="bg-[#141414]/50 border border-[#D4AF37]/12 rounded-2xl p-8 hover:border-[#D4AF37]/45 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#D4AF37]/8 rounded-lg flex items-center justify-center text-[#D4AF37] mb-6">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="playfair-heading text-2xl font-bold text-white mb-3">Intake Funnels & Sites</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Build stunning tax prep landing sites, scheduler links, and secure intake portals to collect client files directly on autopilot.
              </p>
            </div>

            <div className="bg-[#141414]/50 border border-[#D4AF37]/12 rounded-2xl p-8 hover:border-[#D4AF37]/45 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#D4AF37]/8 rounded-lg flex items-center justify-center text-[#D4AF37] mb-6">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="playfair-heading text-2xl font-bold text-white mb-3">Cognitive AI Intelligence</h3>
              <p className="text-sm text-[#B8B8B8] leading-relaxed">
                Automated document OCR reads tax forms directly, pulls federal totals into active client profiles, and drafts instant response copy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 LIVE NUMBERS Strip */}
      <section ref={liveNumbersRef} className="px-6 py-16 bg-[#000000] border-b border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 items-center text-center">
          <div className="flex flex-col">
            <span className="font-extrabold text-3xl md:text-4xl gold-foil-text font-mono">
              <AnimatedCounter end={1247} trigger={liveNumbersInView} />
            </span>
            <span className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mt-2">Tax Pros</span>
          </div>
          
          <div className="hidden md:block w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/30 via-transparent to-transparent mx-auto"></div>

          <div className="flex flex-col">
            <span className="font-extrabold text-3xl md:text-4xl gold-foil-text font-mono">
              <AnimatedCounter end={847} trigger={liveNumbersInView} prefix="$" suffix="M" />
            </span>
            <span className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mt-2">Refunds Processed</span>
          </div>

          <div className="hidden md:block w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/30 via-transparent to-transparent mx-auto"></div>

          <div className="flex flex-col">
            <span className="font-extrabold text-3xl md:text-4xl gold-foil-text font-mono">
              <AnimatedCounter end={2.3} trigger={liveNumbersInView} decimals={1} suffix="M" />
            </span>
            <span className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mt-2">Docs Parsed</span>
          </div>

          <div className="hidden md:block w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/30 via-transparent to-transparent mx-auto"></div>

          <div className="flex flex-col">
            <span className="font-extrabold text-3xl md:text-4xl gold-foil-text font-mono">
              <AnimatedCounter end={99.97} trigger={liveNumbersInView} decimals={2} suffix="%" />
            </span>
            <span className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mt-2">Uptime</span>
          </div>

          <div className="hidden md:block w-[1px] h-12 bg-gradient-to-b from-[#D4AF37]/30 via-transparent to-transparent mx-auto"></div>

          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="font-extrabold text-3xl md:text-4xl gold-foil-text font-mono">
              <AnimatedCounter end={4.9} trigger={liveNumbersInView} decimals={1} suffix="★" />
            </span>
            <span className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mt-2">Average Rating</span>
          </div>
        </div>
      </section>

      {/* 🏆 Testimonials / Social Proof */}
      <section className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ PARTNER TRUST</div>
            <h2 className="playfair-heading text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Endorsed by Top-Tier Agencies
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#141414]/50 border border-white/5 rounded-2xl flex flex-col justify-between">
              <p className="text-[#B8B8B8] text-sm leading-relaxed italic mb-8">
                "We synced over 1,200 clients this tax season. Having the uploader, scheduling calendars, SMS reminders, and TaxSlayer status in one dashboard saved us hundreds of hours."
              </p>
              <div>
                <h4 className="font-bold text-white text-sm">Marcus Vance, CPA</h4>
                <p className="text-[10px] text-[#888888] mt-1 font-semibold uppercase tracking-wider">Managing Partner, Vance Tax Group</p>
              </div>
            </div>

            <div className="p-8 bg-[#141414]/50 border border-[#D4AF37]/25 rounded-2xl flex flex-col justify-between relative shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <span className="absolute -top-3 right-6 px-2.5 py-1 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-[8px] rounded-full">PINACLE PARTNER</span>
              <p className="text-[#B8B8B8] text-sm leading-relaxed italic mb-8">
                "Our client onboarding conversion jumped 24%. Clients love the simple mobile intake forms, and the AI OCR parsed W2/1099s accurately directly into the tax profile."
              </p>
              <div>
                <h4 className="font-bold text-white text-sm">Samantha Rivers</h4>
                <p className="text-[10px] text-[#888888] mt-1 font-semibold uppercase tracking-wider">Director, Rivers & Associates LLC</p>
              </div>
            </div>

            <div className="p-8 bg-[#141414]/50 border border-white/5 rounded-2xl flex flex-col justify-between">
              <p className="text-[#B8B8B8] text-sm leading-relaxed italic mb-8">
                "The Click2Mail physical mail bridge is a game changer. We generated and mailed formal letters directly to client houses with a single trigger button."
              </p>
              <div>
                <h4 className="font-bold text-white text-sm">Aris Thorne</h4>
                <p className="text-[10px] text-[#888888] mt-1 font-semibold uppercase tracking-wider">Tax Professional, Thorne Financial</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-35 mt-16 grayscale">
            <span className="text-sm font-bold tracking-[0.2em] font-mono">TAXSLAYER PRO</span>
            <span className="text-sm font-bold tracking-[0.2em] font-mono">TWILIO GATEWAY</span>
            <span className="text-sm font-bold tracking-[0.2em] font-mono">CLOUDFLARE R2</span>
            <span className="text-sm font-bold tracking-[0.2em] font-mono">STRIPE ENCRYPTED</span>
          </div>
        </div>
      </section>

      {/* ⚖️ THE MYVIRTUAL DIFFERENCE Matrix */}
      <section ref={differenceRef} className="px-6 lg:px-12 py-24 bg-[#000000] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ MARKET ADVANTAGE</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              The Tax Pro Hub University Difference
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Compare architectural modules side-by-side with leading generalist and tax-specific CRMs.
            </p>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-6 text-sm font-semibold uppercase text-slate-400">Capabilities</th>
                  <th className="p-6 text-sm font-bold uppercase text-[#D4AF37] bg-[#D4AF37]/5 relative">
                    Tax Pro Hub University
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D4AF37]"></div>
                  </th>
                  <th className="p-6 text-sm font-semibold uppercase text-slate-500">GoHighLevel</th>
                  <th className="p-6 text-sm font-semibold uppercase text-slate-500">Drake</th>
                  <th className="p-6 text-sm font-semibold uppercase text-slate-500">TaxWiz</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">TaxSlayer Native Integration</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">AI Document Parsing (W2/1099)</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">Click2Mail Physical Dispatch</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">IRS Pub 4557 Compliance</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">White-Label Sub-Accounts</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">Multi-Tenant SaaS Arch</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-6 text-sm font-medium text-slate-300">Year-Round Tax Agent Support</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-slate-300">24/7 Priority Hotline</td>
                  <td className="p-6 bg-[#D4AF37]/5"><Check className="h-4 w-4 text-[#D4AF37]" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                  <td className="p-6 text-slate-600"><X className="h-4 w-4" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 1: THE INTEGRATION CONNECTION MATRIX */}
      <section className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#D4AF37]/5 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ CENTRAL HUB</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              The Integration <span className="gold-foil-text font-black">Connection Matrix</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Every system is linked. Click an integration below to see how customer touchpoints trigger fully automated downstream workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side: Interactive Buttons */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {Object.keys(integrationData).map((key) => {
                const isActive = selectedIntegration === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedIntegration(key)}
                    className={`p-6 rounded-2xl text-left transition-all duration-300 ${
                      isActive
                        ? 'bg-[#D4AF37]/10 border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                        : 'bg-[#141414]/40 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-slate-400 bg-white/5'}`}>
                        {key === 'stripe' ? <CreditCard className="h-4 w-4" /> :
                         key === 'google-calendar' ? <Calendar className="h-4 w-4" /> :
                         key === 'gmail' || key === 'resend' ? <Mail className="h-4 w-4" /> :
                         key === 'twilio' ? <Phone className="h-4 w-4" /> :
                         key === 'openrouter' ? <Sparkles className="h-4 w-4" /> :
                         key === 'google-ads' ? <Zap className="h-4 w-4" /> :
                         <Globe className="h-4 w-4" />}
                      </div>
                    </div>
                    <h4 className="mt-4 font-bold text-white text-sm">{integrationData[key].name}</h4>
                    <p className="mt-2 text-[10px] text-slate-500 leading-normal line-clamp-1">{integrationData[key].desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Right side: Dynamic Visual Map */}
            <div className="lg:col-span-7 p-8 bg-[#141414]/40 border border-white/5 rounded-3xl relative">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">✦ LIVE WORKFLOW DIAGRAM</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[8px] uppercase tracking-wider font-bold">🟢 SYNCD</span>
              </div>

              {/* Dynamic Path SVG */}
              <div className="w-full h-44 flex items-center justify-between px-6 relative mb-8">
                {/* SVG Connecting Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background Path */}
                  <path d="M 50,88 Q 150,20 280,88 T 520,88" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  {/* Pulsing Connected Path */}
                  <path
                    d="M 50,88 Q 150,20 280,88 T 520,88"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2"
                    className="flow-path-pulse"
                    style={{ filter: 'drop-shadow(0 0 4px #D4AF37)' }}
                  />
                </svg>

                {/* Left Node: Source */}
                <div className="z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] relative">
                    {selectedIntegration === 'stripe' ? <CreditCard className="h-6 w-6 animate-pulse" /> :
                     selectedIntegration === 'google-calendar' ? <Calendar className="h-6 w-6 animate-pulse" /> :
                     selectedIntegration === 'gmail' || selectedIntegration === 'resend' ? <Mail className="h-6 w-6 animate-pulse" /> :
                     selectedIntegration === 'twilio' ? <Phone className="h-6 w-6 animate-pulse" /> :
                     selectedIntegration === 'openrouter' ? <Sparkles className="h-6 w-6 animate-pulse" /> :
                     selectedIntegration === 'google-ads' ? <Zap className="h-6 w-6 animate-pulse" /> :
                     <Globe className="h-6 w-6 animate-pulse" />}
                    <div className="absolute -bottom-1 px-1.5 py-0.5 bg-black text-[8px] border border-white/10 rounded-full font-bold">SOURCE</div>
                  </div>
                  <span className="mt-3 text-[10px] text-[#B8B8B8] font-bold text-center w-24 truncate">{integrationData[selectedIntegration].name}</span>
                </div>

                {/* Center Node: CRM Core */}
                <div className="z-10 flex flex-col items-center">
                  <div className="w-18 h-14 rounded-2xl bg-black border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] relative shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <Database className="h-6 w-6" />
                    <div className="absolute -bottom-1 px-1.5 py-0.5 bg-black text-[8px] border border-[#D4AF37] rounded-full font-bold text-xs">CRM OS</div>
                  </div>
                  <span className="mt-3 text-[10px] text-white font-black text-center">Tax Pro Hub University Core</span>
                </div>

                {/* Right Node: Downstream Output */}
                <div className="z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 relative">
                    <Zap className="h-6 w-6" />
                    <div className="absolute -bottom-1 px-1.5 py-0.5 bg-black text-[8px] border border-white/10 rounded-full font-bold">ACTION</div>
                  </div>
                  <span className="mt-3 text-[10px] text-[#B8B8B8] font-bold text-center">Auto-execution</span>
                </div>
              </div>

              {/* Integration Specs Description */}
              <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                <h5 className="font-bold text-white text-sm mb-2">{integrationData[selectedIntegration].name} Orchestrator</h5>
                <div className="flex items-center gap-2 mb-4 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 overflow-hidden">
                  <span className="text-[10px] text-[#D4AF37] font-mono font-bold shrink-0">FLOW:</span>
                  <span className="text-[9px] text-[#B8B8B8] font-mono leading-none truncate">{integrationData[selectedIntegration].flow}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-1">{integrationData[selectedIntegration].desc}</p>
                <p className="text-[10px] text-[#888888] font-semibold italic">{integrationData[selectedIntegration].details}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 2: INTERACTIVE 11-STAGE REVENUE OS PIPELINE BLUEPRINT */}
      <section className="px-6 lg:px-12 py-24 bg-[#000000] relative border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ REVENUE PIPELINES</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              The 11-Stage Tax Practice <span className="gold-foil-text font-black">Revenue OS</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Experience the customized preconfigured pipelines that track seasonal filing complexity, IRS representation disputes, S-Corp write-offs, and credit repairs.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-12 max-w-4xl mx-auto">
            {pipelineData.map((pipe, idx) => (
              <button
                key={idx}
                onClick={() => setActivePipelineTab(idx)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all duration-200 ${
                  activePipelineTab === idx
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-[#141414]/30 text-slate-400 border-white/5 hover:border-white/10'
                }`}
              >
                {pipe.title}
              </button>
            ))}
          </div>

          {/* Active Kanban Column Mockup */}
          <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="playfair-heading text-xl font-bold text-white mb-2">{pipelineData[activePipelineTab].title} Pipeline</h3>
                <p className="text-xs text-[#B8B8B8] max-w-xl">{pipelineData[activePipelineTab].desc}</p>
              </div>
              <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold tracking-wider rounded-lg uppercase">
                {pipelineData[activePipelineTab].cards.length} Deals Active
              </span>
            </div>

            {/* Columns simulation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pipelineData[activePipelineTab].cards.map((card, idx) => (
                <div key={idx} className="p-6 bg-[#141414]/50 border border-white/5 hover:border-[#D4AF37]/25 transition-all duration-300 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-bl-full"></div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black text-white">{card.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[#D4AF37] font-bold font-mono">{card.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">💼 <span className="font-mono">{card.info}</span></p>
                    <p className="text-[11px] text-[#A8A8A8] mt-1">💰 Revenue/Value: <span className="text-[#D4AF37] font-bold font-mono">{card.refund}</span></p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.status}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      card.sla === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    }`}>{card.sla}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 3: DRAG-AND-DROP FUNNEL & SITE BUILDER SIMULATOR */}
      <section className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ DRAG & DROP ENGINE</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Website & Funnel <span className="gold-foil-text font-black">Visual Builder</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Design high-converting client intake pages on our visual edge network. Add elements to your pipeline canvas, then trigger an instant deployment compile to Cloudflare Pages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left side: Components Palette */}
            <div className="lg:col-span-5 p-8 bg-[#141414]/40 border border-white/5 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="playfair-heading text-lg font-bold text-white mb-6">Components Palette</h3>
                <p className="text-xs text-[#A8A8A8] mb-6">Click preset components below to add them to your responsive canvas layout.</p>
                
                <div className="space-y-3">
                  {builderPresetElements.map((elem) => (
                    <button
                      key={elem.id}
                      onClick={() => {
                        if (isDeploying) return;
                        setBuilderCanvas(prev => [...prev, elem.name]);
                        setDeployedUrl('');
                      }}
                      className="w-full p-4 bg-black/40 border border-white/5 rounded-xl hover:border-[#D4AF37]/30 transition-all text-left flex items-start gap-3 group"
                    >
                      <span className="w-5 h-5 bg-[#D4AF37]/10 text-[#D4AF37] rounded flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">+</span>
                      <div>
                        <h4 className="font-bold text-white text-xs">{elem.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">{elem.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {builderCanvas.length > 0 && (
                <button
                  onClick={() => {
                    setBuilderCanvas([]);
                    setDeployedUrl('');
                    setDeployStep(0);
                  }}
                  className="mt-6 w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-white rounded-lg"
                >
                  Reset Workspace Canvas
                </button>
              )}
            </div>

            {/* Right side: Live Canvas */}
            <div className="lg:col-span-7 p-8 bg-[#141414]/40 border border-[#D4AF37]/15 rounded-3xl flex flex-col justify-between relative shadow-[0_0_20px_rgba(212,175,55,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">✦ LIVE EDGE BUILD CANVAS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span className="text-[9px] text-[#B8B8B8] font-mono">D1 Sandbox Context</span>
                  </div>
                </div>

                <div className="min-h-[220px] p-6 border border-dashed border-white/10 rounded-2xl bg-black/40 flex flex-col gap-3 justify-center">
                  {builderCanvas.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-500 font-bold">Your Visual Canvas is Empty</p>
                      <p className="text-[10px] text-[#888888] mt-2 max-w-xs mx-auto">Click components from the palette on the left to stack modules inside your Cloudflare-backed CRM site.</p>
                    </div>
                  ) : (
                    builderCanvas.map((item, index) => (
                      <div key={index} className="p-4 bg-[#141414]/70 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-mono">[{index + 1}]</span>
                          <span className="text-xs font-bold text-white">{item}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (isDeploying) return;
                            setBuilderCanvas(prev => prev.filter((_, i) => i !== index));
                            setDeployedUrl('');
                          }}
                          className="text-[10px] text-red-400 hover:text-red-500 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cloudflare Pages Deployer Container */}
              {builderCanvas.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  {!isDeploying && !deployedUrl ? (
                    <button
                      onClick={() => {
                        setIsDeploying(true);
                        setDeployStep(0);
                        const interval = setInterval(() => {
                          setDeployStep(prev => {
                            if (prev >= deployStepLogs.length - 1) {
                              clearInterval(interval);
                              setDeployedUrl('https://myfirm.myvirtualtaxpro.pages.dev');
                              setIsDeploying(false);
                              return deployStepLogs.length - 1;
                            }
                            return prev + 1;
                          });
                        }, 800);
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] hover:from-[#FFE44D] hover:to-[#E5C158] transition-all text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span>Deploy Layout to Cloudflare Pages</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : isDeploying ? (
                    <div className="p-4 bg-black/60 border border-[#D4AF37]/20 rounded-2xl font-mono text-[10px]">
                      <div className="flex items-center gap-2 text-white mb-2">
                        <Loader2 className="h-4 w-4 text-[#D4AF37] animate-spin" />
                        <span className="font-bold text-[#D4AF37]">Running Cloudflare Pages Build Script...</span>
                      </div>
                      <div className="space-y-1 text-slate-400 max-h-[100px] overflow-y-auto mt-3">
                        {deployStepLogs.slice(0, deployStep + 1).map((log, i) => (
                          <div key={i} className="text-slate-300">✔ {log}</div>
                        ))}
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                        <div
                          className="bg-[#D4AF37] h-full transition-all duration-500"
                          style={{ width: `${((deployStep + 1) / deployStepLogs.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/25 rounded-2xl text-center">
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase tracking-widest font-black mb-3">🟢 Live on Edge</span>
                      <h4 className="font-bold text-white text-sm">Site Deployed Successfully!</h4>
                      <p className="text-[11px] text-slate-400 mt-2">Hosted on high-speed static CDN, securely linked with Supabase CRM.</p>
                      <a
                        href={deployedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block font-mono text-[11px] text-[#D4AF37] underline hover:text-[#FFE169]"
                      >
                        {deployedUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 4: THE 180+ REST API SANDBOX & EXPLORER */}
      <section className="px-6 lg:px-12 py-24 bg-[#000000] border-b border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ DEVELOPER PORTAL</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              180+ Enterprise REST <span className="gold-foil-text font-black">Endpoints</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Every feature of Tax Pro Hub University is backed by a resilient JSON API. Connect custom frontends, sync legacy Drake/TaxSlayer configurations, and build automated integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left side: Domain selector */}
            <div className="lg:col-span-4 p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl max-h-[480px] overflow-y-auto console-scroll">
              <h3 className="text-xs text-[#D4AF37] font-black uppercase tracking-wider mb-6">API Domain Trees</h3>
              <div className="space-y-2">
                {Object.keys(apiSandboxData).map((domainKey) => (
                  <button
                    key={domainKey}
                    onClick={() => {
                      setSelectedApiDomain(domainKey);
                      setSelectedApiEndpoint(apiSandboxData[domainKey].endpoints[0]?.id || '');
                    }}
                    className={`w-full p-4 rounded-xl text-left border transition-all ${
                      selectedApiDomain === domainKey
                        ? 'bg-[#141414]/90 text-[#D4AF37] border-[#D4AF37]/30 shadow-lg'
                        : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-bold text-xs">{apiSandboxData[domainKey].name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side: Developer Console & JSON payload terminal */}
            <div className="lg:col-span-8 p-8 bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-3xl flex flex-col justify-between relative shadow-[0_0_25px_rgba(212,175,55,0.03)]">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">Tax Pro Hub University API Gateway Sandbox Console v1.0.0</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] font-mono text-[9px] font-bold uppercase tracking-wider">Hono 4.12.8</span>
                </div>

                {/* Selected endpoint details */}
                <div className="mb-6">
                  {selectedApiDomain === 'schema' ? (
                    <div>
                      {/* Table selector buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 mb-6">
                        {Object.keys(schemaTables).map((tblKey) => (
                          <button
                            key={tblKey}
                            onClick={() => setSelectedSchemaTable(tblKey)}
                            className={`px-3.5 py-2 rounded-xl font-mono text-[10px] font-bold border transition-all ${
                              selectedSchemaTable === tblKey
                                ? 'bg-black text-[#D4AF37] border-[#D4AF37]/50 shadow-sm'
                                : 'bg-[#141414]/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                            }`}
                          >
                            <span className="text-[#D4AF37]/60 mr-1.5 font-bold">tbl</span>
                            {schemaTables[tblKey as keyof typeof schemaTables].name}
                          </button>
                        ))}
                      </div>

                      {/* Schema Display details */}
                      {(() => {
                        const tbl = schemaTables[selectedSchemaTable as keyof typeof schemaTables];
                        return (
                          <div className="p-5 bg-[#141414]/30 border border-white/5 rounded-2xl">
                            {/* Header details */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
                              <div>
                                <h4 className="font-mono text-xs font-black text-white flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  relation: "{tbl.name}"
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{tbl.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[8px] font-mono font-bold uppercase tracking-wider">PostgreSQL 17</span>
                                <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-400 text-[8px] font-mono font-bold uppercase tracking-wider">RLS Enabled</span>
                              </div>
                            </div>

                            {/* Column specifications */}
                            <div className="mb-5">
                              <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider block mb-2.5">✦ RELATION SCHEMA METADATA</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {tbl.columns.map((col, cIdx) => (
                                  <div key={cIdx} className="p-3 bg-black/60 border border-white/5 rounded-xl flex flex-col justify-between">
                                    <span className="font-mono text-[10px] font-bold text-slate-300 truncate">{col.name}</span>
                                    <div className="mt-2.5 flex items-center justify-between gap-1">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[8px]">{col.type}</span>
                                      <span className="text-[8px] text-[#D4AF37] font-mono font-semibold text-right truncate">{col.constraint}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* DDL & RLS/Trigger grids */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider block mb-2">✦ DDL SCHEMA DEFINITION</span>
                                <pre className="p-4 bg-black border border-white/5 rounded-xl font-mono text-[9px] text-slate-300 overflow-x-auto console-scroll max-h-[180px] leading-relaxed">
                                  {tbl.ddl}
                                </pre>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider block mb-2">✦ COMPLIANCE & SECURITY CORE</span>
                                <pre className="p-4 bg-black border border-white/5 rounded-xl font-mono text-[9px] text-amber-300 overflow-x-auto console-scroll max-h-[180px] leading-relaxed">
                                  {tbl.rls}
                                </pre>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {apiSandboxData[selectedApiDomain].endpoints.map((ep) => (
                          <button
                            key={ep.id}
                            onClick={() => setSelectedApiEndpoint(ep.id)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold border transition-all ${
                              selectedApiEndpoint === ep.id
                                ? 'bg-black text-[#D4AF37] border-[#D4AF37]/40 shadow-sm'
                                : 'bg-[#141414]/40 text-slate-500 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <span className={`mr-2 font-black ${ep.method === 'POST' ? 'text-amber-400' : 'text-emerald-400'}`}>{ep.method}</span>
                            {ep.url}
                          </button>
                        ))}
                      </div>

                      {apiSandboxData[selectedApiDomain].endpoints.map((ep) => {
                        if (ep.id !== selectedApiEndpoint) return null;
                        return (
                          <div key={ep.id} className="mt-4 p-4 bg-[#141414]/30 border border-white/5 rounded-xl">
                            <p className="text-xs text-[#B8B8B8] leading-relaxed mb-4">{ep.desc}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              {/* Request Panel */}
                              <div>
                                <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest block mb-2">✦ CURL REQUEST</span>
                                <pre className="p-4 bg-black border border-white/5 rounded-xl font-mono text-[10px] text-slate-300 overflow-x-auto console-scroll max-h-[160px]">
                                  {ep.curl}
                                </pre>
                              </div>

                              {/* Response Panel */}
                              <div>
                                <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest block mb-2">✦ JSON RESPONSE</span>
                                <pre className="p-4 bg-black border border-white/5 rounded-xl font-mono text-[10px] text-amber-300 overflow-x-auto console-scroll max-h-[160px]">
                                  {JSON.stringify(ep.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Endpoint latency limit &lt;15ms</span>
                <span>Security Gate: JWT + RS256 Signature</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 5: AI FORM PARSER & COGNITIVE OCR LASER SIMULATOR */}
      <section className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ COGNITIVE SCANNING</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              AI Tax Form <span className="gold-foil-text font-black">Cognitive OCR Parser</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Ditch manual keying. Our OpenRouter vision engine parses scanned physical W-2s, 1099s, and CP notices with extreme cognitive precision and maps extracted fields into the client profile.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left side: W-2 layout image simulation */}
            <div className="lg:col-span-5 p-8 bg-[#141414]/40 border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
              {isOcrScanning && <div className="laser-line"></div>}
              
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">✦ SECURE R2 DOCUMENT VIEWER</span>
                  <span className="text-[9px] text-[#B8B8B8] font-mono">w2_scan_rick_jefferson.pdf</span>
                </div>

                <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative font-mono text-[9px] space-y-4 text-slate-400 select-none">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
                    <div>
                      <div className="font-bold text-slate-500 uppercase">a. Employee Social Security Number</div>
                      <div className={`mt-1 font-bold text-white transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>***-XX-8492</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-500 uppercase">b. Employer Identification Number (EIN)</div>
                      <div className={`mt-1 font-bold text-white transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>45-8291038</div>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-white/5">
                    <div className="font-bold text-slate-500 uppercase">c. Employer's name, address, and ZIP code</div>
                    <div className={`mt-1 font-bold text-white transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>RJ Business Solutions LLC<br />1342 NM 333, Tijeras, NM 87059</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
                    <div>
                      <div className="font-bold text-slate-500 uppercase">1. Wages, tips, other compensation</div>
                      <div className={`mt-1 font-bold text-[#D4AF37] transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>$142,500.00</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-500 uppercase">2. Federal income tax withheld</div>
                      <div className={`mt-1 font-bold text-white transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>$28,400.00</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-500 uppercase">e. Employee's name and address</div>
                    <div className={`mt-1 font-bold text-white transition-all ${isOcrScanning ? 'blur-[2px]' : ''}`}>Rick Jefferson<br />1342 NM 333, Tijeras, NM 87059</div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    setIsOcrScanning(true);
                    setOcrProgress(0);
                    setOcrData({
                      ein: 'Scanning...',
                      employer: 'Scanning...',
                      wages: 'Scanning...',
                      withholding: 'Scanning...',
                      ssn: 'Scanning...',
                      employee: 'Scanning...',
                      status: 'Analyzing with LLM...'
                    });

                    const interval = setInterval(() => {
                      setOcrProgress(prev => {
                        if (prev >= 100) {
                          clearInterval(interval);
                          setOcrData({
                            ein: '45-8291038',
                            employer: 'RJ Business Solutions LLC',
                            wages: '$142,500.00',
                            withholding: '$28,400.00',
                            ssn: '***-XX-8492',
                            employee: 'Rick Jefferson',
                            status: 'Synced to TaxSlayer (99.8% Confidence)'
                          });
                          setIsOcrScanning(false);
                          return 100;
                        }
                        return prev + 10;
                      });
                    }, 250);
                  }}
                  disabled={isOcrScanning}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] hover:from-[#FFE44D] hover:to-[#E5C158] text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isOcrScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scanning Tax Document ({ocrProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Start Cognitive AI OCR Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right side: Extracted Database */}
            <div className="lg:col-span-7 p-8 bg-[#141414]/40 border border-[#D4AF37]/15 rounded-3xl flex flex-col justify-between relative shadow-[0_0_20px_rgba(212,175,55,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">✦ EXTRACTED CRM FIELDS TABLE</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] font-bold uppercase tracking-wider ${isOcrScanning ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {ocrData.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Employer EIN</span>
                      <span className="font-mono text-xs font-bold text-white">{ocrData.ein}</span>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Employer Name</span>
                      <span className="font-mono text-xs font-bold text-white">{ocrData.employer}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Box 1 Wages</span>
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">{ocrData.wages}</span>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Box 2 Tax Withheld</span>
                      <span className="font-mono text-xs font-bold text-white">{ocrData.withholding}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Employee SSN</span>
                      <span className="font-mono text-xs font-bold text-white">{ocrData.ssn}</span>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 uppercase block mb-1">Employee Name</span>
                      <span className="font-mono text-xs font-bold text-white">{ocrData.employee}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-black/60 border border-white/5 rounded-2xl flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>IRS Security Rule Compliant (Data Encrypted)</span>
                </span>
                <span className="font-mono text-[9px] text-[#D4AF37]">LLM Model: Llama-3-70B-Vision</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION 6: OVERHAULED 40-MODULE ENTERPRISE TIER MATRIX */}
      <section className="px-6 lg:px-12 py-24 bg-[#000000] border-b border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ ENTERPRISE ECOSYSTEM</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              The Tax Pro Hub University Enterprise <span className="gold-foil-text font-black">Ecosystem</span>
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Deploy up to 22 specialized, integrated tax-practice modules across 4 high-performance enterprise suites. Brand, package, and resell everything under your own corporate flag.
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                tier: 'Suite 1: Core Practice PM',
                desc: 'Essential client management, security controls, and regulatory-hardened practice workflows.',
                pills: ['🟢 ACTIVE', '🔐 SEC 7216 ENFORCED'],
                items: [
                  { name: 'Unified CRM & Taxpayer Timeline', desc: 'Consolidates emails, SMS, transcript histories, and custom tax pipelines into a single high-fidelity, auditable stream.' },
                  { name: 'Form 2848 & 8821 POA Generator', desc: 'Seamless generation and electronic-signature routing for IRS Powers of Attorney and Tax Information Authorizations.' },
                  { name: 'Client Organizers & Secure Portal', desc: 'Adaptive, mobile-responsive dynamic questionnaires designed to collect client tax information securely.' },
                  { name: 'IRS §7216 Written Consent Manager', desc: 'Bulletproof electronic generation and logging of explicit client consents required prior to tax return data disclosure.' },
                  { name: 'Circular 230 Billing Gateway', desc: 'Rigid invoice system enforcing §10.27 regulations, blocking refund-percentage billing and tracking retainers securely.' },
                  { name: 'Unified Secure Document Vault', desc: 'Cloudflare R2-backed storage keeping tax documents encrypted at rest with WORM compliant audit trails.' }
                ]
              },
              {
                tier: 'Suite 2: Tax Return & IRS Direct',
                desc: 'Direct channels with IRS e-Services, transmission gateways, and state licensing compliance.',
                pills: ['🟢 ACTIVE', '⚡ IRS DIRECT'],
                items: [
                  { name: 'TDS Direct Transcript Delivery', desc: 'Instant, high-speed pull of IRS Wage & Income, Account, and Return transcripts via direct e-Services TDS API integrations.' },
                  { name: 'IRS MeF E-Filing Transmitter', desc: 'Direct XML payload submission and status tracking with the IRS Modernized e-File system via authorized transmitter gateway.' },
                  { name: 'IRIS A2A Information Returns', desc: 'Seamless batch preparation and A2A submission of Forms 1099 (MISC, NEC, INT) directly with IRS IRIS portal.' },
                  { name: 'Form 8879 Approved eSign Engine', desc: 'Electronic signature pad strictly conforming to IRS Pub 4557 security standards and identity verification steps.' },
                  { name: 'State Board CPE Credit Logger', desc: 'Tracks CPE and CE hours automatically for Enrolled Agents (EAs), CPAs, and preparers across state licensing boards.' },
                  { name: 'IRS CP Notice Defense Tracker', desc: 'Complete dispute resolution pipelines mapping IRS notification codes, response deadlines, and dispute value matrices.' }
                ]
              },
              {
                tier: 'Suite 3: Advisory & Planning',
                desc: 'Comprehensive multi-scenario tax modeling, entity optimizations, and corporate disclosures.',
                pills: ['🟢 ACTIVE', '📊 SCENARIO CORE'],
                items: [
                  { name: 'Joint Household Mapping Engine', desc: 'Visual graph relationship mapping to bundle family branches, trusts, and business holdings into a single tax profile.' },
                  { name: 'Corporate Entity Structuring OS', desc: 'Entity evaluation simulators modeling tax savings for S-Corp conversions, LLCs, and partnership structures.' },
                  { name: 'Multi-Scenario Advisory Slider', desc: 'Slide-and-compare tax planning modeler demonstrating tax write-offs, QBI, and section deductions visually.' },
                  { name: 'Estate & Trust Asset Preservation', desc: 'Trust asset alignment and probate timelines modeling supporting Form 1041 fiduciary preparation.' },
                  { name: 'FinCEN BOI Compliance Module', desc: 'Automated Beneficial Ownership Information filing. [FEATURE FLAGGED: Paused for domestic entities; active for foreign reporting corporations per 2026 guidelines].' }
                ]
              },
              {
                tier: 'Suite 4: Growth Operations',
                desc: 'Tools and systems to expand your client base, scale margins, and launch branded service bureaus.',
                pills: ['🟢 ACTIVE', '⚡ SCALER SUITE'],
                items: [
                  { name: 'White-Label Service Bureau Hub', desc: 'Deploy fully branded, independent sub-accounts with custom margins and customized software setups.' },
                  { name: 'Autonomous TCPA Lead Qualifier', desc: 'AI conversational voice and SMS agents designed to pre-screen high-ticket resolution or compliance leads.' },
                  { name: 'Google Ads High-Ticket Funnels', desc: 'Pre-configured ad campaign pipelines capturing specific high-value representation and tax audit leads.' },
                  { name: 'Cognitive Vision TikTok Creator', desc: 'Construct and schedule high-impact short-form social reels with synthetic voiceovers on corporate tax updates.' },
                  { name: 'Drag-and-Drop Form Builder', desc: 'Interactive canvas allowing firms to build and publish custom, secure client registration funnels instantly.' }
                ]
              }
            ].map((tGroup, tIdx) => (
              <div key={tIdx} className="p-8 bg-[#141414]/40 border border-white/5 rounded-3xl relative">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="playfair-heading text-xl font-bold text-[#D4AF37] mb-2">{tGroup.tier}</h3>
                    <p className="text-xs text-slate-400">{tGroup.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tGroup.pills.map((pill, pIdx) => (
                      <span key={pIdx} className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-slate-300 font-bold font-mono text-[9px] uppercase tracking-wider">{pill}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tGroup.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-6 bg-[#0a0a0a]/60 border border-white/5 rounded-xl hover:border-[#D4AF37]/20 transition-all">
                      <h4 className="font-bold text-white text-sm mb-2">{item.name}</h4>
                      <p className="text-[11px] text-[#A8A8A8] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 🔒 SECURITY & COMPLIANCE SECTION */}
      <section ref={complianceRef} className="px-6 lg:px-12 py-24 bg-[#000000]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ ARCHITECTURAL SECURE CORE</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Enterprise Trust & Security
            </h2>
            <p className="mt-6 text-[#A8A8A8] text-lg max-w-2xl mx-auto leading-relaxed">
              Rest secure with automated frameworks audit-tested to preserve absolute customer confidentiality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] flex items-center justify-center mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">SOC 2 Type II</h3>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">Independently audited annually to guarantee maximum operational and administrative safeguards.</p>
            </div>

            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">IRS Pub 4557</h3>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">Fully aligned with the strict standards set by the IRS Safeguards Rule for data encryption.</p>
            </div>

            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] flex items-center justify-center mb-6">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">256-Bit AES</h3>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">Industrial-grade encryption applied to every document at rest and in transit across networks.</p>
            </div>

            <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] flex items-center justify-center mb-6">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">US Data Residency</h3>
              <p className="text-xs text-[#B8B8B8] leading-relaxed">Your data resides exclusively within secure US centers, fully protected from foreign domains.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏷️ PRICING METRIC */}
      <section ref={pricingHeaderRef} className="px-6 lg:px-12 py-24 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ HONEST RETAINERS</div>
            <h2 className="playfair-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Predictable Plans, Infinite Scale
            </h2>
            
            {/* Monthly/Annual Toggle Switch */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-[#D4AF37]' : 'text-[#888888]'}`}>Monthly billing</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 rounded-full bg-[#141414] border border-white/10 p-0.5 transition-all duration-300 flex items-center relative focus:outline-none cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-full bg-[#D4AF37] shadow-md transition-all duration-300 transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isAnnual ? 'text-[#D4AF37]' : 'text-[#888888]'}`}>Annual billing</span>
                <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full border border-[#D4AF37]/20 uppercase">SAVE 20%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl border border-white/5 bg-[#141414]/50 flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
              <div>
                <h3 className="playfair-heading text-2xl font-bold text-white">Starter</h3>
                <p className="text-xs text-[#888888] mt-1">Perfect for newly established independent tax consultants.</p>
                <div className="mt-6 flex items-baseline select-none">
                  <span className="text-4xl font-black text-white font-mono">Free</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {['50 Contacts', '1 Pipeline Stage', 'Unified Inbox feed', 'Standard Input Forms', 'IRC §7216 Consent Logs', 'Local-browser override settings'].map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300 select-none">
                      <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handlePlanSelection('Starter', 'Free')} 
                className="mt-10 w-full py-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold rounded-lg border border-white/10 text-sm transition-all cursor-pointer"
              >
                Select Starter
              </button>
            </div>

            {/* Pro Professional (HERO Rotating Card) */}
            <div className="conic-glow-card min-h-full">
              <div className="conic-glow-card-inner p-8 flex flex-col justify-between">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4AF37] text-black text-[10px] font-bold uppercase rounded-full tracking-wider z-10 select-none">
                  ✦ MOST POPULAR
                </span>
                <div>
                  <h3 className="playfair-heading text-2xl font-bold text-white">Pro Professional</h3>
                  <p className="text-xs text-[#888888] mt-1">Our flagship engine designed for standard scaling firms.</p>
                  <div className="mt-6 flex items-baseline select-none">
                    <span className="playfair-heading text-6xl font-black gold-foil-text font-mono">
                      {isAnnual ? '$77' : '$97'}
                    </span>
                    <span className="text-sm text-[#888888] ml-1">/mo</span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {['Unlimited Contacts', '5 Integrated Pipelines', 'Full AI Assistant Sandbox', 'Cloudflare R2 Secure Vault', 'TaxSlayer Sync Status Engine', 'IRC §7216 RLS Policy Enforcer', 'Circular 230 §10.27 Invoicing Gate', 'Automated Trigger Workflows'].map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300 select-none">
                        <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => handlePlanSelection('Pro Professional', isAnnual ? '$77' : '$97')} 
                  className="mt-10 w-full py-3.5 gold-btn-gradient text-black font-extrabold rounded-lg text-sm transition-all shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/45 hover:-translate-y-0.5 cursor-pointer shimmer-hover"
                >
                  Choose Pro
                </button>
              </div>
            </div>

            {/* Enterprise Elite */}
            <div className="p-8 rounded-3xl border border-white/5 bg-[#141414]/50 flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
              <div>
                <h3 className="playfair-heading text-2xl font-bold text-white">Enterprise Elite</h3>
                <p className="text-xs text-[#888888] mt-1">Engineered to support global white-label agencies.</p>
                <div className="mt-6 flex items-baseline select-none">
                  <span className="playfair-heading text-5xl font-black text-white font-mono">
                    {isAnnual ? '$237' : '$297'}
                  </span>
                  <span className="text-sm text-[#888888] ml-1">/mo</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {['Unlimited Workspaces', 'White-Label Sub-Accounts resale', 'Dedicated Firm Domain Mapping', 'Click2Mail REST dispatch API', 'Custom Twilio gateway controls', 'Round-the-clock dedicated helpline', 'IRS TDS Direct API Ingest', 'State Board CPE Credit Logger'].map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm text-slate-300 select-none">
                      <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handlePlanSelection('Enterprise Elite', isAnnual ? '$237' : '$297')} 
                className="mt-10 w-full py-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold rounded-lg border border-white/10 text-sm transition-all cursor-pointer"
              >
                Choose Enterprise
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* 💬 FAQ SECTION */}
      <section ref={faqHeaderRef} className="px-6 lg:px-12 py-24 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-[0.25em] mb-4">✦ INQUIRY DIRECTORY</div>
          <h2 className="playfair-heading text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="space-y-4">
          {[
            { q: 'Is Tax Pro Hub University directly integrated with TaxSlayer?', a: 'Yes, our platform features a secure, fully mapped integration panel enabling real-time status syncing, refund pipeline tracking, and demographic field-mapping.' },
            { q: 'Where are client tax documents securely stored?', a: 'All client files are stored directly in your private, secure Cloudflare R2 Buckets utilizing standard S3 encrypted storage protocols, completely isolated from public access.' },
            { q: 'Can I white-label this platform for my own tax practice?', a: 'Absolutely! Our master admin sub-accounts module allows you to custom brand the platform with your own logo, favicon, color schemes, and customized domain URLs.' },
            { q: 'How does the AI Assistant assist with tax analysis?', a: 'Our direct integration with Google Gemini developer APIs scans client tax files via advanced OCR, extracts key federal details (such as W2/1099 wage and withholding), and highlights tax optimization insights.' },
            { q: 'What is the physical postmaster Click2Mail feature?', a: 'It allows you to mail formal representation letters or IRS response notices in physical hardcopy directly from your dashboard via Click2Mail API integration.' },
            { q: 'How does Tax Pro Hub University handle Circular 230 fee restrictions?', a: 'We hardcode and trigger-enforce Circular 230 §10.27 policies inside our billing gates. The system programmatically blocks percentage-of-refund invoice structures or refund-dependent calculations, protecting your firm from professional misconduct exposures.' },
            { q: 'Is IRC §7216 written consent required for document parsing?', a: 'Yes. Our client engagement module requires e-signature of the mandatory §7216 consent forms prior to any OCR scanning, transcript ingestion, or multi-scenario advisory mapping. This triggers PostgreSQL Row-Level Security policies to protect taxpayer confidentiality.' }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-[#D4AF37]/30"
            >
              <button 
                onClick={() => toggleFaq(idx)} 
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-white focus:outline-none cursor-pointer"
              >
                <span>{faq.q}</span>
                <HelpCircle className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  activeFaq === idx ? 'pb-6 max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-400 text-sm leading-relaxed pt-4 border-t border-white/5">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🌌 FINAL CTA SECTION */}
      <section ref={finalCtaRef} className="relative px-6 lg:px-12 py-28 overflow-hidden flex flex-col items-center text-center border-t border-white/5" style={{ background: "radial-gradient(circle at 20% 50%, rgba(212,175,55,0.06), transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,215,0,0.04), transparent 50%), #000000" }}>
        <h2 className="playfair-heading text-4xl md:text-6xl font-black text-white max-w-4xl tracking-tight leading-[1.1]">
          Your Next Tax Season Starts Today
        </h2>
        <p className="mt-6 text-[#A8A8A8] text-base md:text-lg max-w-lg leading-relaxed">
          Evolve your tax firm with the premium white-label platform designed for modern elite operators.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 z-10">
          <button 
            onClick={() => navigate('/signup')} 
            className="px-8 py-4.5 gold-btn-gradient hover:scale-[1.03] text-black font-bold rounded-lg flex items-center gap-3 shadow-xl shadow-[#D4AF37]/25 transition-all cursor-pointer shimmer-hover"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="px-8 py-4.5 bg-white/[0.04] border border-[#D4AF37]/35 text-white font-semibold rounded-lg transition-all backdrop-blur-md hover:border-[#D4AF37] hover:bg-white/[0.08] cursor-pointer"
          >
            Access Dashboard
          </button>
        </div>
      </section>

      {/* 🧭 PREMIUM MULTI-COLUMN FOOTER */}
      <footer className="border-t border-white/5 bg-[#000000] px-6 lg:px-12 py-16 text-slate-500 text-xs relative select-none">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Col 1: Logo & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-[#D4AF37] flex items-center justify-center">
                <span className="playfair-heading font-black text-[#D4AF37] text-xs">M</span>
              </div>
              <span className="playfair-heading font-bold text-sm text-white tracking-tight">TAX PRO HUB UNIVERSITY</span>
            </div>
            <p className="text-[#888888] text-xs leading-relaxed">
              Automated document OCR, unified communication pipelines, and enterprise TaxSlayer status sync.
            </p>
            <div className="flex gap-4">
              <span className="text-[#888888] hover:text-[#D4AF37] transition-colors cursor-pointer">𝕏</span>
              <span className="text-[#888888] hover:text-[#D4AF37] transition-colors cursor-pointer">in</span>
              <span className="text-[#888888] hover:text-[#D4AF37] transition-colors cursor-pointer">git</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'Integrations', 'Pricing', 'Security', 'Roadmap'].map((item, idx) => (
                <li key={idx} className="hover:text-white transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {['Guides', 'API Reference', 'Developer Docs', 'Affiliate', 'Status Feed'].map((item, idx) => (
                <li key={idx} className="hover:text-white transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Consent', 'Accessibility', 'DMCA Notice'].map((item, idx) => (
                <li key={idx} className="hover:text-white transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>

          {/* Col 5: Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Insights</h4>
            <p className="text-xs text-[#888888]">Get tax industry insights weekly.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="email@firm.com" 
                className="w-full bg-[#141414] border border-white/5 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
              <button className="bg-[#D4AF37] hover:bg-[#FFD700] text-black font-extrabold px-3 py-2 rounded transition cursor-pointer">➔</button>
            </div>
          </div>
        </div>

        {/* Compliance Badge Row */}
        <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 pb-4 flex flex-wrap justify-center md:justify-start gap-3 select-none">
          {['SOC 2 COMPLIANT', 'IRS PUB 4557', 'FTC SAFEGUARDS', 'GLBA SECURE', 'CCPA PROTECTED'].map((badge, idx) => (
            <span key={idx} className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded text-[9px] font-bold tracking-wider text-slate-500 hover:border-[#D4AF37]/30 hover:text-white transition-colors cursor-pointer">
              {badge}
            </span>
          ))}
        </div>

        {/* Corporate Meta */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mt-6 pt-4 border-t border-white/5">
          <div className="space-y-1 text-center md:text-left text-[11px] text-[#888888]">
            <p>© 2026 RJ Business Solutions. All rights reserved. Platform v4.0.0 Truth-Engine Fusion · Build ID: NEL-20260602-847291</p>
            <p>1342 NM 333, Tijeras, NM 87059 · support@rjbusinesssolutions.org · rjbusinesssolutions.org · Phone: +1 (414) 430-4277</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">All Systems Operational</span>
          </div>
        </div>
      </footer>

      {/* 📱 Mobile Sticky CTA Bar */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-full px-6 py-3 shadow-2xl shadow-[#D4AF37]/15 z-40 flex items-center gap-6 md:hidden transition-all duration-300 ${showMobileSticky ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        <span className="text-xs font-bold text-[#D4AF37]">Tax Season 2026</span>
        <button 
          onClick={() => navigate('/signup')} 
          className="px-5 py-2 bg-[#D4AF37] hover:bg-[#FFD700] text-black font-extrabold text-xs rounded-full cursor-pointer shimmer-active"
        >
          Trial Free
        </button>
      </div>

      {/* 💬 Talk to Sales Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-40">
        <a 
          href="mailto:support@rjbusinesssolutions.org" 
          className="w-12 h-12 rounded-full bg-[#141414] border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] shadow-xl hover:border-[#D4AF37] hover:bg-[#000000] hover:scale-110 transition-all cursor-pointer relative"
          title="Talk to Sales"
        >
          <Mail className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#000000]"></span>
        </a>
      </div>

      {/* 🚪 Exit Intent Modal */}
      {showExitIntent && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl shadow-[#D4AF37]/15">
            <button 
              onClick={() => setShowExitIntent(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="playfair-heading text-3xl font-bold text-white mb-2">Wait — Save 20%!</h3>
            <p className="text-sm text-[#B8B8B8] leading-relaxed mb-6">
              Get an exclusive 20% discount on your first 3 months of the ultimate Pro Professional suite. Claim your coupon today.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowExitIntent(false);
                  handlePlanSelection('Pro Professional', '$77');
                }} 
                className="flex-1 py-3 gold-btn-gradient text-black font-extrabold rounded-lg text-xs uppercase tracking-wider cursor-pointer shimmer-hover"
              >
                Claim Discount
              </button>
              <button 
                onClick={() => setShowExitIntent(false)} 
                className="flex-1 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold rounded-lg border border-white/10 text-xs uppercase tracking-wider cursor-pointer"
              >
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 SECURE STRIPE PAYMENT & PRACTICE REGISTRATION MODAL */}
      {modalOpen && checkoutPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-[#D4AF37]/10 flex flex-col lg:flex-row">
            {/* Modal Left Side - Product Info and Interactive Credit Card */}
            <div className="lg:w-[42%] bg-[#141414]/40 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -z-10"></div>
              
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-6">
                  <Shield className="h-4 w-4" /> SECURE STRIPE HANDSHAKE
                </div>
                
                <h3 className="playfair-heading text-2xl font-bold text-white tracking-tight">Upgrade Your Practice</h3>
                <p className="text-sm text-slate-400 mt-2">You are subscribing to the ultimate Tax Pro Hub University tier.</p>
                
                <div className="mt-6 bg-[#000000] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">SELECTED PLAN</div>
                    <div className="text-base font-bold text-white mt-0.5">{checkoutPlan.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">RETAINER</div>
                    <div className="text-lg font-extrabold text-[#D4AF37] mt-0.5">{checkoutPlan.price}/mo</div>
                  </div>
                </div>
              </div>

              {/* Glassmorphic Credit Card Preview */}
              <div className="my-8 lg:my-0">
                <div className="w-full aspect-[1.586/1] bg-gradient-to-tr from-[#D4AF37]/80 via-[#FFD700]/75 to-[#B8860B]/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/20 select-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent -z-10"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] text-white/70 font-semibold tracking-wider font-mono">MYVIRTUAL SECURE</div>
                      <div className="w-8 h-6 bg-[#FFD700]/90 rounded-md mt-2 flex items-center justify-center overflow-hidden border border-[#D4AF37]/30">
                        <div className="grid grid-cols-2 gap-[1px] w-full h-full p-[2px]">
                          <div className="border border-[#B8860B]/30"></div>
                          <div className="border border-[#B8860B]/30"></div>
                          <div className="border border-[#B8860B]/30"></div>
                          <div className="border border-[#B8860B]/30"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <CreditCard className="h-6 w-6 text-white/90" />
                      <span className="text-[9px] text-white/50 font-mono mt-1">S3 VAULT</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-lg lg:text-xl font-mono text-white tracking-widest leading-none">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="max-w-[70%]">
                      <div className="text-[7px] text-white/50 uppercase tracking-wider">CARDHOLDER</div>
                      <div className="text-xs font-mono text-white truncate mt-0.5 uppercase tracking-wide">
                        {cardName || 'RICK JEFFERSON'}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-[7px] text-white/50 uppercase tracking-wider">EXPIRES</div>
                        <div className="text-xs font-mono text-white mt-0.5">
                          {cardExpiry || '12/28'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[7px] text-white/50 uppercase tracking-wider">CVC</div>
                        <div className="text-xs font-mono text-white mt-0.5">
                          {cardCvc || '•••'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding Notice */}
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 leading-tight">
                <Shield className="h-3 w-3 text-[#D4AF37]" />
                <span>RJ Business Solutions Compliant. Tijeras, NM</span>
              </div>
            </div>

            {/* Modal Right Side - Stripe Billing + Practice Form */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {paySuccess ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 mb-6 animate-bounce">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-white tracking-tight">Payment Approved!</h4>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Stripe transaction completed successfully. Your white-label sub-account is being created...
                  </p>
                  <p className="text-xs text-[#D4AF37] font-mono mt-4 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Provisioning workspace credentials
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                  <div>
                    <h4 className="playfair-heading text-xl font-bold text-white tracking-tight">Practice Registration & Billing</h4>
                    <p className="text-xs text-slate-400 mt-1">Fill out your coordinates and billing info to instantiate your secure platform instance.</p>
                  </div>

                  {payError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Owner Full Name</label>
                      <input 
                        type="text" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Rick Jefferson"
                        className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Business Name</label>
                      <input 
                        type="text" 
                        value={cardBusiness}
                        onChange={(e) => setCardBusiness(e.target.value)}
                        placeholder="RJ Business Solutions"
                        className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={cardEmail}
                        onChange={(e) => setCardEmail(e.target.value)}
                        placeholder="support@rjbusinesssolutions.org"
                        className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Platform Password</label>
                      <input 
                        type="password" 
                        value={cardPass}
                        onChange={(e) => setCardPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Stripe Card Information</label>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Card Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4242 4242 4242 4242"
                            className="w-full pl-11 pr-4 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none transition"
                            required
                          />
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expiration Date</label>
                          <input 
                            type="text" 
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Security Code (CVC)</label>
                          <input 
                            type="password" 
                            value={cardCvc}
                            onChange={handleCvcChange}
                            placeholder="•••"
                            className="w-full px-3.5 py-2 bg-[#141414] border border-white/5 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none transition"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <span className="text-[9px] text-slate-500 max-w-[50%] leading-normal">
                      By clicking Pay, you authorize Tax Pro Hub University to charge your card on file for recurring subscription retainers.
                    </span>
                    <button
                      type="submit"
                      disabled={isPaying}
                      className="px-6 py-3 gold-btn-gradient text-black font-bold rounded-lg text-xs uppercase tracking-wide flex items-center gap-2 shadow-lg disabled:opacity-50 select-none cursor-pointer"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay & Instantiate Workspace`
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
