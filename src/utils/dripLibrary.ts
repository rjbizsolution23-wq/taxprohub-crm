/**
 * DRIP CAMPAIGN LIBRARY — Tax Industry
 * ------------------------------------------------------------------
 * Complete, ordered, ready-to-send drip sequences. Every email is
 * full multi-paragraph copy; every SMS is complete and compliant
 * (STOP language on first SMS touch). Merge tokens:
 *   {{firstName}} {{lastName}} {{businessName}} {{preparerName}}
 *   {{bookingLink}} {{portalLink}} {{phone}} {{refundEta}}
 * ------------------------------------------------------------------
 */
import { Campaign, DripStep } from '../types';

export interface DripTemplate {
  id: string;
  name: string;
  category: 'acquisition' | 'onboarding' | 'tax_season' | 'post_filing' | 'reactivation' | 'referral' | 'compliance' | 'appointments';
  goal: string;
  audience: string;
  durationDays: number;
  description: string;
  /** Recommended workflow trigger to auto-enroll */
  recommendedTrigger: string;
  steps: DripStep[];
}

let stepSeq = 0;
const sid = () => `ds-${++stepSeq}`;

const step = (
  order: number, day: number, channel: 'email' | 'sms',
  opts: Partial<DripStep> & { body: string }
): DripStep => ({
  id: sid(), order, day, channel, exitOn: 'reply', ...opts,
});

/* ================================================================
 * 1. NEW LEAD → BOOKED CALL  (Speed-to-lead, 10 days, 8 touches)
 * ================================================================ */
const newLeadSequence: DripTemplate = {
  id: 'drip-new-lead',
  name: 'New Lead → Booked Call',
  category: 'acquisition',
  goal: 'Convert a fresh inquiry into a booked tax strategy call within 10 days',
  audience: 'Brand-new leads from ads, forms, or referrals who have not booked',
  durationDays: 10,
  recommendedTrigger: 'contact_created',
  description: 'Speed-to-lead sequence. SMS within 1 minute, value-stacked emails, objection handling, and a scarcity close. Exits automatically the moment they book.',
  steps: [
    step(1, 0, 'sms', {
      sendAt: 'immediately',
      exitOn: 'booked',
      strategyNote: 'Speed-to-lead. Responding inside 5 minutes lifts contact rates ~9x. Personal, short, one question.',
      body: `Hi {{firstName}}, it's {{preparerName}} with {{businessName}} — just saw your request come through. Quick question so I point you the right way: are you filing as an individual, or do you own a business? (Reply STOP to opt out)`,
    }),
    step(2, 0, 'email', {
      sendAt: '+15 minutes',
      exitOn: 'booked',
      subject: `{{firstName}}, your tax review request is confirmed — here's what happens next`,
      preheader: 'Your 3-step path to a bigger, cleaner return starts now.',
      cta: { label: 'Pick Your Call Time', href: '{{bookingLink}}' },
      strategyNote: 'Confirmation + expectation setting. Reduces ghosting by telling them exactly what happens next.',
      body: `Hi {{firstName}},

You're on the board. Your tax review request just landed with our team at {{businessName}}, and I wanted to reach out personally before anything else hits your inbox.

Here's exactly what happens next — no mystery, no runaround:

1. **You pick a time.** Grab any 20-minute slot on my calendar (link below). It's a real strategy call, not a sales pitch.
2. **We review your last return.** Most new clients are shocked at what their previous preparer missed — on average we find $1,800+ in overlooked deductions and credits on a first-pass review.
3. **You get a written game plan.** Whether you work with us or not, you leave with a one-page action plan for this tax year.

One thing to know about how we work: everything is secure, virtual, and documented. Your documents live in an encrypted portal — never email attachments, never lost paperwork.

The calendar fills fast during season, so grab your slot while today's times are still open.

Talk soon,
{{preparerName}}
{{businessName}}
{{phone}}`,
    }),
    step(3, 1, 'email', {
      exitOn: 'booked',
      subject: 'The 3 mistakes we find on almost every self-prepared return',
      preheader: 'No. 2 costs the average filer $940 — and it takes us 4 minutes to spot.',
      cta: { label: 'Get My Return Reviewed Free', href: '{{bookingLink}}' },
      strategyNote: 'Value-first education touch. Builds authority and gives a concrete reason to book.',
      body: `{{firstName}},

After thousands of returns, the same three mistakes show up over and over — whether the return was self-prepared or done by a big-box chain:

**Mistake #1 — Taking the standard deduction on autopilot.**
If you paid state income tax, made charitable gifts, had medical bills, or paid mortgage interest, itemizing may beat the standard deduction. Most software never runs the full comparison with a professional eye on the inputs.

**Mistake #2 — Missing above-the-line adjustments. (Avg. cost: $940)**
Educator expenses, student loan interest, HSA contributions, self-employment health insurance, half of SE tax — these reduce your income *before* the standard-deduction question even matters. They're free money and they're skipped constantly.

**Mistake #3 — Wrong filing status.**
Head of Household vs. Single is worth thousands in bracket space and a bigger standard deduction — and it's one of the most commonly botched fields we see.

On our first call, I'll run your last return through this exact 3-point check while you watch. If everything's clean, I'll tell you that too — you lose nothing but 20 minutes.

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 2, 'sms', {
      exitOn: 'booked',
      strategyNote: 'Light nudge with a specific, low-pressure ask.',
      body: `{{firstName}}, {{preparerName}} here. Still holding a review slot for you this week. Takes 20 min and you'll know exactly what your last return missed. Want the link? Just reply YES.`,
    }),
    step(5, 4, 'email', {
      exitOn: 'booked',
      subject: `What a $6,240 refund looks like (real client story)`,
      preheader: 'Same W-2, same year — the difference was in the details.',
      cta: { label: 'Book My 20-Minute Review', href: '{{bookingLink}}' },
      strategyNote: 'Social proof story. Concrete numbers, believable, no hype.',
      body: `{{firstName}},

Quick story about a client I'll call Denise (details changed, numbers real).

Denise came to us last February after using the same big-chain preparer for six years. W-2 income, two kids, side income from weekend catering. Her prior-year refund: $1,380.

Here's what a proper review found:

• Her catering side income qualified her for the **Qualified Business Income deduction** — never claimed.
• Mileage between catering jobs — over 3,100 miles, never logged, never deducted. We rebuilt the log from her calendar and bank records.
• Her youngest qualified her for the **Child and Dependent Care Credit** she was told she "didn't need."
• Her prior preparer used Single status. She qualified for **Head of Household**.

Corrected current-year refund: **$6,240.** We also amended the prior year and recovered another $2,100 she was owed.

Not every return has this much left on the table. But we haven't reviewed one yet where checking cost the client anything — the review is free, and it's 20 minutes.

Your slot is still open this week: {{bookingLink}}

{{preparerName}}
{{businessName}}`,
    }),
    step(6, 6, 'email', {
      exitOn: 'booked',
      subject: `"I'll just do it myself this year" — read this first`,
      preheader: 'DIY is fine — until one of these five things is true.',
      cta: { label: 'Grab a Slot Before Season Peaks', href: '{{bookingLink}}' },
      strategyNote: 'Objection-handling touch: addresses DIY, cost, and "my situation is simple."',
      body: `{{firstName}},

Totally fair if you're thinking about doing it yourself this year. Software is cheap and your situation might be simple.

But DIY stops being the smart play the moment **any one** of these is true:

1. You have 1099 or gig income (even a few hundred dollars)
2. You bought, sold, or rented out property
3. You had stock sales, RSUs, or crypto transactions
4. Your family situation changed — marriage, divorce, new baby, kid in college
5. You got any letter from the IRS in the last 3 years

Any of those, and the cost of a mistake isn't the software fee — it's an audit letter, penalties and interest, or a four-figure refund you never knew you missed.

And here's the part most people don't know: **our fee is usually recovered several times over by what the review finds.** If we can't find enough to justify the engagement, we'll tell you to DIY with our blessing — it's happened, and those people send us referrals anyway.

20 minutes. Free. Your move: {{bookingLink}}

{{preparerName}}
{{businessName}}
{{phone}}`,
    }),
    step(7, 8, 'sms', {
      exitOn: 'booked',
      strategyNote: 'Direct, human, near-final touch.',
      body: `{{firstName}} — last nudge from me, promise. I've got 2 review slots left this week. If taxes are handled, reply DONE and I'll close your file. If not, reply YES and I'll send times.`,
    }),
    step(8, 10, 'email', {
      exitOn: 'booked',
      subject: 'Closing your file (unless…)',
      preheader: 'One click keeps your spot — otherwise we\'ll assume you\'re covered.',
      cta: { label: 'Keep My Spot', href: '{{bookingLink}}' },
      strategyNote: 'Takeaway close. Clean exit that often triggers a response spike.',
      body: `{{firstName}},

I'm doing my end-of-week file cleanup, and yours is on the list.

If you've got taxes handled — genuinely, that's great, and I'll close your file today so you stop hearing from me. No hard feelings.

But if it's still on the to-do list (and getting heavier every week), one click below keeps your spot and gets you the free 3-point return review this week.

After today, new requests go behind the current client queue — during season that can mean a 2–3 week wait.

Either way, thanks for considering {{businessName}}. Door's open whenever you need it.

{{preparerName}}
{{businessName}}`,
    }),
  ],
};

