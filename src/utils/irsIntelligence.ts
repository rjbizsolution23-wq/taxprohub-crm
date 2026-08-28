/**
 * IRS INTELLIGENCE ENGINE — Tax Year 2025 (returns filed in 2026)
 * ------------------------------------------------------------------
 * Deterministic, on-device tax computation and IRS knowledge:
 *  • Federal brackets, standard deductions, credit tables (TY2025, Rev. Proc. 2024-40)
 *  • Refund estimator (wages, withholding, credits, SE income)
 *  • Refund timeline predictor (e-file/paper, DD/check, PATH Act holds)
 *  • IRS notice decoder — plain-English + action playbooks
 *  • Penalty & interest calculators (FTF, FTP, estimated tax)
 *  • Quarterly estimated payment scheduler
 * No API keys required — this is codified IRS knowledge.
 */

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh' | 'qss';

/* ============ TY2025 TABLES (Rev. Proc. 2024-40 + OBBBA updates) ============ */

export const STANDARD_DEDUCTION_2025: Record<FilingStatus, number> = {
  single: 15750, mfj: 31500, mfs: 15750, hoh: 23625, qss: 31500,
};

export const ADDITIONAL_65_OR_BLIND_2025 = { unmarried: 2000, married: 1600 };

export interface Bracket { rate: number; upTo: number }
export const BRACKETS_2025: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0.10, upTo: 11925 }, { rate: 0.12, upTo: 48475 }, { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 }, { rate: 0.32, upTo: 250525 }, { rate: 0.35, upTo: 626350 },
    { rate: 0.37, upTo: Infinity },
  ],
  mfj: [
    { rate: 0.10, upTo: 23850 }, { rate: 0.12, upTo: 96950 }, { rate: 0.22, upTo: 206700 },
    { rate: 0.24, upTo: 394600 }, { rate: 0.32, upTo: 501050 }, { rate: 0.35, upTo: 751600 },
    { rate: 0.37, upTo: Infinity },
  ],
  mfs: [
    { rate: 0.10, upTo: 11925 }, { rate: 0.12, upTo: 48475 }, { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 }, { rate: 0.32, upTo: 250525 }, { rate: 0.35, upTo: 375800 },
    { rate: 0.37, upTo: Infinity },
  ],
  hoh: [
    { rate: 0.10, upTo: 17000 }, { rate: 0.12, upTo: 64850 }, { rate: 0.22, upTo: 103350 },
    { rate: 0.24, upTo: 197300 }, { rate: 0.32, upTo: 250500 }, { rate: 0.35, upTo: 626350 },
    { rate: 0.37, upTo: Infinity },
  ],
  qss: [
    { rate: 0.10, upTo: 23850 }, { rate: 0.12, upTo: 96950 }, { rate: 0.22, upTo: 206700 },
    { rate: 0.24, upTo: 394600 }, { rate: 0.32, upTo: 501050 }, { rate: 0.35, upTo: 751600 },
    { rate: 0.37, upTo: Infinity },
  ],
};

/** EITC maximums TY2025 by qualifying children (0–3+) */
export const EITC_2025 = {
  maxCredit: [649, 4328, 7152, 8046],
  // AGI limits (phaseout complete): [single/hoh/qss, mfj]
  agiLimit: [
    { other: 19104, mfj: 26214 },
    { other: 50434, mfj: 57554 },
    { other: 57310, mfj: 64430 },
    { other: 61555, mfj: 68675 },
  ],
  investmentIncomeLimit: 11950,
};

export const CTC_2025 = {
  perChild: 2200,           // OBBBA increased from $2,000
  refundableMax: 1700,      // ACTC portion
  phaseoutStart: { mfj: 400000, other: 200000 },
  phaseoutRatePer1000: 50,
  odcPerDependent: 500,     // credit for other dependents
};

export const SE_TAX = {
  rate: 0.153,              // 12.4% SS + 2.9% Medicare
  ssWageBase2025: 176100,
  netEarningsFactor: 0.9235,
  deductionShare: 0.5,
};

