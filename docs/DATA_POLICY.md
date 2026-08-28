# Data Policy — Live Data Only

**Rule:** the application renders **live data from the Cloudflare D1 backend**.
The only fabricated content in the product is a strictly-bounded demo seed of
**2 sample records per core object**, used exclusively in offline/demo mode.
Everything else is either live, an empty-state placeholder, or an explicitly
labelled "Showcase Simulation".

## 1. Demo seed (the only mock data)

`src/data/demoSeed.ts` — the single source of sample content:

| Object | Sample records | IDs |
|---|---|---|
| Tenant / sub-account | 1 (`Demo Practice (Sample Data)`) | `demo-tenant` |
| Contacts | **2** | `sample-contact-1`, `sample-contact-2` |
| Deals | **2** | `sample-deal-1`, `sample-deal-2` |
| Appointments | **2** | `sample-appt-1`, `sample-appt-2` |
| Preparers | **2** | `sample-preparer-1`, `sample-preparer-2` |

Every sample record is named `SAMPLE …` / tagged `SAMPLE`, carries `$0` values,
and is **discarded the moment a real session hydrates** (`hydrateBackend()` in
`src/store/index.ts` replaces the entire store with the tenant's D1 rows).

Collections that ship **empty**: campaigns, workflows, funnels, websites, forms,
blog posts, payouts, social accounts, tasks, notifications.

## 2. What became live

| Area | Before | Now |
|---|---|---|
| Dashboard KPI strip (MTD revenue, open pipeline, returns YTD, refunds, conversion) | hardcoded `$28,500`, `142`, `32%` … | computed from live `deals` / `contacts` |
| Dashboard 12-month revenue chart | fixed 12-point array | won-deal value per month, target = 12-mo average |
| Dashboard filing funnel | fixed 6 stages w/ counts | live pipeline stages × deal counts |
| Dashboard "Practice System Gateway" | 5 fake integrations + random pulse | polls `GET /api/health`, shows real `ONLINE` / `NOT CONFIGURED` per binding |
| Dashboard sub-account leaderboard | 3 invented agencies | top 3 tenants by won-deal revenue |
| Dashboard AI insight cards | invented client names | highest-value open deal + next scheduled appointment |
| Dashboard task queue | 5 invented tasks | starts empty; user/AI-created tasks only |
| Analytics: overview, lead sources, funnel, MRR | 4 hardcoded chart arrays | derived from live contacts / deals / pipelines |
| Meta Marketing insights (`fetchCampaignInsights`) | returned 3 fake campaigns when unconfigured | returns `[]` + console warning |
| Meta Lead Ads (`fetchLeadFromGraphAPI`) | returned a fake lead when unconfigured | throws "not configured" |
| Contacts / Calendar / Blog / Websites / Forms / Workflows pages | fell back to 3–4 invented rows when the store was empty | live store only; existing empty-state placeholders render |
| Social suite (accounts, queue, inbox, listening) | 16 invented rows | empty until an OAuth provider is connected |

## 3. Deliberately kept

* **Ecosystem page** — a catalogue of 40 roadmap modules with interactive
  demos, each already badged **"Showcase Simulation"**. It is a product tour,
  not a data surface.
* **Campaign / funnel editors** — email + phone *chrome* mockups (the frame
  around live user content), not fabricated records.
* **Template galleries** (workflow recipes, hashtag groups, stock imagery) —
  authored presets the user installs, not pretend activity.

## 4. Enforcement

When adding a feature, never invent numbers to fill a panel. Either:

1. derive it from the store (live D1 data), or
2. render the empty state, or
3. call the integration and show the `not_configured` stub from `/api/health`.