/* ================================================================
 * 2. NEW CLIENT ONBOARDING & DOCUMENT COLLECTION (14 days, 7 touches)
 * ================================================================ */
const onboardingSequence: DripTemplate = {
  id: 'drip-onboarding',
  name: 'New Client Onboarding & Doc Collection',
  category: 'onboarding',
  goal: 'Get a signed engagement letter and 100% of documents uploaded within 14 days',
  audience: 'Newly signed clients who have not completed document upload',
  durationDays: 14,
  recommendedTrigger: 'deal_stage_changed → Client Signed',
  description: 'Welcome, portal setup, personalized document checklist, then escalating reminders until every document is in. Exits on docs_uploaded.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'docs_uploaded',
      subject: `Welcome to {{businessName}}, {{firstName}} — your secure portal is ready`,
      preheader: 'Two things to do today (10 minutes total) and then we take it from here.',
      cta: { label: 'Open My Secure Portal', href: '{{portalLink}}' },
      strategyNote: 'Warm welcome + exactly two actions. Never more than two asks in an onboarding email.',
      body: `Welcome aboard, {{firstName}}!

You're officially a client of {{businessName}}, and {{preparerName}} is your dedicated preparer. Here's the entire onboarding — just two things, about 10 minutes total:

**1. Sign your engagement letter** (2 min)
It's waiting in your portal. It spells out exactly what we do, what it costs, and how your data is protected. No surprises, ever.

**2. Upload your documents** (8 min)
Your portal has a personalized checklist based on what you told us. Snap photos with your phone — our document intelligence reads W-2s, 1099s, and receipts automatically and flags anything blurry or missing.

**A few promises from our side:**
• Your documents are encrypted in transit and at rest. We will never ask for sensitive info over plain email or text.
• You'll get a status update at every milestone — received, in preparation, in review, filed, refund tracking.
• Questions get answered within one business day, usually faster.

Hit the button below to knock out both steps now while it's top of mind.

Glad you're here,
{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 0, 'sms', {
      sendAt: '+2 hours',
      exitOn: 'docs_uploaded',
      strategyNote: 'Same-day SMS with the portal link for phone-first clients.',
      body: `{{firstName}}, welcome to {{businessName}}! Your secure portal link: {{portalLink}} — sign the engagement letter & snap photos of your docs right from your phone. Takes ~10 min. Questions? Just reply here. (Reply STOP to opt out)`,
    }),
    step(3, 2, 'email', {
      exitOn: 'docs_uploaded',
      subject: 'Your personalized document checklist (most people have #1–4 already)',
      preheader: 'Print it, screenshot it, or just upload as you find them.',
      cta: { label: 'Upload What I Have', href: '{{portalLink}}' },
      strategyNote: 'Reduce overwhelm: full checklist, explicitly say partial uploads are fine.',
      body: `{{firstName}},

Here's your document checklist. Two important things first:

**You don't need everything at once.** Upload what you have today — the portal tracks what's still missing and we'll only chase the gaps.

**Photos are fine.** Clear phone photos work perfectly; our system reads them automatically.

**INCOME**
☐ W-2s from every employer
☐ 1099-NEC / 1099-K (contract, gig, or platform income)
☐ 1099-INT / 1099-DIV (bank interest, dividends)
☐ 1099-B (brokerage / stock sales)
☐ 1099-R / SSA-1099 (retirement, Social Security)
☐ K-1s (partnerships, S-corps, trusts)

**DEDUCTIONS & CREDITS**
☐ 1098 (mortgage interest) & property tax bills
☐ 1098-T + tuition statements (education credits)
☐ Childcare provider name, address, EIN, and amount paid
☐ Charitable donation receipts
☐ Medical expenses if significant

**IF SELF-EMPLOYED**
☐ Income summary (bank/app exports are fine)
☐ Expense records by category
☐ Home office square footage & total home square footage
☐ Vehicle mileage log or total business miles

**EVERYONE**
☐ Photo ID (front)
☐ Last year's tax return (huge head start for us)
☐ Bank routing + account number for direct-deposit refund

Upload anything you've got right now: {{portalLink}}

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 5, 'sms', {
      exitOn: 'docs_uploaded',
      strategyNote: 'Progress-framing nudge.',
      body: `Hi {{firstName}} — {{preparerName}} here. Your file is open on my desk & I'm ready to start the moment your docs land. Even partial uploads help me get ahead: {{portalLink}}`,
    }),
    step(5, 8, 'email', {
      exitOn: 'docs_uploaded',
      subject: `{{firstName}}, your return can't start yet — here's the one thing holding it`,
      preheader: 'Everything else is ready on our end.',
      cta: { label: 'Finish My Upload (8 min)', href: '{{portalLink}}' },
      strategyNote: 'Bottleneck framing: make clear the delay is now on their side, kindly.',
      body: `{{firstName}},

Quick status update on your return:

✅ Engagement — ready
✅ Your preparer ({{preparerName}}) — assigned and briefed
✅ Portal — active
⬜ **Documents — this is the only thing we're waiting on**

I get it — gathering documents is the least fun part of tax season. But here's why sooner genuinely beats later:

• **Earlier filing = earlier refund.** Most direct-deposit refunds arrive within 21 days of IRS acceptance. Every week of delay pushes that back a week.
• **Earlier filing beats identity thieves.** Fraudulent returns filed in your name are blocked the moment your real one is accepted.
• **Season queue is real.** Files complete this week are prepared this week. Files complete in late March wait in line.

8 minutes, phone photos are fine: {{portalLink}}

Stuck on something specific — can't find a form, employer hasn't sent a W-2, portal being weird? Reply to this email and we'll fix it today.

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(6, 11, 'sms', {
      exitOn: 'docs_uploaded',
      strategyNote: 'Offer human help — some clients stall from confusion, not procrastination.',
      body: `{{firstName}}, want me to just call you & walk through the upload together? Takes 10 min on the phone. Reply CALL and I'll ring you today, or upload here: {{portalLink}} — {{preparerName}}`,
    }),
    step(7, 14, 'email', {
      exitOn: 'docs_uploaded',
      subject: 'Your file is moving to the waitlist tomorrow',
      preheader: 'One upload keeps you in the active preparation queue.',
      cta: { label: 'Keep My File Active', href: '{{portalLink}}' },
      strategyNote: 'Honest consequence framing — not a fake threat; queues are real in season.',
      body: `{{firstName}},

Being straight with you: files with no documents after 14 days move from our **active preparation queue** to the **waitlist**, so preparers can serve clients who are ready.

Nothing bad happens to your engagement — you don't lose your spot as a client, and there's no fee. But when your documents do arrive, your file re-enters the queue behind whoever is ready at that time. In peak season that can add 2–3 weeks to your refund.

One upload today keeps you active: {{portalLink}}

And if life has just gotten in the way — reply with the word LATER and the date you'll have things together, and I'll pause the reminders and hold a note in your file. We work around real life all the time.

{{preparerName}}
{{businessName}}`,
    }),
  ],
};