export const EDUCATION_CREDITS = {
  aotc: { max: 2500, refundablePct: 0.4, phaseout: { single: [80000, 90000], mfj: [160000, 180000] } },
  llc: { max: 2000, phaseout: { single: [80000, 90000], mfj: [160000, 180000] } },
};

export const RETIREMENT_LIMITS_2025 = {
  ira: 7000, iraCatchup50: 1000,
  k401: 23500, k401Catchup50: 7500, k401Catchup60to63: 11250,
  hsaSelf: 4300, hsaFamily: 8550, hsaCatchup55: 1000,
  saversCreditMaxAGI: { mfj: 79000, hoh: 59250, single: 39500 },
};

export const KEY_DEADLINES = [
  { date: '2026-01-15', label: 'Q4 2025 estimated tax payment due' },
  { date: '2026-01-26', label: 'IRS e-file opening (typical window)' },
  { date: '2026-01-31', label: 'W-2s & most 1099s due to recipients' },
  { date: '2026-02-17', label: 'PATH Act: earliest EITC/ACTC refund release' },
  { date: '2026-03-16', label: 'S-corp (1120-S) & partnership (1065) returns due' },
  { date: '2026-04-15', label: 'Individual returns + payment due · Q1 2026 estimate due · IRA/HSA funding deadline' },
  { date: '2026-06-15', label: 'Q2 2026 estimated payment · expat filing deadline' },
  { date: '2026-09-15', label: 'Q3 2026 estimate · extended business returns due' },
  { date: '2026-10-15', label: 'Extended individual returns due (final)' },
];

/* ======================= TAX & REFUND COMPUTATION ======================= */

export function computeIncomeTax(taxableIncome: number, status: FilingStatus): number {
  let tax = 0, prev = 0;
  for (const b of BRACKETS_2025[status]) {
    if (taxableIncome > prev) {
      tax += (Math.min(taxableIncome, b.upTo) - prev) * b.rate;
      prev = b.upTo;
    } else break;
  }
  return Math.max(0, Math.round(tax));
}

export function marginalRate(taxableIncome: number, status: FilingStatus): number {
  for (const b of BRACKETS_2025[status]) if (taxableIncome <= b.upTo) return b.rate;
  return 0.37;
}

export interface RefundInput {
  status: FilingStatus;
  wages: number;
  federalWithheld: number;
  seNetProfit?: number;        // Schedule C net profit
  estimatedPayments?: number;
  qualifyingChildrenUnder17?: number;
  otherDependents?: number;
  eitcEligible?: boolean;
  studentAOTC?: number;        // count of AOTC-eligible students
  itemizedDeductions?: number; // if > standard, we itemize
  age65OrOlder?: boolean;
  spouse65OrOlder?: boolean;
}

export interface RefundResult {
  agi: number;
  deduction: number;
  deductionType: 'standard' | 'itemized';
  taxableIncome: number;
  incomeTax: number;
  seTax: number;
  qbiDeduction: number;
  ctc: number;
  actcRefundable: number;
  odc: number;
  eitc: number;
  aotc: number;
  totalTax: number;
  totalPayments: number;
  refund: number;               // positive = refund, negative = owed
  effectiveRate: number;
  marginalRate: number;
  pathActHold: boolean;
  lines: { label: string; amount: number; note?: string }[];
}

