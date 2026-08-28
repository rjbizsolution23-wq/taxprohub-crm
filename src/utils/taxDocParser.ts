/**
 * 🧾 RJ BUSINESS SOLUTIONS — IRS FORM INTELLIGENCE PARSER (ZERO-KEY)
 * Deterministic, box-by-box structured extraction from OCR'd tax documents.
 *
 * Recognizes & classifies: W-2, 1099-NEC, 1099-MISC, 1099-INT, 1099-DIV,
 * 1099-B, 1099-R, 1099-K, 1098 (Mortgage), 1098-T, SSA-1099, K-1 (1065/1120S),
 * 1040, 940/941, plus generic ID documents.
 *
 * No LLM required — pure pattern intelligence engineered against real IRS
 * form layouts. Every extracted field carries a confidence + source snippet
 * so preparers can verify against the original document (Circular 230 §10.22
 * diligence-as-to-accuracy support).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaxFormType =
  | 'W-2' | '1099-NEC' | '1099-MISC' | '1099-INT' | '1099-DIV' | '1099-B'
  | '1099-R' | '1099-K' | '1099-G' | '1098' | '1098-T' | 'SSA-1099'
  | 'K-1' | '1040' | '941' | '940' | 'ID-DOCUMENT' | 'UNKNOWN';

export interface ExtractedField {
  key: string;            // machine key e.g. "box1_wages"
  label: string;          // human label e.g. "Box 1 — Wages, tips, other comp"
  value: string;          // normalized value
  raw?: string;           // raw matched snippet for audit trail
  confidence: number;     // 0-100
  category: 'identity' | 'employer' | 'income' | 'withholding' | 'deduction' | 'account' | 'meta';
}

export interface ParsedTaxDocument {
  formType: TaxFormType;
  formConfidence: number;
  taxYear?: string;
  fields: ExtractedField[];
  identity: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    ssnLast4?: string;
    ssnMasked?: string;
    ein?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    email?: string;
    phone?: string;
  };
  employer: {
    name?: string;
    ein?: string;
    address?: string;
  };
  totals: {
    totalIncome?: number;
    federalWithholding?: number;
    stateWithholding?: number;
    socialSecurityWages?: number;
    medicareWages?: number;
  };
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Comma-grouped amounts first, otherwise a FULL digit run (\b prevents
// partial matches like "202" being clipped out of the year "2025").
const MONEY = /\$?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(\.[0-9]{2})?\b/;

function parseMoney(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const m = s.match(MONEY);
  if (!m) return undefined;
  return parseFloat(m[1].replace(/,/g, '') + (m[2] || ''));
}

function fmtMoney(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * True when a token is almost certainly a stray year / form number rather than
 * a dollar amount (e.g. "2025" in "Form 1099-NEC Nonemployee Compensation 2025").
 */
function looksLikeYearNotAmount(matched: string, value: number): boolean {
  const hasCentsOrComma = /[.,]/.test(matched);
  return !hasCentsOrComma && Number.isInteger(value) && value >= 1900 && value <= 2100;
}

/** Finds a money amount on the same line as (or the line after) a label regex. */
function findAmountNear(lines: string[], labelRe: RegExp, lookahead = 2): { value: number; raw: string } | undefined {
  let weak: { value: number; raw: string } | undefined;
  for (let i = 0; i < lines.length; i++) {
    if (labelRe.test(lines[i])) {
      // Same line, take the amount AFTER the label text
      const after = lines[i].replace(labelRe, '¤');
      const tail = after.slice(after.indexOf('¤'));
      const same = tail.match(new RegExp(MONEY.source));
      if (same) {
        const v = parseMoney(same[0]);
        if (v !== undefined) {
          if (looksLikeYearNotAmount(same[0].trim(), v)) {
            weak ||= { value: v, raw: lines[i].trim() };
          } else {
            return { value: v, raw: lines[i].trim() };
          }
        }
      }
      // Look ahead lines
      for (let j = 1; j <= lookahead && i + j < lines.length; j++) {
        const m = lines[i + j].match(new RegExp('^\\s*' + MONEY.source));
        if (m) {
          const v = parseMoney(m[0]);
          if (v !== undefined && !looksLikeYearNotAmount(m[0].trim(), v)) {
            return { value: v, raw: `${lines[i].trim()} → ${lines[i + j].trim()}` };
          }
        }
      }
      // Keep scanning — a later occurrence of the label (the actual box row)
      // may carry the real amount, e.g. headers repeat the box title.
    }
  }
  return weak;
}