/* ================================================================
 * 3. TAX SEASON FILING PUSH (Jan 15 → Apr 15 cadence, 8 touches)
 * ================================================================ */
const taxSeasonSequence: DripTemplate = {
  id: 'drip-tax-season',
  name: 'Tax Season Filing Push',
  category: 'tax_season',
  goal: 'Get every existing client filed before April 15 — front-load the calendar',
  audience: 'All active clients who have not yet filed this season',
  durationDays: 90,
  recommendedTrigger: 'custom → season_open (Jan 15)',
  description: 'The season backbone. Kickoff, early-bird push, deadline math, last-call urgency. Exits when the client files.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'filed',
      subject: `Tax season is open, {{firstName}} — your {{businessName}} filing window starts now`,
      preheader: 'IRS e-file is live. Early filers get refunds first — here\'s your kickoff plan.',
      cta: { label: 'Start My Return', href: '{{portalLink}}' },
      strategyNote: 'Season kickoff. Establish early-bird framing on day one.',
      body: `{{firstName}},

It's official — the IRS is accepting returns, which means your filing window at {{businessName}} is open.

**Why the first 30 days of season are the best 30 days to file:**

• **Refunds land first.** The IRS processes early-season returns fastest. Most e-filed, direct-deposit refunds arrive within 21 days of acceptance — before the March crunch slows everything down.
• **Identity protection.** The single best defense against tax-refund fraud is filing your real return before a criminal files a fake one. Early filers close that door.
• **Your preparer has time to dig.** In January and February, {{preparerName}} can spend real time hunting deductions on your file. In April, everyone is triaging.

**Your kickoff plan (15 minutes this week):**
1. Open your portal — your document checklist is pre-loaded from last year
2. Upload W-2s and 1099s as they arrive (photos are fine)
3. We handle literally everything else and message you at each milestone

W-2s are legally due to you by January 31, so most of yours may already be in hand or in your email.

Let's get you to the front of the line: {{portalLink}}

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 7, 'sms', {
      exitOn: 'filed',
      strategyNote: 'W-2 arrival window nudge.',
      body: `{{firstName}}, W-2s hit mailboxes this week! Snap a photo & upload to your portal the day it arrives and we'll have you filed while everyone else is still procrastinating: {{portalLink}} — {{preparerName}} (Reply STOP to opt out)`,
    }),
    step(3, 14, 'email', {
      exitOn: 'filed',
      subject: 'The Feb 1 club gets paid in February',
      preheader: 'Real math on what filing this week means for your refund date.',
      cta: { label: 'Upload My Docs Now', href: '{{portalLink}}' },
      strategyNote: 'Concrete refund-date math. Dates and numbers beat vague urgency.',
      body: `{{firstName}},

Simple math on why this week matters:

**File this week** → IRS acceptance within ~48 hours → typical direct-deposit refund lands in roughly 3 weeks. **You have your money in February.**

**File in late March** → you're in the IRS peak-volume pile → refunds routinely stretch past 21 days → plus our preparation queue is longest exactly then. **You have your money in May.**

Same refund. Same forms. Two-plus months of difference — decided entirely by when your documents hit the portal.

One honest caveat: if you claim the Earned Income Tax Credit or Additional Child Tax Credit, the law (the PATH Act) doesn't let the IRS release those refunds before mid-February regardless of when you file. But filing now still puts you at the *front* of that release wave instead of the back.

Docs in this week = filed this week: {{portalLink}}

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 28, 'email', {
      exitOn: 'filed',
      subject: `{{firstName}}, halfway checkpoint — where your return stands`,
      preheader: 'A 60-second status check and what we still need from you.',
      cta: { label: 'See What\'s Missing', href: '{{portalLink}}' },
      strategyNote: 'Mid-season status framing creates accountability without nagging.',
      body: `{{firstName}},

We're at the season halfway mark, so here's a 60-second status check.

**If your documents are in:** you're all set — you'll hear from {{preparerName}} with a draft for review shortly, if you haven't already. Nothing to do.

**If they're not in yet:** your portal checklist shows exactly what's outstanding — usually it's just one or two items like a late brokerage 1099 or a childcare receipt. The portal marks each item received the moment it lands, so you always know where you stand.

A note on brokerage forms: 1099-B and consolidated statements legally can arrive as late as mid-February, and corrected versions sometimes follow. If that's what you're waiting on — totally normal, upload everything else now and add it when it lands. We build the return around it.

Checkpoint takes one minute: {{portalLink}}

{{preparerName}}
{{businessName}}`,
    }),
    step(5, 49, 'sms', {
      exitOn: 'filed',
      strategyNote: 'March 15 adjacent — business deadline echo + personal push.',
      body: `{{firstName}}, heads up from {{businessName}}: we're 4 weeks from the April deadline & the preparation queue is filling. Docs in this week = comfortably filed. What's still outstanding? Reply & I'll check your file. — {{preparerName}}`,
    }),
    step(6, 63, 'email', {
      exitOn: 'filed',
      subject: 'Two weeks out. Here are your three options.',
      preheader: 'File now, file with what you have, or extend properly — pick one.',
      cta: { label: 'Beat the Deadline', href: '{{portalLink}}' },
      strategyNote: 'Choice architecture: three clear paths, all of which involve engaging.',
      body: `{{firstName}},

Two weeks to the April deadline. At this point you have exactly three good options — and one bad one:

**Option 1 — File now (best).**
Docs in the portal by this Friday and {{preparerName}} guarantees you're filed before the deadline. Done, refund on the way, sleep well.

**Option 2 — File with what you have.**
Missing one straggler document? Often we can file accurately without it or with a substitute (we know the rules for reconstructing records). Upload everything else and tell us what's missing — we'll tell you honestly whether it's file-now or extend.

**Option 3 — Extend properly.**
An extension (Form 4868) gives you until October 15 to *file* — but it does **not** extend your time to *pay*. We calculate a safe-harbor payment so you extend without racking up penalties and interest. This is a real strategy, not a failure — plenty of our best-optimized returns are extended on purpose.

**The bad option — silence.**
Missing the deadline with no extension and a balance due triggers the failure-to-file penalty: 5% of the unpaid tax per month, up to 25%. It's the most expensive way to handle taxes and it's 100% avoidable.

Tell us which option you're taking — reply 1, 2, or 3, or just upload: {{portalLink}}

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(7, 74, 'sms', {
      exitOn: 'filed',
      strategyNote: 'Final week urgency, direct.',
      body: `{{firstName}} — FINAL WEEK. Deadline is in days, not weeks. Reply FILE (docs coming now), or EXTEND (we\'ll prepare Form 4868 + safe-harbor payment today). Either way you\'re protected. Don\'t go silent on me! — {{preparerName}}, {{businessName}}`,
    }),
    step(8, 88, 'email', {
      exitOn: 'filed',
      subject: 'Filed on extension? Here\'s your October game plan',
      preheader: 'Extended ≠ done. Lock your October date now while it\'s calm.',
      cta: { label: 'Pick My October Prep Date', href: '{{bookingLink}}' },
      strategyNote: 'Post-deadline transition for extenders — keeps the file alive through summer.',
      body: `{{firstName}},

Deadline week is behind us. If you extended — smart move, and here's how we make October painless instead of a repeat scramble:

**Your extension game plan:**
1. **Pick your prep month now.** June and July are our quietest months — your file gets maximum preparer attention. Book a summer prep slot below and October becomes a formality.
2. **Drip your documents in.** No need for one big upload session. Forward things to the portal as you find them; the checklist tracks it all.
3. **Remember the real deadline: October 15.** There is no extension of the extension. Files still open in mid-October pay rush intensity — and if tax is owed, penalties and interest have been running since April, which is why we set your safe-harbor payment.

If you already filed and this email found you anyway — congratulations, ignore all of the above, and watch for our refund-tracking updates.

Summer slot calendar: {{bookingLink}}

{{preparerName}}
{{businessName}}`,
    }),
  ],
};

