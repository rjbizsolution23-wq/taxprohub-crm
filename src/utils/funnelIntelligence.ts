/**
 * 🎨 RJ BUSINESS SOLUTIONS — FUNNEL GENIE INTELLIGENCE CORE (ZERO-KEY)
 * Natural-language → fully branded funnel + campaign generator.
 *
 * The operator types what they want ("spring tax credit campaign for a
 * barbershop, black and red brand") and the engine:
 *   1. Understands intent — business vertical, offer, tone, season
 *   2. Resolves the business's brand palette (named colors, hex, or
 *      vertical-intelligent defaults)
 *   3. Compiles a 3-step conversion funnel (landing → intake → thank-you)
 *      with production-grade glassmorphism HTML in the brand's colors
 *   4. Writes the matching email + SMS campaign copy
 *
 * 100% deterministic template-intelligence — NO AI keys required.
 * When an AI key IS configured, callers can layer generateAIResponse()
 * on top for bespoke copy, but the engine never depends on it.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
  name: string;
}

export interface FunnelBlueprint {
  businessName: string;
  vertical: string;
  offer: string;
  palette: BrandPalette;
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
  urgency: string;
  steps: Array<{ name: string; type: 'landing' | 'checkout' | 'thankyou'; path: string; html: string }>;
  emailCampaign: { subject: string; preheader: string; body: string };
  smsCampaign: string;
  intentReport: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Color intelligence
// ─────────────────────────────────────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  red: '#DC2626', crimson: '#B91C1C', maroon: '#7F1D1D',
  orange: '#EA580C', amber: '#D97706', gold: '#D4AF37', yellow: '#CA8A04',
  green: '#16A34A', emerald: '#059669', teal: '#0D9488', mint: '#34D399',
  blue: '#2563EB', navy: '#1E3A8A', royal: '#1D4ED8', sky: '#0284C7', cyan: '#0891B2',
  purple: '#7C3AED', violet: '#6D28D9', lavender: '#A78BFA', indigo: '#4F46E5',
  pink: '#DB2777', rose: '#E11D48', magenta: '#C026D3', fuchsia: '#C026D3',
  black: '#111827', charcoal: '#1F2937', gray: '#4B5563', grey: '#4B5563',
  silver: '#94A3B8', white: '#F8FAFC', brown: '#92400E', tan: '#B45309',
  turquoise: '#06B6D4', coral: '#F97316', burgundy: '#881337', olive: '#4D7C0F',
};

const VERTICAL_PALETTES: Record<string, { colors: [string, string]; verticalName: string }> = {
  barber: { colors: ['#B91C1C', '#111827'], verticalName: 'Barbershop / Grooming' },
  salon: { colors: ['#DB2777', '#111827'], verticalName: 'Salon & Beauty' },
  restaurant: { colors: ['#EA580C', '#7F1D1D'], verticalName: 'Restaurant & Food Service' },
  trucking: { colors: ['#1E3A8A', '#EA580C'], verticalName: 'Trucking & Logistics' },
  construction: { colors: ['#D97706', '#1F2937'], verticalName: 'Construction & Trades' },
  realestate: { colors: ['#0F766E', '#D4AF37'], verticalName: 'Real Estate' },
  medical: { colors: ['#0284C7', '#0F172A'], verticalName: 'Medical & Healthcare' },
  fitness: { colors: ['#16A34A', '#111827'], verticalName: 'Fitness & Wellness' },
  legal: { colors: ['#1E3A8A', '#D4AF37'], verticalName: 'Legal Services' },
  auto: { colors: ['#DC2626', '#1F2937'], verticalName: 'Automotive' },
  ecommerce: { colors: ['#7C3AED', '#111827'], verticalName: 'E-Commerce' },
  daycare: { colors: ['#0891B2', '#F59E0B'], verticalName: 'Childcare & Daycare' },
  cleaning: { colors: ['#0D9488', '#0F172A'], verticalName: 'Cleaning Services' },
  landscaping: { colors: ['#4D7C0F', '#78350F'], verticalName: 'Landscaping' },
  tax: { colors: ['#D4AF37', '#030712'], verticalName: 'Tax & Accounting' },
  default: { colors: ['#D4AF37', '#030712'], verticalName: 'Small Business' },
};

const VERTICAL_KEYWORDS: Array<{ re: RegExp; key: string }> = [
  { re: /barber|haircut|fade|grooming/i, key: 'barber' },
  { re: /salon|beauty|nails|lashes|stylist|braids|hair/i, key: 'salon' },
  { re: /restaurant|food truck|catering|café|cafe|bakery|chef/i, key: 'restaurant' },
  { re: /truck(?:ing|er)|freight|logistics|hauling|cdl|owner[- ]operator/i, key: 'trucking' },
  { re: /construction|contractor|roofing|plumb|hvac|electric|handyman|remodel/i, key: 'construction' },
  { re: /real ?estate|realtor|property|landlord|airbnb|rental/i, key: 'realestate' },
  { re: /medical|clinic|dental|dentist|chiro|therapy|nurse|home health/i, key: 'medical' },
  { re: /gym|fitness|trainer|yoga|crossfit|wellness/i, key: 'fitness' },
  { re: /law|legal|attorney|paralegal/i, key: 'legal' },
  { re: /auto|mechanic|detailing|car wash|body shop|dealership/i, key: 'auto' },
  { re: /e-?commerce|shopify|amazon|online store|dropship|boutique/i, key: 'ecommerce' },
  { re: /daycare|childcare|preschool|after[- ]school/i, key: 'daycare' },
  { re: /cleaning|janitorial|maid/i, key: 'cleaning' },
  { re: /landscap|lawn|tree service|snow removal/i, key: 'landscaping' },
  { re: /tax|bookkeep|account|cpa|payroll|enrolled agent/i, key: 'tax' },
];

function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)));
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export function resolvePalette(prompt: string, verticalKey: string): BrandPalette {
  // 1. Explicit hex codes win
  const hexes = prompt.match(/#[0-9a-fA-F]{6}\b/g) || [];
  // 2. Named colors in the prompt — ordered by where the user typed them,
  //    so "black and red" yields black primary, red secondary.
  const named: Array<{ hex: string; pos: number }> = [];
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    const m = prompt.match(new RegExp(`\\b${name}\\b`, 'i'));
    if (m && m.index !== undefined) named.push({ hex, pos: m.index });
  }
  named.sort((a, b) => a.pos - b.pos);
  const picked = [...hexes, ...named.map((n) => n.hex)];
  const fallback = VERTICAL_PALETTES[verticalKey] || VERTICAL_PALETTES.default;

  const primary = picked[0] || fallback.colors[0];
  const secondary = picked[1] || fallback.colors[1];

  return {
    primary,
    secondary,
    accent: shade(primary, 22),
    dark: shade(secondary, -12),
    light: shade(primary, 82),
    name: picked.length ? 'Operator-specified brand colors' : `${fallback.verticalName} signature palette`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent understanding
// ─────────────────────────────────────────────────────────────────────────────

const OFFER_LIBRARY: Array<{ re: RegExp; offer: string; headline: (biz: string) => string; bullets: string[] }> = [
 {
    re: /credit repair|fix.*credit|credit score/i,
    offer: 'Credit Restoration Program',
    headline: (b) => `${b}: Rebuild Your Credit. Reclaim Your Buying Power.`,
    bullets: ['Free 3-bureau credit analysis', 'Dispute engine targets every negative item', 'Score progress dashboard — watch it climb', 'CROA-compliant, cancel anytime'],
  },
  {
    re: /self[- ]?employ|1099|gig|contractor.*tax|setc/i,
    offer: 'Self-Employed Tax Credit Review',
    headline: (b) => `${b}: You May Be Owed Thousands in Self-Employed Tax Credits.`,
    bullets: ['Free eligibility check in under 5 minutes', 'We compute your exact credit — no guessing', 'IRS-compliant documentation prepared for you', 'No upfront fees — you win or you pay nothing'],
  },

  {
    re: /tax credit(?!.*self)|\bcredits? (?:you|they).{0,20}owed|unclaimed credit/i,
    offer: 'Tax Credit Recovery Review',
    headline: (b) => `${b}: Unclaimed Tax Credits Could Be Sitting In Your Name Right Now.`,
    bullets: ['Free credit eligibility scan — EITC, CTC, education, energy & business credits', 'We compute the exact dollar amount you qualify for', 'Amended-return filing handled end-to-end if credits were missed', 'IRS-compliant documentation — audit-ready from day one'],
  },  {
    re: /refund|maximum refund|tax season|file.*tax|tax prep/i,
    offer: 'Maximum Refund Tax Preparation',
    headline: (b) => `${b}: Every Deduction. Every Credit. Maximum Refund — Guaranteed Diligence.`,
    bullets: ['Credentialed preparers, PTIN-verified', 'Deduction discovery engine reviews 300+ write-offs', 'Secure digital document vault — snap & upload', 'Refund advance options available'],
  },
  {
    re: /bookkeep|clean.?up|quickbooks|payroll/i,
    offer: 'Monthly Bookkeeping & Clean-Up',
    headline: (b) => `${b}: Books Done Right. Every Month. No Surprises in April.`,
    bullets: ['Dedicated bookkeeper who knows your industry', 'Monthly P&L, balance sheet & cash flow delivered', 'Historical clean-up projects welcome', 'Tax-ready books, year round'],
  },
  {
    re: /erc|employee retention/i,
    offer: 'Employee Retention Credit Review',
    headline: (b) => `${b}: Check Your ERC Eligibility Before the Window Closes.`,
    bullets: ['Compliance-first eligibility screening', 'Audit-defense documentation package', 'Transparent flat-fee pricing', 'IRS moratorium guidance included'],
  },
  {
    re: /llc|business formation|start.*business|ein|incorporat/i,
    offer: 'Business Formation & Launch Package',
    headline: (b) => `${b}: Launch Your Business The Right Way — LLC, EIN & Tax Setup Done For You.`,
    bullets: ['State LLC filing handled end-to-end', 'EIN + IRS elections (S-Corp analysis included)', 'Compliance calendar so you never miss a deadline', 'Business banking & bookkeeping setup'],
  },
];

const DEFAULT_OFFER = {
  offer: 'Professional Tax & Financial Services',
  headline: (b: string) => `${b}: Elite Tax Strategy For People Who Are Serious About Keeping More.`,
  bullets: ['Free strategy consultation', 'Credentialed, verified professionals', 'Secure client portal & document vault', 'Transparent flat-fee pricing'],
};

function detectBusinessName(prompt: string): string | undefined {
  const m =
    prompt.match(/(?:for|called|named)\s+["“']([^"”']{3,50})["”']/i) ||
    prompt.match(/(?:for|called|named)\s+([A-Z][\w'&-]*(?:\s+[A-Z][\w'&-]*){0,4}(?:\s+(?:LLC|Inc|Co|Corp|Studio|Shop|Group|Solutions|Services))?)/);
  return m?.[1]?.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML compilation (glassmorphism, brand-injected)
// ─────────────────────────────────────────────────────────────────────────────

function buildLandingHTML(bp: Omit<FunnelBlueprint, 'steps' | 'emailCampaign' | 'smsCampaign' | 'intentReport'>): string {
  const p = bp.palette;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${bp.headline}</title>
<style>
  :root{--primary:${p.primary};--secondary:${p.secondary};--accent:${p.accent};--dark:${p.dark};--light:${p.light}}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:radial-gradient(1200px 800px at 80% -10%,${p.primary}33,transparent),linear-gradient(160deg,var(--dark) 0%,var(--secondary) 100%);color:#fff;min-height:100vh}
  .wrap{max-width:1080px;margin:0 auto;padding:64px 24px}
  .badge{display:inline-block;padding:8px 18px;border-radius:999px;background:${p.primary}22;border:1px solid ${p.primary}66;color:var(--light);font-size:13px;letter-spacing:.14em;text-transform:uppercase;backdrop-filter:blur(12px)}
  h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(34px,5.2vw,58px);line-height:1.08;margin:26px 0 18px;background:linear-gradient(120deg,#fff 30%,var(--light));-webkit-background-clip:text;background-clip:text;color:transparent}
  .sub{font-size:19px;color:#ffffffcc;max-width:640px;line-height:1.6}
  .glass{margin-top:44px;padding:34px;border-radius:24px;background:#ffffff0d;border:1px solid #ffffff22;backdrop-filter:blur(20px);box-shadow:0 24px 80px #00000055}
  ul{list-style:none;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
  li{display:flex;gap:12px;align-items:flex-start;font-size:16px;line-height:1.5;color:#ffffffe6}
  li::before{content:'✓';flex:none;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,var(--primary),var(--accent));font-weight:800;font-size:14px;color:#fff}
  .cta{display:inline-block;margin-top:34px;padding:18px 46px;border-radius:14px;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;font-weight:800;font-size:18px;text-decoration:none;letter-spacing:.02em;box-shadow:0 12px 40px ${p.primary}66;transition:transform .2s}
  .cta:hover{transform:translateY(-2px)}
  .urgency{margin-top:16px;font-size:14px;color:var(--light);letter-spacing:.04em}
  footer{margin-top:70px;padding-top:22px;border-top:1px solid #ffffff1a;font-size:12px;color:#ffffff88}
</style></head>
<body><div class="wrap">
  <span class="badge">${bp.vertical} · ${bp.offer}</span>
  <h1>${bp.headline}</h1>
  <p class="sub">${bp.subheadline}</p>
  <div class="glass">
    <ul>${bp.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
    <a class="cta" href="./intake">${bp.cta}</a>
    <p class="urgency">⏳ ${bp.urgency}</p>
  </div>
  <footer>© ${new Date().getFullYear()} ${bp.businessName}. All rights reserved. · Powered by RJ Business Solutions</footer>
</div></body></html>`;
}

function buildIntakeHTML(bp: Omit<FunnelBlueprint, 'steps' | 'emailCampaign' | 'smsCampaign' | 'intentReport'>): string {
  const p = bp.palette;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Get Started — ${bp.businessName}</title>
<style>
  :root{--primary:${p.primary};--accent:${p.accent};--dark:${p.dark};--light:${p.light}}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:linear-gradient(160deg,var(--dark),${p.secondary});color:#fff;min-height:100vh;display:grid;place-items:center;padding:32px}
  .card{width:100%;max-width:520px;padding:40px;border-radius:24px;background:#ffffff0d;border:1px solid #ffffff22;backdrop-filter:blur(20px);box-shadow:0 24px 80px #00000066}
  h2{font-family:'Playfair Display',Georgia,serif;font-size:30px;margin-bottom:8px}
  p{color:#ffffffb3;margin-bottom:26px;font-size:15px;line-height:1.55}
  label{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--light);margin:16px 0 6px}
  input,select{width:100%;padding:14px 16px;border-radius:12px;border:1px solid #ffffff2e;background:#00000040;color:#fff;font-size:15px;outline:none}
  input:focus,select:focus{border-color:var(--primary)}
  button{width:100%;margin-top:28px;padding:17px;border:none;border-radius:13px;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;font-weight:800;font-size:17px;cursor:pointer;box-shadow:0 12px 36px ${p.primary}55}
  .secure{margin-top:14px;text-align:center;font-size:12px;color:#ffffff80}
</style></head>
<body><form class="card" action="./thank-you">
  <h2>Claim Your ${bp.offer}</h2>
  <p>Takes under 60 seconds. A specialist from ${bp.businessName} will reach out same-day.</p>
  <label>Full Name</label><input required name="name" placeholder="Jordan Smith">
  <label>Email</label><input required type="email" name="email" placeholder="you@email.com">
  <label>Mobile Phone</label><input required type="tel" name="phone" placeholder="(555) 000-0000">
  <label>What best describes you?</label>
  <select name="segment"><option>Self-employed / 1099</option><option>W-2 employee</option><option>Business owner (LLC/S-Corp)</option><option>Not sure yet</option></select>
  <button type="submit">${bp.cta} →</button>
  <p class="secure">🔒 256-bit encrypted · Your data is never sold · SMS consent applies</p>
</form></body></html>`;
}

function buildThankYouHTML(bp: Omit<FunnelBlueprint, 'steps' | 'emailCampaign' | 'smsCampaign' | 'intentReport'>): string {
  const p = bp.palette;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're In — ${bp.businessName}</title>
<style>
  :root{--primary:${p.primary};--accent:${p.accent}}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:linear-gradient(160deg,${p.dark},${p.secondary});color:#fff;min-height:100vh;display:grid;place-items:center;padding:32px;text-align:center}
  .card{max-width:560px;padding:52px 42px;border-radius:26px;background:#ffffff0d;border:1px solid #ffffff22;backdrop-filter:blur(20px)}
  .check{width:74px;height:74px;margin:0 auto 24px;border-radius:50%;display:grid;place-items:center;font-size:34px;background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:0 14px 44px ${p.primary}66}
  h2{font-family:'Playfair Display',Georgia,serif;font-size:32px;margin-bottom:12px}
  p{color:#ffffffbf;line-height:1.65;font-size:16px}
  .steps{margin-top:28px;text-align:left;display:grid;gap:12px}
  .step{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:14px;background:#00000033;border:1px solid #ffffff14;font-size:14px}
  .n{flex:none;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:${p.primary}33;color:${p.light};font-weight:800;font-size:13px}
</style></head>
<body><div class="card">
  <div class="check">✓</div>
  <h2>You're Locked In.</h2>
  <p>${bp.businessName} received your request for the <strong>${bp.offer}</strong>. Watch your phone — our specialist calls from a local number.</p>
  <div class="steps">
    <div class="step"><span class="n">1</span>Confirmation text hits your phone in the next 2 minutes</div>
    <div class="step"><span class="n">2</span>Specialist reviews your info & calls same-day</div>
    <div class="step"><span class="n">3</span>Secure portal invite so you can upload documents from your phone</div>
  </div>
</div></body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Master generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateFunnelBlueprint(prompt: string, fallbackBusinessName?: string): FunnelBlueprint {
  const intentReport: string[] = [];

  // Vertical
  let verticalKey = 'default';
  for (const vk of VERTICAL_KEYWORDS) {
    if (vk.re.test(prompt)) { verticalKey = vk.key; break; }
  }
  const vertical = (VERTICAL_PALETTES[verticalKey] || VERTICAL_PALETTES.default).verticalName;
  intentReport.push(`Vertical detected: ${vertical}`);

  // Business name
  const businessName = detectBusinessName(prompt) || fallbackBusinessName || 'Your Business';
  intentReport.push(`Business identity: ${businessName}`);

  // Offer
  const offerDef = OFFER_LIBRARY.find((o) => o.re.test(prompt)) || { ...DEFAULT_OFFER, re: /./ };
  intentReport.push(`Offer engine: ${offerDef.offer}`);

  // Palette
  const palette = resolvePalette(prompt, verticalKey);
  intentReport.push(`Brand palette: ${palette.name} (${palette.primary} / ${palette.secondary})`);

  // Season / urgency
  const month = new Date().getMonth();
  const urgency =
    /deadline|urgent|last chance|closing/i.test(prompt) ? 'Final window — spots are limited this week.'
    : month <= 3 ? 'Tax season is live — early filers get priority scheduling.'
    : month >= 9 ? 'Q4 planning window — lock in strategies before December 31.'
    : 'Limited onboarding slots open this month.';

  const headline = offerDef.headline(businessName);
  const subheadline = `Purpose-built for ${vertical.toLowerCase()} operators. Real credentialed professionals, transparent pricing, and a process engineered to put money back in your pocket.`;
  const cta = /book|schedule|call/i.test(prompt) ? 'Book My Free Consultation' : 'Check My Eligibility — Free';

  const core = { businessName, vertical, offer: offerDef.offer, palette, headline, subheadline, bullets: offerDef.bullets, cta, urgency };

  const steps: FunnelBlueprint['steps'] = [
    { name: 'Landing — Offer Page', type: 'landing', path: '/', html: buildLandingHTML(core) },
    { name: 'Intake — Lead Capture', type: 'checkout', path: '/intake', html: buildIntakeHTML(core) },
    { name: 'Thank You — Confirmation', type: 'thankyou', path: '/thank-you', html: buildThankYouHTML(core) },
  ];

  const emailCampaign = {
    subject: `${businessName}: ${offerDef.offer} — your spot is reserved`,
    preheader: `${urgency} Reply STOP to opt out.`,
    body: `Hi [Client Name],

You asked about the ${offerDef.offer} — here's exactly what happens next with ${businessName}:

${offerDef.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

${urgency}

Tap below to lock in your spot:
👉 [Funnel Link]

Talk soon,
The ${businessName} Team

--
Powered by RJ Business Solutions | support@rjbusinesssolutions.org
You are receiving this because you requested information from ${businessName}. Unsubscribe: [Unsubscribe Link]`,
  };

  const smsOffer = /review$/i.test(offerDef.offer) ? offerDef.offer : `${offerDef.offer} review`;
  const smsCampaign = `${businessName}: [Client Name], your ${smsOffer} is reserved. ${cta} → [Short Link]. ${urgency} Reply STOP to opt out.`;

  intentReport.push(`Compiled: 3-step funnel + email + SMS in brand colors`);

  return { ...core, steps, emailCampaign, smsCampaign, intentReport };
}