export function estimateRefund(inp: RefundInput): RefundResult {
  const lines: RefundResult['lines'] = [];
  const seNet = inp.seNetProfit || 0;

  // SE tax
  const seBase = seNet > 400 ? seNet * SE_TAX.netEarningsFactor : 0;
  const ssPortion = Math.min(seBase, SE_TAX.ssWageBase2025) * 0.124;
  const medicarePortion = seBase * 0.029;
  const seTax = Math.round(ssPortion + medicarePortion);
  const seDeduction = Math.round(seTax * SE_TAX.deductionShare);

  const agi = Math.max(0, Math.round(inp.wages + seNet - seDeduction));
  lines.push({ label: 'Total income', amount: inp.wages + seNet });
  if (seDeduction) lines.push({ label: '½ SE tax deduction', amount: -seDeduction });
  lines.push({ label: 'Adjusted Gross Income (AGI)', amount: agi });

  // Deduction
  let std = STANDARD_DEDUCTION_2025[inp.status];
  const extra = ADDITIONAL_65_OR_BLIND_2025;
  if (inp.age65OrOlder) std += (inp.status === 'mfj' || inp.status === 'qss') ? extra.married : extra.unmarried;
  if (inp.spouse65OrOlder && inp.status === 'mfj') std += extra.married;
  const itemized = inp.itemizedDeductions || 0;
  const deductionType: 'standard' | 'itemized' = itemized > std ? 'itemized' : 'standard';
  const deduction = Math.max(std, itemized);
  lines.push({ label: `${deductionType === 'standard' ? 'Standard' : 'Itemized'} deduction`, amount: -deduction });

  // QBI (simplified 20% of SE profit, subject to taxable income limit)
  const preQbiTaxable = Math.max(0, agi - deduction);
  const qbiDeduction = seNet > 0 ? Math.round(Math.min(seNet * 0.2, preQbiTaxable * 0.2)) : 0;
  if (qbiDeduction) lines.push({ label: 'QBI deduction (20%)', amount: -qbiDeduction, note: 'Simplified — subject to limits' });

  const taxableIncome = Math.max(0, preQbiTaxable - qbiDeduction);
  lines.push({ label: 'Taxable income', amount: taxableIncome });

  const incomeTax = computeIncomeTax(taxableIncome, inp.status);
  lines.push({ label: 'Income tax (2025 brackets)', amount: incomeTax });
  if (seTax) lines.push({ label: 'Self-employment tax', amount: seTax });

  // CTC / ODC with phaseout
  const kids = inp.qualifyingChildrenUnder17 || 0;
  const odcCount = inp.otherDependents || 0;
  const phaseStart = inp.status === 'mfj' ? CTC_2025.phaseoutStart.mfj : CTC_2025.phaseoutStart.other;
  const phaseReduction = agi > phaseStart ? Math.ceil((agi - phaseStart) / 1000) * CTC_2025.phaseoutRatePer1000 : 0;
  const grossCtc = Math.max(0, kids * CTC_2025.perChild + odcCount * CTC_2025.odcPerDependent - phaseReduction);
  const ctcNonRefundableUsed = Math.min(grossCtc, incomeTax);
  const actcRefundable = Math.min(Math.max(0, grossCtc - ctcNonRefundableUsed), kids * CTC_2025.refundableMax);
  const ctc = ctcNonRefundableUsed;
  const odc = Math.min(odcCount * CTC_2025.odcPerDependent, grossCtc);
  if (kids || odcCount) lines.push({ label: 'Child Tax Credit / ODC', amount: -(ctc + actcRefundable), note: actcRefundable ? `incl. $${actcRefundable.toLocaleString()} refundable ACTC` : undefined });

  // EITC (simplified table lookup at max, linear-ish midpoint estimate)
  let eitc = 0;
  if (inp.eitcEligible) {
    const n = Math.min(kids, 3);
    const limit = inp.status === 'mfj' ? EITC_2025.agiLimit[n].mfj : EITC_2025.agiLimit[n].other;
    if (agi < limit) {
      const pct = 1 - agi / limit;
      eitc = Math.round(EITC_2025.maxCredit[n] * Math.min(1, pct * 1.6));
      lines.push({ label: 'Earned Income Tax Credit (est.)', amount: -eitc, note: 'Estimate — exact via EITC tables' });
    }
  }

  // AOTC
  let aotc = 0;
  if (inp.studentAOTC) {
    const [phL, phH] = inp.status === 'mfj' ? EDUCATION_CREDITS.aotc.phaseout.mfj : EDUCATION_CREDITS.aotc.phaseout.single;
    if (agi < phH) {
      const factor = agi <= phL ? 1 : (phH - agi) / (phH - phL);
      aotc = Math.round(inp.studentAOTC * EDUCATION_CREDITS.aotc.max * factor);
      lines.push({ label: 'American Opportunity Credit', amount: -aotc });
    }
  }

  const totalTax = Math.max(0, incomeTax - ctc - Math.round(aotc * 0.6)) + seTax;
  const refundableCredits = actcRefundable + eitc + Math.round(aotc * EDUCATION_CREDITS.aotc.refundablePct);
  const totalPayments = inp.federalWithheld + (inp.estimatedPayments || 0) + refundableCredits;
  const refund = Math.round(totalPayments - totalTax);
  lines.push({ label: 'Total tax', amount: totalTax });
  lines.push({ label: 'Withholding + payments + refundable credits', amount: totalPayments });
  lines.push({ label: refund >= 0 ? 'ESTIMATED REFUND' : 'ESTIMATED BALANCE DUE', amount: Math.abs(refund) });

  return {
    agi, deduction, deductionType, taxableIncome, incomeTax, seTax, qbiDeduction,
    ctc, actcRefundable, odc, eitc, aotc, totalTax, totalPayments, refund,
    effectiveRate: agi > 0 ? totalTax / agi : 0,
    marginalRate: marginalRate(taxableIncome, inp.status),
    pathActHold: eitc > 0 || actcRefundable > 0,
    lines,
  };
}