/* ================================================================
 * 4. POST-FILING REFUND CONCIERGE (35 days, 6 touches)
 * ================================================================ */
const refundSequence: DripTemplate = {
  id: 'drip-refund',
  name: 'Post-Filing Refund Concierge',
  category: 'post_filing',
  goal: 'Keep clients informed from e-file to refund deposit, harvest reviews at peak happiness',
  audience: 'Clients whose returns were just e-filed',
  durationDays: 35,
  recommendedTrigger: 'deal_stage_changed → Return Filed',
  description: 'Milestone-driven updates that kill "where\'s my refund" calls, plus a perfectly-timed review ask the week money lands.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'none',
      subject: `🎉 Filed! Your return is on its way to the IRS, {{firstName}}`,
      preheader: 'What happens in the next 48 hours, 21 days, and what to do if anything hiccups.',
      cta: { label: 'Track My Refund Status', href: 'https://www.irs.gov/wheres-my-refund' },
      strategyNote: 'Filing confirmation + expectation setting kills 90% of status calls.',
      body: `It's done, {{firstName}} — your return has been electronically filed! 🎉

Here's your exact timeline from here:

**Next 24–48 hours: IRS Acceptance.**
The IRS runs identity and math checks, then "accepts" the return. We monitor this and will text you the moment it happens. (Acceptance ≠ refund approved — it just means you're officially in the system.)

**Within 24 hours of acceptance: Track it yourself.**
The IRS "Where's My Refund?" tool updates once daily (overnight). You'll need: your SSN, filing status, and exact refund amount — which is **{{refundEta}}**.

**Typical timeline: refund within 21 days of acceptance** for e-file + direct deposit. The tool shows three stages: Return Received → Refund Approved → Refund Sent.

**If you claimed EITC or the Additional Child Tax Credit:** federal law holds those refunds until mid-February at the earliest — that's the PATH Act, it applies to everyone, and it doesn't mean anything is wrong.

**If anything looks stuck or you get an IRS letter:** don't panic and don't call the IRS first — call us. Letters are usually routine (identity verification, a math adjustment) and we handle them as part of your engagement.

Congratulations on being done. It's a genuinely great feeling, isn't it?

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 2, 'sms', {
      exitOn: 'none',
      strategyNote: 'Acceptance confirmation — the update they actually crave.',
      body: `Great news {{firstName}} — the IRS has ACCEPTED your return ✅ You\'re officially in the refund pipeline. Typical direct deposit: within 21 days. Track anytime: irs.gov/wheres-my-refund — {{businessName}} (Reply STOP to opt out)`,
    }),
    step(3, 10, 'email', {
      exitOn: 'none',
      subject: 'Refund checkpoint + the one letter you shouldn\'t ignore',
      preheader: 'Most refunds are mid-pipeline right now. Here\'s what\'s normal and what\'s not.',
      strategyNote: 'Mid-wait reassurance + IRS letter education = fewer panicked calls.',
      body: `{{firstName}},

Day-10 checkpoint on your refund. Where things typically stand right now:

**Normal:** "Where's My Refund?" shows *Return Received* or has moved to *Refund Approved*. The tool updates overnight, once a day — checking hourly won't speed it up (we've all tried).

**Also normal:** EITC/ACTC refunds showing a held status until mid-February. That's federal law, not a problem.

**Worth a call to us:** it's been 21+ days since acceptance with no movement, the tool says "Take Action," or you receive an IRS letter.

**About IRS letters — the 30-second version:**
• **5071C / 4883C** — identity verification. Common, especially for early filers. We walk you through it same-day.
• **CP12** — the IRS corrected a math item and adjusted your refund. We verify their math (they're not always right).
• **CP05** — a review hold. Usually resolves on its own; we monitor it.

Any letter, any confusion, any weirdness: reply here or call {{phone}}. Handling the IRS *for you* is literally the job.

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 18, 'sms', {
      exitOn: 'none',
      strategyNote: 'Deposit-window heads up.',
      body: `{{firstName}}, entering the typical deposit window for your refund! 💰 Watch your account this week. If nothing lands by day 21 after acceptance, text me here & I\'ll investigate with the IRS directly. — {{preparerName}}`,
    }),
    step(5, 24, 'email', {
      exitOn: 'none',
      subject: `Did it land? (And a 60-second favor, {{firstName}})`,
      preheader: 'If your refund is in the bank, we\'d love 60 seconds of your time.',
      cta: { label: 'Leave a Quick Review', href: '{{portalLink}}review' },
      strategyNote: 'Review ask timed to peak happiness — money-in-bank week.',
      body: `{{firstName}},

By now your refund has most likely landed — if it hasn't, stop reading and call us right now at {{phone}}, because past 21 days we escalate directly with the IRS on your behalf.

If it *did* land: enjoy it. You earned it, we just made sure you kept it.

**One small favor while the good feeling is fresh:** would you leave us a short review? 60 seconds, two sentences. Something like what you'd tell a coworker who asked "who does your taxes?"

Reviews are how a local practice like {{businessName}} competes with the big chains' ad budgets. Every single one matters and {{preparerName}} reads them all.

→ {{portalLink}}review

Thank you — genuinely. It's a privilege to be trusted with this stuff.

{{preparerName}}
{{businessName}}`,
    }),
    step(6, 35, 'email', {
      exitOn: 'none',
      subject: 'Your refund was the finish line. It\'s also the starting line.',
      preheader: 'Three moves that make next year\'s refund bigger — start any of them this month.',
      cta: { label: 'Book a 20-Min Mid-Year Strategy Call', href: '{{bookingLink}}' },
      strategyNote: 'Bridge to year-round advisory — plants the seed for off-season revenue.',
      body: `{{firstName}},

Most people's tax strategy is 100% rear-view mirror: once a year, look backward, report what happened, hope for the best.

The clients who consistently get the biggest refunds (or the smallest surprise bills) do one thing differently: **they make 2–3 forward-looking moves during the year.** Here are three worth considering right now:

**1. Fix your withholding.**
A huge refund actually means you gave the IRS an interest-free loan all year. A surprise bill means the opposite. Ten minutes with a new W-4 puts your paycheck exactly where you want it.

**2. Open or fund the right tax-advantaged account.**
HSA (if you have a high-deductible health plan), traditional or Roth IRA, or a solo 401(k) if you have any self-employment income. Each one is a lever we can pull *before* December 31 — and some even after.

**3. If you have side income — start the paper trail now.**
Mileage log, separate account for business expenses, quarterly estimated payments. Ninety seconds a week now beats forensic reconstruction in March.

A 20-minute mid-year call covers all three, tailored to your actual numbers: {{bookingLink}}

See you before next season — that's the whole point.

{{preparerName}}
{{businessName}}`,
    }),
  ],
};

