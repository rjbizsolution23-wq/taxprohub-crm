# 👑 TAX PRO HUB UNIVERSITY
## 💼 Enterprise-Grade White-Label AI Practice Management OS

[![Platform](https://img.shields.io/badge/Platform-Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://tax-pro-hub-university.pages.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.2.6-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary_Commercial-D4AF37?style=for-the-badge)](./LICENSE)

```
   ██████╗  ████████╗ ██████╗  ██╗███████╗ ████████╗██╗  ██╗██╗   ██╗███████╗
   ██╔══██╗ ╚══██╔══╝ ██╔══██╗ ██║╚══███╔╝ ╚══██╔══╝██║  ██║██║   ██║██╔════╝
   ██████╔╝    ██║    ██████╔╝ ██║  ███╔╝     ██║   ███████║██║   ██║███████╗
   ██╔══██╗    ██║    ██╔══██╗ ██║ ███╔╝      ██║   ██╔══██║██║   ██║╚════██║
   ██║  ██║    ██║    ██████╔╝ ██║███████╗    ██║   ██║  ██║╚██████╔╝███████║
   ╚═╝  ╚═╝    ╚═╝    ╚═════╝  ╚═╝╚══════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                     💎 FULL-SCALE PRACTICE MANAGEMENT OS 💎
```

Welcome to the **RJ Business Solutions Tax Pro Hub University** official corporate source repository. This software is a high-end, elite practice management system engineered for expert tax attorneys, CPA firms, estate planners, and professional multi-tenant franchise networks.

Developed and maintained exclusively by **RJ Business Solutions** (Tijeras, New Mexico), this system provides deep secure contact CRM drawers, 11 specialized pipelines (Revenue OS), unified multi-channel messaging, and a showcase hub of 40 premium simulated modules (including Plaid ledgers, LMS courses, VoIP dialers, and native mobile interfaces) designed with a luxury **Obsidian Black (`#030712`) & Gold Foil (`#D4AF37`)** style.

---

## 🧭 DEVELOPER INSTRUCTION GATES

If you are an autonomous AI agent, compiler, or engineer contributing to this repository, you **MUST** read and adhere to the following core specifications before authoring commits or refactoring existing logic:

### 1. 📂 [Backend Logic & Integrations Specification](./BACKEND-LOGIC-AND-INTEGRATIONS.md)
* **Scope**: Defines the exact data structures and connection mappings for over **180 API endpoints** across 16 core business modules. It outlines Postgres/D1 database schemas, background queue handlers, IRS Pub 4557 security baselines, and integrations with third-party service gateways (TaxSlayer, IRS MeF, Stripe, Twilio, Plaid, Lob, Experian, OpenAI, and Anthropic).

### 2. 🎨 [Frontend Branding & Aesthetic Guidelines](./RICK_JEFFERSON_ULTIMATE_TAX_SYSTEM_COMPLETE_SPECIFICATIONS.md)
* **Scope**: Outlines the mandatory black-and-gold visual theme. All interfaces must run on hardware-accelerated layouts, featuring modern type styling (`Playfair Display` + `Inter`), micro-animations, glassmorphism, and explicit co-branded licensing footers. **No generic, plain, or cheap defaults are permitted.**

---

## ⚙️ CODBASE REPOSITORY DIRECTORY

```
tax-pro-hub-university/
├── .wrangler/                     # Local Cloudflare pages server state
├── dist/                          # Production-compiled single-file HTML bundle
├── public/                        # Static marketing resources and logos
├── src/
│   ├── components/
│   │   ├── layout/                # Main interface container & 36-tab Sidebar (AppShell)
│   │   └── ui/                    # Custom styled gold-accented UI buttons
│   ├── pages/
│   │   ├── auth/                  # Encrypted Authentication (LoginPage, SignupPage, etc.)
│   │   ├── contacts/              # CRM & Client profiles (15-tab Dossier sliders)
│   │   ├── campaigns/             # Visual Marketing Campaign editors
│   │   ├── deals/                 # Pipeline Kanban states & Circular 230 validators
│   │   ├── forms/                 # Form builders & smart-organizer questionnaire compilers
│   │   ├── funnels/               # Landing page generators
│   │   ├── websites/              # Corporate web builder page layouts
│   │   ├── workflows/             # Automated trigger & visual workflow handlers
│   │   └── EcosystemPage.tsx      # Master portal rendering the 40 premium simulators
│   ├── store/
│   │   └── index.ts               # Zustand global store with secure persistent state
│   ├── types/                     # Shared TypeScript interfaces
│   ├── utils/                     # Formatting utilities & anti-reverse debugger hooks
│   ├── main.tsx                   # Safe mounting point protected by ErrorBoundary
│   └── App.tsx                    # React client hash routing & brand theme locked loader
├── index.html                     # Core HTML template with structured SEO metadata & security scripts
├── package.json                   # Project npm dependencies, scripts, and build parameters
├── tsconfig.json                  # Strict TypeScript compilation rules
├── vite.config.ts                 # Single-file inlining bundler configuration
└── LICENSE                        # Proprietary Software License Agreement
```

---

## ⚡ QUICK START DEVELOPMENT & COMPILATION

Ensure you have [Node.js](https://nodejs.org/) installed on your environment.

### 1. Install Node Dependencies
Secure your package lock files and install required node libraries:
```bash
npm install
```

### 2. Launch Local Development Server
Boot up the fast Vite dev server locally to test visual modifications:
```bash
npm run dev
```
To test the **real edge backend** (auth + D1 + integrations) locally:
```bash
npm run cf:dev    # builds + wrangler pages dev --local
```

### 3. Compile Secure Single-File Production Bundle
Build the optimized, minimized, and single-file inlined HTML production file:
```bash
npx vite build
```
*Your compiled artifact is saved as `dist/index.html`, completely bundling all JS, CSS, and icons, with active browser security shields pre-injected.*

### 4. Connect the real backend (Cloudflare D1 + KV) — one time
```bash
export CLOUDFLARE_API_TOKEN=your-token   # Pages + D1 + KV edit scopes
export CLOUDFLARE_ACCOUNT_ID=your-account-id
npm run cf:setup    # creates D1 database + KV + Pages project, applies migrations
```

### 5. Deploy to Cloudflare Pages CDN
```bash
npm run deploy    # vite build + wrangler pages deploy dist
```
*Full runbook: [`docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md).*

> **Two modes.** With the D1 binding live, the app runs in **Backend Mode**:
> real signup/login (PBKDF2-hashed passwords, 30-day sessions), tenant-scoped
> CRUD persisted in D1, and every store action mirrored to the edge
> automatically. Without it, the app stays in **Demo Mode** (localStorage
> seed data) so it is always usable and demoable.

---

## 🔌 BACKEND API v2 — What's live at the edge

Every route below runs in `functions/api/[[route]].ts` (Cloudflare Pages
Functions) against **D1** with per-tenant isolation:

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/signup` · `login` · `logout` · `change-password` · `GET /api/auth/me` | Real auth (PBKDF2-SHA256, 30-day sessions, 409/401 semantics) |
| `GET /api/v1/bootstrap` | Full tenant snapshot in one call (12 collections) |
| `GET/POST /api/v1/:entity` · `GET/PUT/DELETE /api/v1/:entity/:id` | CRUD for contacts, deals, appointments, campaigns, workflows, funnels, websites, forms, blog-posts, preparers, payouts, pipelines |
| `POST /api/sms/send` · `/api/email/send` | Twilio SMS · Resend/MailChannels email |
| `POST /api/stripe/checkout` · `/connect` · `/webhook` | Stripe payments + HMAC-verified webhooks |
| `POST /api/video/session` · `/api/llm/chat` | Cloudflare Calls · OpenAI-compatible proxy |
| `POST /api/payouts/accrue` · `/api/keys` | D1 payout ledger · hashed API keys |
| `GET /api/health` | Live integration status board |

Full audit & architecture: [`ANALYSIS.md`](./ANALYSIS.md) ·
Deployment: [`docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md)

## 🛡️ INTELLECTUAL PROPERTY & COMPLIANCE SIGNATURES
* **Product Name**: RJ Business Solutions Tax Pro Hub University
* **Owner & Operator**: Rick Jefferson
* **Corporate HQ Address**: 1342 NM 333, Tijeras, New Mexico 87059
* **Corporate Support**: support@rjbusinesssolutions.org
* **Official Website**: [rickjeffersonsolutions.com](https://rickjeffersonsolutions.com)
* **Secondary Portal**: [rjbusinesssolutions.org](https://rjbusinesssolutions.org)
* **Direct Phone Line**: +1 (414) 430-4277
* **Compliance Standards Enforced**: IRS Publication 4557 (Safeguarding Taxpayer Data), FTC Safeguards Rule, Gramm-Leach-Bliley Act (GLBA), IRS Circular 230 §10.30/10.27/10.35 rules, 10DLC SMS Campaign Registry, and CAN-SPAM Act.

---

## 📄 LICENSING & TERMS
This software repository and its source files are strictly proprietary. Unauthorized cloning, copying, modifications, distribution, or reverse-engineering of this system, its layout, or its visual simulated modules is prosecuted to the full extent of federal and international copyright statutes. 

*See the formal [LICENSE](./LICENSE) file for complete commercial terms.*

***

*Developed with pride and precision by **RJ Business Solutions** © 2026. All Rights Reserved.*

---

## 🚀 GO-TO-MARKET — WHAT MAKES THIS THE INDUSTRY KILLER (v2.1, Aug 2026)

**The verified market gap** (full analysis in [`docs/MARKET_ANALYSIS.md`](./docs/MARKET_ANALYSIS.md)): tax offices today stack Drake ($2,345+/yr) + TaxDome ($800–$1,200/user/yr) + GoHighLevel ($97–$497/mo) ≈ **$6,900+/yr** and *still* have no downline monitoring, no bank-product override engine, and no credit repair module. This platform replaces the whole stack.

### The modules no competitor has
| Module | Route | What it kills |
|---|---|---|
| 🏦 Bank Products + Pre-Approved Advance Desk | `/bank-products` | CrossLink's override moat |
| 👥 Recruiting Network (live downline earnings) | `/network` | Spreadsheet bureau management |
| 🛡️ Credit Repair as a Service (built-in Metro 2® engine + CRO plugins) | `/credit-repair` | Off-season revenue leakage |
| 🧲 Lead Magnets Studio (9 premium, auto-branded, funnel-wired) | `/lead-magnets` | Cheap DIY marketing |
| 🔌 Integrations Hub (IRS e-Services keys, 4 banks, 28 connectors) | `/integrations` | Closed ecosystems |
| 🔁 Universal Migration Center (12 source platforms) | `/migration` | Switching-cost lock-in |
| 🔑 Developer Hub (scoped API keys + webhooks) | `/developer` | No-API competitors |

### Multi-tenant, two ways
- **Self-serve** — prospects sign up at `/#/signup-company`: pick plan (**$199 / $399 / $899 per month**), pay, upload logo + colors → tenant auto-provisions in under 60 seconds.
- **Master admin** — the platform owner builds tenants no-code in **Tenant Studio** (`/tenant-studio`): logo, name, colors → live branded platform, plus suspend/reactivate and View-As impersonation.

### Demo motion
The **72-step interactive tutorial** *is* the sales demo — it navigates the live app while narrating every module, ending on the Growth Engine chapter (bank products → downline → credit repair → tenant provisioning). Send prospects the tutorial; close them in Tenant Studio.