/* ======================= REFUND TIMELINE PREDICTOR ======================= */

export interface TimelineInput {
  filedDate: Date;
  method: 'efile' | 'paper';
  deposit: 'direct' | 'check';
  hasEitcOrActc: boolean;
}
export interface TimelineMilestone { label: string; date: Date; detail: string; status: 'done' | 'active' | 'upcoming' }

export function predictRefundTimeline(inp: TimelineInput): TimelineMilestone[] {
  const d = (days: number) => new Date(inp.filedDate.getTime() + days * 86400000);
  const now = new Date();
  const acceptance = inp.method === 'efile' ? d(2) : d(28);
  const pathRelease = new Date('2026-02-17');
  let approved = inp.method === 'efile' ? d(14) : d(42);
  if (inp.hasEitcOrActc && approved < pathRelease) approved = pathRelease;
  const sent = new Date(approved.getTime() + 3 * 86400000);
  const inHand = inp.deposit === 'direct'
    ? new Date(sent.getTime() + 2 * 86400000)
    : new Date(sent.getTime() + 14 * 86400000);

  const mk = (label: string, date: Date, detail: string): TimelineMilestone => ({
    label, date, detail,
    status: date < now ? 'done' : (date.getTime() - now.getTime() < 4 * 86400000 ? 'active' : 'upcoming'),
  });

  return [
    mk('Return Filed', inp.filedDate, inp.method === 'efile' ? 'Transmitted electronically to the IRS.' : 'Mailed — paper returns add 4+ weeks to every step.'),
    mk('IRS Acceptance', acceptance, 'Identity & math checks passed; return officially in processing. Track via Where\'s My Refund (updates overnight, once daily).'),
    ...(inp.hasEitcOrActc ? [mk('PATH Act Release', pathRelease, 'Federal law holds ALL EITC/ACTC refunds until mid-February — this applies to everyone claiming these credits and is not an error.')] : []),
    mk('Refund Approved', approved, 'IRS finished processing and scheduled the refund.'),
    mk('Refund Sent', sent, inp.deposit === 'direct' ? 'ACH transfer initiated to your bank.' : 'Paper check printed and mailed.'),
    mk('Money In Hand', inHand, inp.deposit === 'direct' ? 'Direct deposits typically post within 1–2 banking days of send.' : 'Mailed checks typically arrive in 1–2 weeks.'),
  ];
}

/* ======================= IRS NOTICE DECODER ======================= */

export interface NoticePlaybook {
  code: string;
  title: string;
  severity: 'info' | 'action' | 'urgent';
  meaning: string;
  deadline: string;
  playbook: string[];
  clientScript: string;
}