/* ================================================================
 * 5. PAST-CLIENT REACTIVATION (21 days, 6 touches)
 * ================================================================ */
const reactivationSequence: DripTemplate = {
  id: 'drip-reactivation',
  name: 'Past-Client Win-Back',
  category: 'reactivation',
  goal: 'Reactivate clients who filed with us before but haven\'t engaged this season',
  audience: 'Clients from prior seasons with no current-season activity',
  durationDays: 21,
  recommendedTrigger: 'custom → no_activity_this_season (run in January)',
  description: 'Warm, personal win-back that leads with familiarity and last year\'s results, offers a loyalty incentive, and gracefully asks what changed if they\'ve moved on.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'booked',
      subject: `{{firstName}}, your file is already 80% ready for this year`,
      preheader: 'Returning clients skip almost all the paperwork. Here\'s your head start.',
      cta: { label: 'Reactivate My File', href: '{{portalLink}}' },
      strategyNote: 'Lead with the returning-client advantage: less friction than anywhere else.',
      body: `{{firstName}},

Good news that most people don't realize: as a returning {{businessName}} client, **your file is already about 80% ready** for this season.

We have your carryover data, your dependents, your prior-year AGI (which the IRS requires for e-file identity verification), your direct deposit details, and your deduction history. New-client onboarding? You skip essentially all of it.

Your entire to-do list this year:
1. Upload this year's income documents as they arrive
2. Tell us what changed (job, address, family, side income — 30 seconds in the portal)
3. Review and approve your return when we send the draft

That's it. {{preparerName}} still has your file and would genuinely love to see your name come through again.

One click to reactivate: {{portalLink}}

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 3, 'sms', {
      exitOn: 'booked',
      strategyNote: 'Familiar, warm, zero pressure.',
      body: `{{firstName}}! It\'s {{preparerName}} from {{businessName}} — tax season\'s here & your file is prepped and waiting. Returning clients skip all the setup. Ready when you are: {{portalLink}} (Reply STOP to opt out)`,
    }),
    step(3, 7, 'email', {
      exitOn: 'booked',
      subject: 'What changed for you in the last 12 months?',
      preheader: 'Job change? New baby? Side hustle? Each one moves your refund — usually up.',
      cta: { label: 'Update My File (2 min)', href: '{{portalLink}}' },
      strategyNote: 'Life-change angle: makes re-engagement feel necessary, not optional.',
      body: `{{firstName}},

Quick question that decides more of your refund than almost anything else: **what changed for you this year?**

Every one of these moves your tax picture — most of them in your favor if they're handled right:

• **New job or raise** → withholding check, possible bracket shift, new benefits to optimize
• **New baby or dependent** → Child Tax Credit, childcare credit, possible filing-status upgrade
• **Started a side hustle** → QBI deduction, home office, mileage, equipment write-offs
• **Bought or sold a home** → mortgage interest, points, property tax, possible exclusion on gain
• **Kid started college** → American Opportunity Credit (up to $2,500/yr)
• **Got married or divorced** → whole-file recalculation, and timing matters

Last year we handled your return, so we'll spot the *differences* instantly — that's the returning-client advantage.

Two minutes to tell us what changed: {{portalLink}}

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 12, 'email', {
      exitOn: 'booked',
      subject: `A loyalty thank-you for {{firstName}} (this season only)`,
      preheader: 'Returning clients get priority scheduling + our loyalty rate. Details inside.',
      cta: { label: 'Claim Returning-Client Priority', href: '{{bookingLink}}' },
      strategyNote: 'Incentive touch — priority + loyalty framing rather than discounting the craft.',
      body: `{{firstName}},

Short and honest one today.

You trusted {{businessName}} with your taxes before, and that means something to us. So returning clients get two things new clients don't:

**1. Priority scheduling.** Your file jumps the new-client queue. During peak season that's a 1–2 week head start on your refund.

**2. Our returning-client loyalty rate.** Your engagement this year is honored at your prior rate — even where our new-client pricing has increased.

No coupon codes, no gimmicks. Just: come back, get looked after first, pay what you paid.

Claim your slot: {{bookingLink}}

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(5, 16, 'sms', {
      exitOn: 'booked',
      strategyNote: 'Direct question — invites the real objection.',
      body: `{{firstName}}, honest question from {{preparerName}}: if you\'re filing elsewhere this year, no hard feelings — just reply MOVED so I close your file properly. If you\'re just busy, reply BUSY & I\'ll hold your priority slot another 2 weeks.`,
    }),
    step(6, 21, 'email', {
      exitOn: 'booked',
      subject: 'Closing your returning-client file (one last check)',
      preheader: 'Your carryover data stays safe either way — here\'s what happens next.',
      cta: { label: 'Wait — Reactivate Me', href: '{{portalLink}}' },
      strategyNote: 'Graceful close that leaves the door open and protects the relationship.',
      body: `{{firstName}},

This is my last note this season. I'm marking your file inactive for the year — here's exactly what that means:

**Your data stays protected.** Prior returns and carryover records are retained securely per IRS record-keeping rules. If you come back — this year or in three years — we pick up right where we left off.

**Your priority expires.** The returning-client rate and queue priority end this week, only because season capacity forces us to plan.

**The door stays open.** Mid-season emergency? IRS letter in July? Just call {{phone}}. Past clients always get taken seriously here, active file or not.

Whatever you choose this year, thank you for having trusted us before. That never expires.

{{preparerName}}
{{businessName}}

P.S. If this timing was just wrong and you *do* want in: {{portalLink}} — one click reactivates everything, today included.`,
    }),
  ],
};