function findText(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m ? (m[1] || m[0]).trim() : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form classification
// ─────────────────────────────────────────────────────────────────────────────

const CLASSIFIERS: Array<{ type: TaxFormType; score: (t: string) => number }> = [
  { type: 'W-2', score: (t) => (/(form\s*w-?2|wage and tax statement)/i.test(t) ? 60 : 0) + (/wages,?\s*tips/i.test(t) ? 25 : 0) + (/social security wages/i.test(t) ? 15 : 0) },
  { type: '1099-NEC', score: (t) => (/1099[-\s]?NEC/i.test(t) ? 70 : 0) + (/nonemployee compensation/i.test(t) ? 30 : 0) },
  { type: '1099-MISC', score: (t) => (/1099[-\s]?MISC/i.test(t) ? 70 : 0) + (/miscellaneous (income|information)/i.test(t) ? 30 : 0) },
  { type: '1099-INT', score: (t) => (/1099[-\s]?INT/i.test(t) ? 70 : 0) + (/interest income/i.test(t) ? 30 : 0) },
  { type: '1099-DIV', score: (t) => (/1099[-\s]?DIV/i.test(t) ? 70 : 0) + (/ordinary dividends/i.test(t) ? 30 : 0) },
  { type: '1099-B', score: (t) => (/1099[-\s]?B\b/i.test(t) ? 70 : 0) + (/proceeds from broker/i.test(t) ? 30 : 0) },
  { type: '1099-R', score: (t) => (/1099[-\s]?R\b/i.test(t) ? 70 : 0) + (/pensions?,? annuities/i.test(t) ? 30 : 0) },
  { type: '1099-K', score: (t) => (/1099[-\s]?K\b/i.test(t) ? 70 : 0) + (/payment card and third party/i.test(t) ? 30 : 0) },
  { type: '1099-G', score: (t) => (/1099[-\s]?G\b/i.test(t) ? 70 : 0) + (/unemployment compensation|government payments/i.test(t) ? 30 : 0) },
  { type: '1098-T', score: (t) => (/1098[-\s]?T\b/i.test(t) ? 70 : 0) + (/tuition statement/i.test(t) ? 30 : 0) },
  { type: '1098', score: (t) => (/form\s*1098\b(?![-\sT])/i.test(t) ? 60 : 0) + (/mortgage interest statement/i.test(t) ? 40 : 0) },
  { type: 'SSA-1099', score: (t) => (/SSA[-\s]?1099/i.test(t) ? 80 : 0) + (/social security benefit statement/i.test(t) ? 20 : 0) },
  { type: 'K-1', score: (t) => (/schedule\s*k-?1/i.test(t) ? 80 : 0) + (/partner'?s share|shareholder'?s share/i.test(t) ? 20 : 0) },
  { type: '1040', score: (t) => (/form\s*1040\b/i.test(t) ? 60 : 0) + (/u\.?s\.? individual income tax return/i.test(t) ? 40 : 0) },
  { type: '941', score: (t) => (/form\s*941\b/i.test(t) ? 70 : 0) + (/employer'?s quarterly/i.test(t) ? 30 : 0) },
  { type: '940', score: (t) => (/form\s*940\b/i.test(t) ? 70 : 0) + (/federal unemployment/i.test(t) ? 30 : 0) },
  { type: 'ID-DOCUMENT', score: (t) => (/driver'?s? licen[sc]e|identification card|passport/i.test(t) ? 70 : 0) + (/date of birth|dob|expir/i.test(t) ? 30 : 0) },
];

export function classifyForm(text: string): { type: TaxFormType; confidence: number } {
  let best: { type: TaxFormType; confidence: number } = { type: 'UNKNOWN', confidence: 0 };
  for (const c of CLASSIFIERS) {
    const s = c.score(text);
    if (s > best.confidence) best = { type: c.type, confidence: s };
  }
  if (best.confidence < 40) return { type: 'UNKNOWN', confidence: best.confidence };
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Identity extraction (shared)
// ─────────────────────────────────────────────────────────────────────────────

const SSN_RE = /\b(\d{3})[-–\s]?(\d{2})[-–\s]?(\d{4})\b/;
const SSN_MASKED_RE = /\b[X\*]{3}[-–\s]?[X\*]{2}[-–\s]?(\d{4})\b/i;
const EIN_RE = /\b(\d{2})[-–\s]?(\d{7})\b/;
const ZIP_RE = /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.]+\b/;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/;

function extractIdentity(text: string, lines: string[]): ParsedTaxDocument['identity'] {
  const identity: ParsedTaxDocument['identity'] = {};

  // SSN (masked preferred in output for Pub 4557 safety)
  const masked = text.match(SSN_MASKED_RE);
  if (masked) {
    identity.ssnLast4 = masked[1];
    identity.ssnMasked = `XXX-XX-${masked[1]}`;
  } else {
    const ssn = text.match(SSN_RE);
    // Avoid matching EINs formatted xx-xxxxxxx by requiring the 3-2-4 shape
    if (ssn) {
      identity.ssnLast4 = ssn[3];
      identity.ssnMasked = `XXX-XX-${ssn[3]}`;
    }
  }

  // Employee/Recipient name — look near canonical labels
  const nameLabelRe = /(employee'?s? (?:first )?name|recipient'?s name|taxpayer name|name of recipient|e\/f.*name)/i;
  // Residue that is part of the IRS label itself, never a person's name
  const labelResidueRe = /\b(and initial|initial|last name|first name|suff|middle|address|street|zip code|social security)\b/i;
  let nameLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (nameLabelRe.test(lines[i])) {
      const inlined = lines[i].replace(nameLabelRe, '').replace(/(and address|address(?:, and ZIP code)?|[:\s]+)$/i, '').trim();
      const candidates: Array<{ text: string; idx: number }> = [];
      if (inlined.length >= 4 && !labelResidueRe.test(inlined)) candidates.push({ text: inlined, idx: i });
      if (lines[i + 1]) candidates.push({ text: lines[i + 1].trim(), idx: i + 1 });
      for (const c of candidates) {
        const cleaned = c.text.replace(/[^A-Za-z ,.'-]/g, '').trim();
        if (cleaned.length >= 4 && cleaned.length <= 60 && /[a-z]/i.test(cleaned) && !labelResidueRe.test(cleaned)) {
          identity.fullName = cleaned;
          nameLineIdx = c.idx;
          break;
        }
      }
      if (identity.fullName) break;
    }
  }

  if (identity.fullName) {
    const parts = identity.fullName.replace(/,/g, '').split(/\s+/);
    if (parts.length >= 2) {
      identity.firstName = parts[0];
      identity.lastName = parts[parts.length - 1];
    } else {
      identity.firstName = parts[0];
    }
  }

  // Address (street line followed by City, ST ZIP).
  // When we know where the taxpayer's name is, prefer the address block that
  // FOLLOWS it — otherwise the employer's address (printed first on W-2s)
  // would be captured instead.
  const addressSearchStart = nameLineIdx >= 0 ? nameLineIdx + 1 : 0;
  const scanOrders = nameLineIdx >= 0 ? [addressSearchStart, 0] : [0];
  outer:
  for (const start of scanOrders) {
    for (let i = start; i < lines.length; i++) {
      const zm = lines[i].match(ZIP_RE);
      if (zm) {
        identity.state = zm[1];
        identity.zip = zm[2];
        const cityPart = lines[i].slice(0, lines[i].indexOf(zm[0])).replace(/,\s*$/, '').trim();
        if (cityPart && cityPart.length < 40 && /^[A-Za-z .'-]+$/.test(cityPart)) identity.city = cityPart;
        // Street usually the previous line
        const prev = (lines[i - 1] || '').trim();
        if (/^\d+\s+[A-Za-z0-9 .#'-]+$/.test(prev)) {
          identity.address = prev;
        }
        break outer;
      }
    }
  }

  const email = text.match(EMAIL_RE);
  if (email) identity.email = email[0].toLowerCase();
  const phone = text.match(PHONE_RE);
  if (phone) identity.phone = `(${phone[1]}) ${phone[2]}-${phone[3]}`;

  return identity;
}

function extractEmployer(text: string, lines: string[]): ParsedTaxDocument['employer'] {
  const employer: ParsedTaxDocument['employer'] = {};
  const labelRe = /(employer'?s name|payer'?s name|company name|business name|filer'?s name|lender'?s name)/i;
  // Residue belonging to the IRS label itself (", street address, city…")
  const payerResidueRe = /^[,.\s]|(street address|zip code|city or town|address|telephone)/i;
  for (let i = 0; i < lines.length; i++) {
    if (labelRe.test(lines[i])) {
      const inline = lines[i].replace(labelRe, '').replace(/(,? address,? and ZIP code|[:\s]+)$/i, '').trim();
      const candidates = [] as string[];
      if (inline.length >= 3 && !payerResidueRe.test(inline)) candidates.push(inline);
      if (lines[i + 1]) candidates.push(lines[i + 1].trim());
      for (const cand of candidates) {
        const cleaned = cand.replace(/[^A-Za-z0-9 &,.'()-]/g, '').trim();
        if (cleaned.length >= 3 && cleaned.length <= 70 && !payerResidueRe.test(cleaned)) {
          employer.name = cleaned;
          break;
        }
      }
      if (employer.name) break;
    }
  }
  // EIN
  const einLabeled = text.match(/(?:EIN|employer identification number|payer'?s TIN|federal id(?:entification)? number)[^\d]{0,20}(\d{2}[-–\s]?\d{7})/i);
  if (einLabeled) {
    employer.ein = einLabeled[1].replace(/[\s–]/g, '-').replace(/^(\d{2})(\d{7})$/, '$1-$2');
  } else {
    const ein = text.match(EIN_RE);
    if (ein) employer.ein = `${ein[1]}-${ein[2]}`;
  }
  return employer;
}

function extractTaxYear(text: string): string | undefined {
  // Prefer explicit years on form headers (20XX standalone)
  const m = text.match(/\b(20[12][0-9])\b/g);
  if (!m) return undefined;
  // Choose the most frequent plausible tax year
  const counts = new Map<string, number>();
  for (const y of m) counts.set(y, (counts.get(y) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-form box maps
// ─────────────────────────────────────────────────────────────────────────────

interface BoxDef { key: string; label: string; re: RegExp; category: ExtractedField['category'] }

const W2_BOXES: BoxDef[] = [
  { key: 'box1_wages', label: 'Box 1 — Wages, tips, other compensation', re: /wages,?\s*tips,?\s*other\s*comp/i, category: 'income' },
  { key: 'box2_fed_wh', label: 'Box 2 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
  { key: 'box3_ss_wages', label: 'Box 3 — Social security wages', re: /social security wages/i, category: 'income' },
  { key: 'box4_ss_tax', label: 'Box 4 — Social security tax withheld', re: /social security tax withheld/i, category: 'withholding' },
  { key: 'box5_medicare_wages', label: 'Box 5 — Medicare wages and tips', re: /medicare wages/i, category: 'income' },
  { key: 'box6_medicare_tax', label: 'Box 6 — Medicare tax withheld', re: /medicare tax withheld/i, category: 'withholding' },
  { key: 'box7_ss_tips', label: 'Box 7 — Social security tips', re: /social security tips/i, category: 'income' },
  { key: 'box12_codes', label: 'Box 12 — Codes (401k/HSA etc.)', re: /box\s*12|12[ab]\b.*code/i, category: 'deduction' },
  { key: 'box16_state_wages', label: 'Box 16 — State wages', re: /state wages/i, category: 'income' },
  { key: 'box17_state_tax', label: 'Box 17 — State income tax', re: /state income tax/i, category: 'withholding' },
];

const F1099NEC_BOXES: BoxDef[] = [
  { key: 'box1_nec', label: 'Box 1 — Nonemployee compensation', re: /nonemployee compensation/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
  { key: 'box5_state_tax', label: 'Box 5 — State tax withheld', re: /state tax withheld/i, category: 'withholding' },
];

const F1099MISC_BOXES: BoxDef[] = [
  { key: 'box1_rents', label: 'Box 1 — Rents', re: /\brents\b/i, category: 'income' },
  { key: 'box2_royalties', label: 'Box 2 — Royalties', re: /royalties/i, category: 'income' },
  { key: 'box3_other', label: 'Box 3 — Other income', re: /other income/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const F1099INT_BOXES: BoxDef[] = [
  { key: 'box1_interest', label: 'Box 1 — Interest income', re: /interest income/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
  { key: 'box8_tax_exempt', label: 'Box 8 — Tax-exempt interest', re: /tax[-\s]?exempt interest/i, category: 'income' },
];

const F1099DIV_BOXES: BoxDef[] = [
  { key: 'box1a_ord_div', label: 'Box 1a — Total ordinary dividends', re: /ordinary dividends/i, category: 'income' },
  { key: 'box1b_qual_div', label: 'Box 1b — Qualified dividends', re: /qualified dividends/i, category: 'income' },
  { key: 'box2a_cap_gain', label: 'Box 2a — Total capital gain distributions', re: /capital gain distr/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const F1099B_BOXES: BoxDef[] = [
  { key: 'proceeds', label: 'Box 1d — Proceeds', re: /proceeds\b/i, category: 'income' },
  { key: 'cost_basis', label: 'Box 1e — Cost or other basis', re: /cost or other basis|cost basis/i, category: 'income' },
  { key: 'gain_loss', label: 'Gain/Loss', re: /gain or \(?loss\)?/i, category: 'income' },
  { key: 'fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const F1099R_BOXES: BoxDef[] = [
  { key: 'box1_gross', label: 'Box 1 — Gross distribution', re: /gross distribution/i, category: 'income' },
  { key: 'box2a_taxable', label: 'Box 2a — Taxable amount', re: /taxable amount/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const F1098_BOXES: BoxDef[] = [
  { key: 'box1_mortgage_interest', label: 'Box 1 — Mortgage interest received', re: /mortgage interest received/i, category: 'deduction' },
  { key: 'box2_principal', label: 'Box 2 — Outstanding mortgage principal', re: /outstanding mortgage principal/i, category: 'deduction' },
  { key: 'box5_pmi', label: 'Box 5 — Mortgage insurance premiums', re: /mortgage insurance premiums/i, category: 'deduction' },
  { key: 'box6_points', label: 'Box 6 — Points paid', re: /points paid/i, category: 'deduction' },
];

const F1099K_BOXES: BoxDef[] = [
  { key: 'box1a_gross', label: 'Box 1a — Gross amount of payment card transactions', re: /gross amount of payment/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const F1099G_BOXES: BoxDef[] = [
  { key: 'box1_unemployment', label: 'Box 1 — Unemployment compensation', re: /unemployment compensation/i, category: 'income' },
  { key: 'box2_state_refund', label: 'Box 2 — State/local income tax refunds', re: /state or local income tax refunds?/i, category: 'income' },
  { key: 'box4_fed_wh', label: 'Box 4 — Federal income tax withheld', re: /federal income tax withheld/i, category: 'withholding' },
];

const SSA_BOXES: BoxDef[] = [
  { key: 'box3_benefits', label: 'Box 3 — Benefits paid', re: /benefits paid/i, category: 'income' },
  { key: 'box5_net_benefits', label: 'Box 5 — Net benefits', re: /net benefits/i, category: 'income' },
  { key: 'box6_fed_wh', label: 'Box 6 — Voluntary federal tax withheld', re: /voluntary federal|federal income tax withheld/i, category: 'withholding' },
];

const BOX_MAP: Partial<Record<TaxFormType, BoxDef[]>> = {
  'W-2': W2_BOXES,
  '1099-NEC': F1099NEC_BOXES,
  '1099-MISC': F1099MISC_BOXES,
  '1099-INT': F1099INT_BOXES,
  '1099-DIV': F1099DIV_BOXES,
  '1099-B': F1099B_BOXES,
  '1099-R': F1099R_BOXES,
  '1099-K': F1099K_BOXES,
  '1099-G': F1099G_BOXES,
  '1098': F1098_BOXES,
  'SSA-1099': SSA_BOXES,
};

// ─────────────────────────────────────────────────────────────────────────────
// Master parse
// ─────────────────────────────────────────────────────────────────────────────

export function parseTaxDocument(ocrText: string, ocrConfidence = 90): ParsedTaxDocument {
  const text = ocrText.replace(/\r/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const { type, confidence } = classifyForm(text);
  const warnings: string[] = [];

  const identity = extractIdentity(text, lines);
  const employer = extractEmployer(text, lines);
  const taxYear = extractTaxYear(text);
  const fields: ExtractedField[] = [];

  // Identity + employer as audit fields
  if (identity.fullName) fields.push({ key: 'taxpayer_name', label: 'Taxpayer Name', value: identity.fullName, confidence: Math.min(95, ocrConfidence), category: 'identity' });
  if (identity.ssnMasked) fields.push({ key: 'taxpayer_ssn', label: 'Taxpayer SSN (masked)', value: identity.ssnMasked, confidence: Math.min(92, ocrConfidence), category: 'identity' });
  if (identity.address) fields.push({ key: 'taxpayer_address', label: 'Street Address', value: identity.address, confidence: 85, category: 'identity' });
  if (identity.city || identity.state || identity.zip) fields.push({ key: 'taxpayer_csz', label: 'City / State / ZIP', value: [identity.city, identity.state, identity.zip].filter(Boolean).join(', '), confidence: 85, category: 'identity' });
  if (identity.email) fields.push({ key: 'taxpayer_email', label: 'Email', value: identity.email, confidence: 90, category: 'identity' });
  if (identity.phone) fields.push({ key: 'taxpayer_phone', label: 'Phone', value: identity.phone, confidence: 88, category: 'identity' });
  if (employer.name) fields.push({ key: 'employer_name', label: type.startsWith('1099') ? 'Payer Name' : 'Employer Name', value: employer.name, confidence: 88, category: 'employer' });
  if (employer.ein) fields.push({ key: 'employer_ein', label: 'EIN / Payer TIN', value: employer.ein, confidence: 90, category: 'employer' });
  if (taxYear) fields.push({ key: 'tax_year', label: 'Tax Year', value: taxYear, confidence: 80, category: 'meta' });

  // Box extraction
  const totals: ParsedTaxDocument['totals'] = {};
  const boxes = BOX_MAP[type] || [];
  for (const box of boxes) {
    const hit = findAmountNear(lines, box.re);
    if (hit) {
      fields.push({
        key: box.key,
        label: box.label,
        value: fmtMoney(hit.value),
        raw: hit.raw,
        confidence: Math.min(90, ocrConfidence),
        category: box.category,
      });
      // Roll up totals — ONLY primary income boxes (never Box 3/5/16 which
      // restate the same W-2 wages for SS/Medicare/state purposes)
      const PRIMARY_INCOME_KEYS = new Set([
        'box1_wages', 'box1_nec', 'box1_rents', 'box2_royalties', 'box3_other',
        'box1_interest', 'box1a_ord_div', 'box2a_cap_gain', 'proceeds',
        'box1_gross', 'box1a_gross', 'box1_unemployment', 'box5_net_benefits',
      ]);
      if (PRIMARY_INCOME_KEYS.has(box.key)) {
        totals.totalIncome = (totals.totalIncome || 0) + hit.value;
      }
      if (/fed_wh|box2_fed_wh/.test(box.key)) totals.federalWithholding = (totals.federalWithholding || 0) + hit.value;
      if (/state_tax|box17/.test(box.key)) totals.stateWithholding = (totals.stateWithholding || 0) + hit.value;
      if (box.key === 'box3_ss_wages') totals.socialSecurityWages = hit.value;
      if (box.key === 'box5_medicare_wages') totals.medicareWages = hit.value;
    }
  }

  // Sanity validators (Circular 230 diligence support)
  if (type === 'W-2') {
    const w = fields.find((f) => f.key === 'box1_wages');
    const ss = fields.find((f) => f.key === 'box3_ss_wages');
    if (w && ss) {
      const wagesV = parseMoney(w.value) || 0;
      const ssV = parseMoney(ss.value) || 0;
      if (ssV > 176100) warnings.push('Box 3 exceeds the 2025 Social Security wage base ($176,100) — verify OCR reading.');
      if (wagesV > 0 && ssV > 0 && Math.abs(wagesV - ssV) / Math.max(wagesV, ssV) > 0.5) {
        warnings.push('Large variance between Box 1 and Box 3 — possible pre-tax deferrals (401k/HSA) or OCR error. Verify Box 12 codes.');
      }
    }
    if (!fields.some((f) => f.key === 'box2_fed_wh')) warnings.push('Federal withholding (Box 2) not detected — confirm on source document.');
  }
  if (!identity.fullName) warnings.push('Taxpayer name not confidently detected — manual verification required.');
  if (type === 'UNKNOWN') warnings.push('Form type could not be classified. Extraction ran in generic mode.');

  return { formType: type, formConfidence: confidence, taxYear, fields, identity, employer, totals, warnings };
}