export const IRS_NOTICES: NoticePlaybook[] = [
  {
    code: 'CP2000', title: 'Underreported Income Proposal', severity: 'action',
    meaning: 'The IRS matched third-party forms (W-2s/1099s) against the return and found income it believes was omitted. This is a PROPOSED change, not a bill — and the IRS matching is frequently wrong on basis, rollovers, and duplicated forms.',
    deadline: '30 days from notice date to respond (extendable by phone)',
    playbook: [
      'Pull the notice\'s income comparison table and match line-by-line against client\'s source documents',
      'Common false positives: 1099-B without basis (broker reported proceeds only), 401k/IRA rollovers coded as distributions, duplicate corrected 1099s',
      'If IRS is right: respond agreeing, arrange payment/plan — penalties often abatable for first-time offenders (FTA)',
      'If IRS is wrong: respond with documentation — corrected basis statement, rollover confirmation, or corrected 1099',
      'Never ignore: silence converts the proposal into an assessed deficiency (CP3219A, 90-day letter)',
    ],
    clientScript: 'This is the IRS computer noticing a mismatch — it\'s a question, not a verdict. We respond with documentation and in our experience a large share of these close with no change or a much smaller number. Do not pay the amount on the letter until we\'ve verified their math.',
  },
  {
    code: 'CP12', title: 'Math Error — Refund Adjusted', severity: 'info',
    meaning: 'The IRS corrected a calculation on the return and changed the refund amount. Often involves recovery credits, estimated payment mismatches, or credit eligibility recomputation.',
    deadline: '60 days to dispute the correction, otherwise it stands',
    playbook: [
      'Compare the IRS-corrected figures against our filed return line by line',
      'Verify estimated payments claimed vs. IRS transcript (pull account transcript)',
      'If the IRS is wrong, respond within 60 days — after that, formal amendment/abatement is required',
      'Update the client\'s refund tracker with the corrected amount',
    ],
    clientScript: 'The IRS adjusted a line and changed your refund. Sometimes they\'re right, sometimes they\'ve missed a payment you made. We verify their math before accepting anything — give us 48 hours.',
  },
  {
    code: '5071C', title: 'Identity Verification Required', severity: 'action',
    meaning: 'The IRS flagged the return for possible identity theft and will not process it until the taxpayer verifies identity. Very common for early filers and first-time e-filers.',
    deadline: 'Return processing is frozen until verification completes',
    playbook: [
      'Verify ONLY via official channels: idverify.irs.gov or the toll-free number ON the letter',
      'Client needs: the letter, prior-year return, current return, and supporting docs',
      'Refund clock restarts after verification — expect up to 9 weeks post-verification',
      'If the client did NOT file the return in question → identity theft: file Form 14039 immediately',
    ],
    clientScript: 'Good news wrapped in scary paper: the IRS is protecting your identity. It\'s a 15-minute verification and we\'ll walk you through it live. Only use the official IRS site or the phone number printed on the letter — never a number from a search engine.',
  },
  {
    code: 'CP05', title: 'Return Under Review — Refund Held', severity: 'info',
    meaning: 'The IRS is verifying income, withholding, or credits before releasing the refund. No response is required; most resolve automatically within 60 days.',
    deadline: 'None — wait up to 60 days before escalation',
    playbook: [
      'Confirm nothing is required from the client (a plain CP05 asks nothing)',
      'Calendar +60 days; if unresolved, contact IRS or engage Taxpayer Advocate Service',
      'If CP05A arrives instead, it DOES request documents — respond with W-2s/paystubs supporting withholding',
    ],
    clientScript: 'The IRS is double-checking before paying — nothing is wrong and nothing is needed from you. Most of these clear within 60 days on their own. We\'ve calendared it and will escalate for you if it stalls.',
  },
  {
    code: 'CP14', title: 'Balance Due — First Notice', severity: 'action',
    meaning: 'First bill for unpaid tax. Interest and failure-to-pay penalty accrue until paid. Ignoring it triggers the escalating collection sequence (CP501→503→504→LT11).',
    deadline: '21 days to pay before additional notices (10 business days if ≥ $100k)',
    playbook: [
      'Verify the balance against the return and account transcript',
      'Full pay if possible: IRS Direct Pay same-day',
      'Can\'t full-pay: short-term plan (≤180 days, no setup fee) or streamlined installment agreement (≤$50k, online)',
      'Check first-time penalty abatement (FTA) eligibility — clean 3-year history usually qualifies',
      'Never let it reach CP504/LT11 — that\'s levy territory',
    ],
    clientScript: 'This is a bill, and bills from the IRS only grow. We have three good options — pay, short-term plan, or installment agreement — and likely a penalty waiver if your history is clean. Let\'s pick one this week.',
  },
  {
    code: 'CP2000-ALT LT11', title: 'Final Notice of Intent to Levy', severity: 'urgent',
    meaning: 'The IRS intends to seize assets (bank accounts, wages) after 30 days. This is the last stop before enforced collection — and the gateway to appeal rights.',
    deadline: '30 days to request a Collection Due Process (CDP) hearing — this deadline is jurisdictional',
    playbook: [
      'File Form 12153 (CDP hearing request) within 30 days — this legally STOPS the levy while the case is heard',
      'Simultaneously build the resolution: installment agreement, offer in compromise, or currently-not-collectible status',
      'Pull full account transcripts to verify every assessed year',
      'This is representation-level work — engage the EA/CPA formally with Form 2848 (POA)',
    ],
    clientScript: 'This letter has a hard 30-day deadline that protects your paycheck and bank account — we will not miss it. Filing the hearing request stops the levy legally while we negotiate. From here forward, the IRS talks to us, not to you.',
  },
  {
    code: 'CP49', title: 'Refund Applied to Other Debt', severity: 'info',
    meaning: 'The refund (or part of it) was offset against a prior federal tax debt. Related: Treasury Offset Program can grab refunds for student loans, child support, and state debts.',
    deadline: 'None, informational — but verify the underlying debt',
    playbook: [
      'Verify the debt is real and correctly calculated (transcripts)',
      'If spouse\'s debt consumed a joint refund → Injured Spouse claim (Form 8379) recovers the innocent spouse\'s share',
      'Plan next year: adjust withholding so less refund is exposed to offset',
    ],
    clientScript: 'Your refund was intercepted to pay an existing government debt. We\'ll verify it\'s legitimate and correctly applied — and if the debt was your spouse\'s alone, we can often recover your share.',
  },
  {
    code: 'CP75', title: 'EITC/Credit Audit — Documents Requested', severity: 'action',
    meaning: 'The IRS is auditing the Earned Income Credit, CTC, or filing status claimed and wants proof before releasing the refund.',
    deadline: '30 days to send documentation',
    playbook: [
      'Assemble residency proof for each qualifying child: school records, medical records, lease showing same address',
      'Relationship proof: birth certificates chaining child to taxpayer',
      'Income proof for self-employed EITC claims: ledgers, 1099-Ks, bank statements',
      'Respond ONCE, complete — piecemeal responses reset clocks and frustrate examiners',
    ],
    clientScript: 'The IRS wants proof of what we claimed — normal for credit-heavy returns, and we prepared for this. We\'ll assemble one complete, organized response. Send us school or doctor records showing the kids at your address and we handle the rest.',
  },
];