/* ================================================================
 * 6. REFERRAL ENGINE (30 days, 5 touches)
 * ================================================================ */
const referralSequence: DripTemplate = {
  id: 'drip-referral',
  name: 'Referral Engine',
  category: 'referral',
  goal: 'Turn happy filed clients into a steady referral channel',
  audience: 'Clients with completed returns and positive sentiment (post-refund)',
  durationDays: 30,
  recommendedTrigger: 'deal_stage_changed → Refund Received',
  description: 'Ask at peak happiness, make sharing effortless, reward both sides, and reinforce with social proof.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'none',
      subject: `Who's the one person you know still stressed about taxes?`,
      preheader: 'Send them one link. You both get rewarded. That\'s the whole program.',
      cta: { label: 'Get My Referral Link', href: '{{portalLink}}referral' },
      strategyNote: 'Single-person framing converts better than "know anyone?" broadcast asks.',
      body: `{{firstName}},

Your return is filed, your refund is handled, and you're done stressing about taxes for the year.

Now — think of **one person** who isn't. The coworker who complains every March. The cousin with the side hustle and the shoebox of receipts. The friend who got an IRS letter and is pretending it doesn't exist.

**Here's the deal, and it's deliberately simple:**

1. Send them your personal referral link (button below)
2. When they file with {{businessName}}, **they get a first-year discount** on their preparation
3. **You get a referral reward** — credited to your next return or paid out, your choice

No caps. Three referrals? Three rewards. Some of our clients effectively file for free every year.

Why we do this: a warm referral from you beats any ad we could ever buy. So we'd rather pay you than a platform.

Your link is ready: {{portalLink}}referral

{{preparerName}}
{{businessName}}`,
    }),
    step(2, 5, 'sms', {
      exitOn: 'none',
      strategyNote: 'Make forwarding literally one tap.',
      body: `{{firstName}}, forward this to that one friend who\'s still doing taxes the hard way 👇\n\n"I use {{businessName}} — they found money my old preparer missed & handle everything virtually. Use my link & you get a discount: {{portalLink}}referral" (Reply STOP to opt out)`,
    }),
    step(3, 12, 'email', {
      exitOn: 'none',
      subject: 'Your referral reward is sitting at $0 (easy fix)',
      preheader: 'The 3 people most likely to thank you for this link.',
      cta: { label: 'Share My Link', href: '{{portalLink}}referral' },
      strategyNote: 'Concrete targeting: tell them WHO to send it to.',
      body: `{{firstName}},

Quick nudge on your referral link — and this time, let me make it concrete. The three people statistically most likely to *thank you* for sending it:

**1. Anyone who started a side hustle this year.** Gig drivers, Etsy sellers, freelancers, consultants. They're facing self-employment tax and quarterly payments for the first time, they're terrified of doing it wrong, and they are the exact clients we save the most money for.

**2. New parents.** Child Tax Credit, childcare credit, filing-status changes, dependent-care FSAs — the first return after a baby is a minefield of missable money.

**3. Anyone who got an IRS letter.** They're paralyzed. We handle notices every week and it costs them nothing to have us translate it. That favor turns into a client for life — and a reward for you.

One text, one link: {{portalLink}}referral

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 20, 'email', {
      exitOn: 'none',
      subject: `"I should've sent this to you months ago" — an actual referral story`,
      preheader: 'What happened when a client finally forwarded the link.',
      cta: { label: 'Send Mine Today', href: '{{portalLink}}referral' },
      strategyNote: 'Story-based social proof of referral outcomes.',
      body: `{{firstName}},

A story from this season (shared with permission, name changed):

Our client Marcus sat on his referral link for two months. Finally, at a family barbecue, his sister mentioned she'd been paying a "tax guy" $450 a year — who had never once asked about her home daycare business expenses.

Marcus sent the link that night.

We found: home-office use of her actual home (a daycare-specific calculation most preparers have never done), food program reimbursements handled wrong for years, and depreciation on equipment she'd expensed nowhere. **Her refund went up $4,700**, and we amended two prior years for more.

She got money she was legally owed all along. Marcus got his reward. His only comment: *"I should've sent this to you months ago."*

Someone in your circle has a version of this story waiting: {{portalLink}}referral

{{preparerName}}
{{businessName}}`,
    }),
    step(5, 30, 'sms', {
      exitOn: 'none',
      strategyNote: 'Final light-touch reminder; program is evergreen.',
      body: `{{firstName}}, your {{businessName}} referral link never expires — save this text! Anyone you send files with us: they save, you earn. {{portalLink}}referral — {{preparerName}}`,
    }),
  ],
};

/* ================================================================
 * 7. APPOINTMENT REMINDER & NO-SHOW RESCUE (7 days, 6 touches)
 * ================================================================ */
const appointmentSequence: DripTemplate = {
  id: 'drip-appointment',
  name: 'Appointment Reminder & No-Show Rescue',
  category: 'appointments',
  goal: 'Eliminate no-shows and instantly rescue the ones that happen',
  audience: 'Any contact with a scheduled appointment',
  durationDays: 7,
  recommendedTrigger: 'appointment_scheduled',
  description: 'Confirmation, 48h and 2h reminders with prep checklist, then an immediate two-step rescue if they miss.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'none',
      subject: `Confirmed: your appointment with {{preparerName}} ✅`,
      preheader: 'Date, time, link, and the 3 things to have ready.',
      cta: { label: 'Add to Calendar', href: '{{bookingLink}}' },
      strategyNote: 'Instant confirmation with prep list — prepared clients show up.',
      body: `{{firstName}},

You're locked in! Here's everything for your appointment with {{preparerName}} at {{businessName}}:

**📅 Your appointment details are in your calendar invite** (also attached to this email). It's a secure video call — the join link is in the invite, and it works from any phone, tablet, or computer. No downloads.

**Have these 3 things ready** (it makes your session twice as productive):

1. **Last year's tax return** — even just photos of it. It's our roadmap.
2. **This year's income documents** — whatever has arrived: W-2s, 1099s, K-1s. Missing some? Come anyway; we'll build the checklist together.
3. **Your questions.** Seriously — write them down. "Dumb" tax questions have saved our clients thousands.

**Need to reschedule?** Life happens — use the link below anytime up to 2 hours before, no penalty, no guilt.

See you soon,
{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 0, 'sms', {
      sendAt: '+5 minutes',
      exitOn: 'none',
      strategyNote: 'SMS confirmation doubles show rate vs email alone.',
      body: `{{firstName}}, you\'re confirmed with {{preparerName}} at {{businessName}}! 📅 Check your email/calendar for the video link. Have last year\'s return handy if you can. Need to move it? {{bookingLink}} (Reply STOP to opt out)`,
    }),
    step(3, 5, 'sms', {
      sendAt: '48 hours before',
      exitOn: 'none',
      strategyNote: '48-hour reminder with easy reschedule = fewer silent no-shows.',
      body: `Reminder: your tax appointment with {{preparerName}} is in 2 days! Reply C to confirm, or reschedule free here: {{bookingLink}} — {{businessName}}`,
    }),
    step(4, 7, 'sms', {
      sendAt: '2 hours before',
      exitOn: 'none',
      strategyNote: 'Day-of reminder with the join link right in the message.',
      body: `{{firstName}}, see you in 2 hours! 🕐 Join your video appointment from the link in your calendar invite. Grab last year\'s return + any W-2s/1099s. Running late? Just reply here. — {{preparerName}}`,
    }),
    step(5, 7, 'sms', {
      sendAt: '15 minutes after missed',
      exitOn: 'booked',
      strategyNote: 'No-show rescue #1 — immediate, warm, assume good faith.',
      body: `{{firstName}}, we missed you just now — no worries at all, life happens! {{preparerName}} kept your file out. Grab a new time that actually works: {{bookingLink}}`,
    }),
    step(6, 7, 'email', {
      sendAt: '4 hours after missed',
      exitOn: 'booked',
      subject: 'We held your file — pick a better time',
      preheader: 'No guilt, no fees. Two clicks and you\'re rebooked.',
      cta: { label: 'Rebook My Appointment', href: '{{bookingLink}}' },
      strategyNote: 'No-show rescue #2 — remove shame, restate value, rebook.',
      body: `{{firstName}},

We missed you today — and genuinely, it's fine. Between work, family, and everything else, calendars break. Nobody here is annoyed.

Here's where things stand:

• **Your file is still active.** Nothing is lost or reset.
• **{{preparerName}} is still your preparer.** All context retained.
• **There's no rebooking fee or penalty.** There never is.

The only thing that suffers from waiting is your refund timeline — every week unfiled is a week your money sits with the IRS instead of your bank account.

Two clicks to rebook, evening and weekend slots included: {{bookingLink}}

If something bigger is going on — you're reconsidering, budget worry, whatever it is — just reply and tell me straight. We'd rather solve the real thing.

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
  ],
};

/* ================================================================
 * 8. EXTENSION & COMPLIANCE GUARDIAN (180 days, 6 touches)
 * ================================================================ */
const complianceSequence: DripTemplate = {
  id: 'drip-compliance',
  name: 'Extension & Compliance Guardian',
  category: 'compliance',
  goal: 'Shepherd extended filers to October 15 and keep estimated-tax payers penalty-free',
  audience: 'Clients on extension (Form 4868) and quarterly estimated-tax payers',
  durationDays: 180,
  recommendedTrigger: 'deal_stage_changed → Extension Filed',
  description: 'Quarterly estimated-payment alerts and an escalating October run-up so no extended client ever blows the real deadline.',
  steps: [
    step(1, 0, 'email', {
      exitOn: 'filed',
      subject: 'Your extension is filed — here\'s exactly what it does (and doesn\'t) cover',
      preheader: 'You now have until Oct 15 to FILE. Paying was still due in April. Full picture inside.',
      strategyNote: 'Kill the #1 extension misunderstanding immediately.',
      body: `{{firstName}},

Your extension (Form 4868) is filed and accepted. You now have until **October 15** to file your return. Let's make sure the extension works *for* you:

**What your extension DOES:**
✅ Gives you until Oct 15 to file the actual return
✅ Eliminates the failure-to-*file* penalty (the big one — 5%/month)
✅ Buys time for missing K-1s, corrected 1099s, and real strategy work

**What it does NOT do:**
❌ Extend the time to *pay*. Tax owed was still due in April. That's why we calculated your safe-harbor payment — it keeps interest and the failure-to-*pay* penalty (0.5%/month) at or near zero.

**Your calm-season plan:**
• **June–July:** our quietest months = your file gets the most attention. We'll invite you to a summer prep slot.
• **Documents:** drip them into the portal as they arrive — especially late K-1s.
• **September:** hard cutoff for a comfortable, non-rushed October filing.

We track all of it and nudge you at each milestone. That's what the Guardian is for.

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(2, 45, 'sms', {
      exitOn: 'filed',
      strategyNote: 'Q2 estimated payment window (June 15).',
      body: `{{firstName}}, compliance alert from {{businessName}}: Q2 estimated tax payment is due June 15. If you\'re on our estimate schedule, pay the voucher amount at irs.gov/payments. Not sure what you owe? Reply ESTIMATE & we\'ll confirm your number. (Reply STOP to opt out)`,
    }),
    step(3, 60, 'email', {
      exitOn: 'filed',
      subject: 'Summer slot invitation: file your extended return while it\'s quiet',
      preheader: 'June filers get our best turnaround of the year. October-you says thanks.',
      cta: { label: 'Book My Summer Prep Slot', href: '{{bookingLink}}' },
      strategyNote: 'Convert the extension into a summer filing — best for client AND capacity.',
      body: `{{firstName}},

A secret from inside a tax practice: **June and July are the best months of the year to be a client.**

The season crowd is gone. Turnaround is at its fastest. {{preparerName}} can go deep on your file — the kind of second-look, what-about-this work that peak season doesn't allow.

And for extended filers there's a bonus most people never consider: **if you're owed a refund, it's been sitting at the IRS since April.** Filing in June instead of October puts that money in your account four months sooner. The IRS doesn't pay you meaningful interest for the privilege of holding it.

If you were waiting on a K-1 or corrected brokerage form — most have arrived by mid-summer. Check your mail pile, then check this calendar:

{{bookingLink}}

October-you will be very smug about this decision.

{{preparerName}}
{{businessName}}`,
    }),
    step(4, 120, 'email', {
      exitOn: 'filed',
      subject: '30 days to October 15 — status check on your extended return',
      preheader: 'This is the comfortable window. After this it gets expensive and stressful.',
      cta: { label: 'Send My Remaining Docs', href: '{{portalLink}}' },
      strategyNote: 'September push — the last relaxed window before deadline crunch.',
      body: `{{firstName}},

We're 30 days from October 15 — the *real* deadline. No second extension exists.

**Where extended clients stand right now, in three buckets:**

🟢 **Docs in, return in progress** — you're set. Draft review lands in your portal shortly.

🟡 **Partial docs in** — this week is the week. Your portal checklist shows exactly what's missing (usually 1–2 items). Upload them and you glide in comfortably.

🔴 **Nothing in yet** — I need to hear from you this week. Not to scold — to triage. Missing document? We may be able to reconstruct or substitute. Money stress? We have options. Just… lost track? Happens every year, no judgment, but the clock is real now.

The math worth remembering: if you owe and don't file by Oct 15, the failure-to-file penalty resumes at **5% per month**. Nothing about waiting gets cheaper.

Reply with your bucket — 🟢 🟡 or 🔴 — or just upload: {{portalLink}}

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
    step(5, 140, 'sms', {
      exitOn: 'filed',
      strategyNote: 'Q3 estimated payment (Sep 15) + deadline echo, combined touch.',
      body: `{{firstName}} — two dates from {{businessName}}: ① Q3 estimated payment due Sep 15 (irs.gov/payments). ② Extended return deadline Oct 15 — {{preparerName}} needs your docs 2 wks prior. Portal: {{portalLink}}`,
    }),
    step(6, 165, 'email', {
      exitOn: 'filed',
      subject: '🚨 FINAL: your extended return is due in 10 days',
      preheader: 'Everything from here is same-week turnaround. Act today.',
      cta: { label: 'Emergency Upload — Do It Now', href: '{{portalLink}}' },
      strategyNote: 'Final escalation. Direct, specific, action-only.',
      body: `{{firstName}},

Ten days to October 15. This is the final notice in the Guardian sequence, so it's short and all action:

**If your docs are in:** you're filed or about to be — watch your portal for the approval request and sign it the day it arrives.

**If they're not:** upload TODAY — {{portalLink}}. We are now in same-week turnaround mode, and complete files get priority. Phone photos, partial sets, whatever you have. Send it and reply "SENT" so we flag your file.

**If you cannot file by Oct 15:** call us anyway — {{phone}}. Even past-deadline, filing sooner always beats later: penalties compound monthly, and if you're owed a refund there's no penalty at all — you just have to actually file to get it (refunds expire after 3 years — the IRS keeps unclaimed money).

Ten days. Let's land this.

{{preparerName}}
{{businessName}} · {{phone}}`,
    }),
  ],
};

export const DRIP_LIBRARY: DripTemplate[] = [
  newLeadSequence,
  onboardingSequence,
  taxSeasonSequence,
  refundSequence,
  reactivationSequence,
  referralSequence,
  appointmentSequence,
  complianceSequence,
];

/** Install a library template as a live Campaign object */
export function installDripTemplate(tpl: DripTemplate, subAccountId?: string): Campaign {
  return {
    id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: tpl.name,
    type: tpl.steps.every(s => s.channel === 'email') ? 'email'
      : tpl.steps.every(s => s.channel === 'sms') ? 'sms' : 'both',
    status: 'draft',
    subject: tpl.steps.find(s => s.channel === 'email')?.subject,
    content: tpl.description,
    recipientCount: 0, sentCount: 0, openedCount: 0, clickedCount: 0,
    createdAt: new Date(),
    sequence: tpl.steps.map(s => ({ ...s, id: `${s.id}-${Math.random().toString(36).slice(2, 6)}` })),
    audience: tpl.audience,
    goal: tpl.goal,
    sourceTemplateId: tpl.id,
    subAccountId,
  };
}