export function decodeNotice(input: string): NoticePlaybook | null {
  const norm = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return IRS_NOTICES.find(n => norm.includes(n.code.replace(/[^A-Z0-9]/g, ''))) ||
    IRS_NOTICES.find(n => n.code.split(' ').some(part => part.length > 2 && norm.includes(part.replace(/[^A-Z0-9]/g, '')))) || null;
}

/* ======================= PENALTY CALCULATORS ======================= */

export interface PenaltyResult {
  failureToFile: number;
  failureToPay: number;
  interest: number;
  total: number;
  explanation: string[];
}

/** IRS interest rate for underpayments (Q1 2026 assumption: 7% annually, compounded daily ~ approximated monthly here) */
const IRS_INTEREST_ANNUAL = 0.07;

export function computePenalties(balanceDue: number, monthsLate: number, filedButUnpaid: boolean): PenaltyResult {
  const months = Math.max(0, Math.ceil(monthsLate));
  const explanation: string[] = [];

  // Failure to file: 5%/mo up to 25%, reduced by FTP in overlapping months
  let ftf = 0;
  if (!filedButUnpaid) {
    const ftfMonths = Math.min(months, 5);
    ftf = balanceDue * 0.05 * ftfMonths;
    // FTF is reduced by FTP for the same months (net 4.5%)
    ftf -= balanceDue * 0.005 * ftfMonths;
    explanation.push(`Failure-to-file: 4.5%/mo net (5% minus overlapping 0.5% FTP) × ${ftfMonths} mo, capped at 22.5% net`);
    if (months >= 2 && balanceDue > 0) {
      explanation.push('Minimum FTF penalty after 60 days: lesser of $510 or 100% of unpaid tax (2025 amount)');
      ftf = Math.max(ftf, Math.min(510, balanceDue));
    }
  }

  // Failure to pay: 0.5%/mo up to 25%
  const ftpMonths = Math.min(months, 50);
  const ftp = balanceDue * 0.005 * ftpMonths;
  explanation.push(`Failure-to-pay: 0.5%/mo × ${ftpMonths} mo (max 25%)`);

  // Interest, approximated monthly compounding
  const interest = balanceDue * (Math.pow(1 + IRS_INTEREST_ANNUAL / 12, months) - 1);
  explanation.push(`Interest: ~${(IRS_INTEREST_ANNUAL * 100).toFixed(0)}% annual, compounding — never abatable, unlike penalties`);
  explanation.push('First-Time Abatement (FTA): penalties (not interest) often waived with a clean prior 3-year compliance history — always request it.');

  const failureToFile = Math.round(Math.min(ftf, balanceDue * 0.225));
  const failureToPay = Math.round(Math.min(ftp, balanceDue * 0.25));
  return {
    failureToFile, failureToPay, interest: Math.round(interest),
    total: failureToFile + failureToPay + Math.round(interest),
    explanation,
  };
}

/* ======================= QUARTERLY ESTIMATES ======================= */

export interface EstimateSchedule {
  safeHarborBasis: string;
  annualTarget: number;
  quarterly: { label: string; due: string; amount: number }[];
}

export function buildEstimateSchedule(priorYearTax: number, expectedCurrentTax: number, agiOver150k: boolean): EstimateSchedule {
  // Safe harbor: lesser of 90% current-year or 100% prior-year (110% if AGI > $150k)
  const priorSafe = priorYearTax * (agiOver150k ? 1.10 : 1.0);
  const currentSafe = expectedCurrentTax * 0.9;
  const target = Math.round(Math.min(priorSafe, currentSafe));
  const q = Math.ceil(target / 4);
  return {
    safeHarborBasis: priorSafe <= currentSafe
      ? `${agiOver150k ? '110%' : '100%'} of prior-year tax ($${Math.round(priorSafe).toLocaleString()}) — the safer, fixed target`
      : `90% of expected current-year tax ($${Math.round(currentSafe).toLocaleString()})`,
    annualTarget: target,
    quarterly: [
      { label: 'Q1', due: 'April 15', amount: q },
      { label: 'Q2', due: 'June 15', amount: q },
      { label: 'Q3', due: 'September 15', amount: q },
      { label: 'Q4', due: 'January 15 (next year)', amount: target - q * 3 },
    ],
  };
}

/* ======================= WITHHOLDING CHECKUP ======================= */

export function withholdingCheckup(annualWages: number, currentWithholding: number, status: FilingStatus, kids: number): {
  projectedTax: number; projectedGap: number; recommendation: string;
} {
  const std = STANDARD_DEDUCTION_2025[status];
  const taxable = Math.max(0, annualWages - std);
  const gross = computeIncomeTax(taxable, status);
  const ctc = Math.min(kids * CTC_2025.perChild, gross);
  const projectedTax = Math.max(0, gross - ctc);
  const gap = currentWithholding - projectedTax;
  let recommendation: string;
  if (Math.abs(gap) < 500) recommendation = 'Withholding is dialed in — within $500 of projected liability. No W-4 change needed.';
  else if (gap > 0) recommendation = `Over-withholding by ~$${gap.toLocaleString()}/yr — that's an interest-free loan to the IRS of $${Math.round(gap / 12).toLocaleString()}/mo. File a new W-4 claiming appropriate credits to move it into your paycheck.`;
  else recommendation = `Under-withholding by ~$${Math.abs(gap).toLocaleString()}/yr — heading for a surprise bill and possible underpayment penalty. File a new W-4 with additional withholding of $${Math.ceil(Math.abs(gap) / 12 / 10) * 10}/mo, or start quarterly estimates.`;
  return { projectedTax, projectedGap: gap, recommendation };
}
