/**
 * 🗂️ SMART FILING ENGINE — Automatic Document Arrangement
 * Takes any parsed tax document and decides, with zero clicks:
 *   • which client it belongs to (email → SSN last-4 → fuzzy name match)
 *   • which virtual folder it files into (Income / Deductions / Identity / …)
 *   • a standardized, audit-friendly file name
 *   • the recommended next pipeline action
 * This is what lets a preparer drop 40 mixed documents and watch them
 * arrange themselves into per-client, per-year folders automatically.
 */

import { useAppStore } from '../store';
import type { ParsedTaxDocument, TaxFormType } from './taxDocParser';

export type FilingFolder =
  | 'Income'
  | 'Deductions & Credits'
  | 'Identity & Verification'
  | 'Retirement & Investments'
  | 'Business Records'
  | 'IRS Notices'
  | 'Education'
  | 'Unclassified';

export interface ClientMatch {
  contactId?: string;
  displayName: string;
  method: 'email' | 'ssn_last4' | 'name' | 'new_client';
  confidence: number; // 0-100
}

export interface FilingPlan {
  folder: FilingFolder;
  folderReason: string;
  standardizedName: string;
  clientMatch: ClientMatch;
  taxYear: string;
  nextAction: string;
  autoProcessEligible: boolean; // high confidence → safe for one-click batch inject
}

const FOLDER_MAP: Record<TaxFormType, { folder: FilingFolder; reason: string }> = {
  'W-2':      { folder: 'Income', reason: 'Wage & tax statement — primary income document' },
  '1099-NEC': { folder: 'Income', reason: 'Nonemployee compensation — Schedule C income' },
  '1099-MISC':{ folder: 'Income', reason: 'Miscellaneous income — rents/royalties/other' },
  '1099-K':   { folder: 'Income', reason: 'Payment card / third-party network transactions' },
  '1099-G':   { folder: 'Income', reason: 'Government payments — unemployment / state refund' },
  '1099-INT': { folder: 'Retirement & Investments', reason: 'Interest income — Schedule B' },
  '1099-DIV': { folder: 'Retirement & Investments', reason: 'Dividend income — Schedule B' },
  '1099-B':   { folder: 'Retirement & Investments', reason: 'Broker proceeds — Form 8949 / Schedule D' },
  '1099-R':   { folder: 'Retirement & Investments', reason: 'Retirement distribution — check code box 7' },
  'SSA-1099': { folder: 'Retirement & Investments', reason: 'Social Security benefit statement' },
  '1098':     { folder: 'Deductions & Credits', reason: 'Mortgage interest — Schedule A' },
  '1098-T':   { folder: 'Education', reason: 'Tuition statement — AOTC / LLC credit support' },
  'K-1':      { folder: 'Business Records', reason: 'Pass-through K-1 — partnership / S-corp' },
  '1040':     { folder: 'Identity & Verification', reason: 'Prior-year return — carryover & comparison' },
  '941':      { folder: 'Business Records', reason: 'Employer quarterly payroll return' },
  '940':      { folder: 'Business Records', reason: 'Employer annual FUTA return' },
  'ID-DOCUMENT': { folder: 'Identity & Verification', reason: 'Government ID — due-diligence & IP-PIN support' },
  'UNKNOWN':  { folder: 'Unclassified', reason: 'Form type unresolved — route to manual review' },
};

const NEXT_ACTION: Partial<Record<TaxFormType, string>> = {
  'W-2': 'Post wages to Form 1040 line 1a; verify Box 2 withholding vs. IRS transcript.',
  '1099-NEC': 'Open Schedule C worksheet; prompt client for expense records to offset SE tax (15.3%).',
  '1099-MISC': 'Determine character of income (rents → Sch E, other → Sch 1); confirm no SE misclassification.',
  '1099-K': 'Reconcile against business gross receipts; flag personal-payment exclusions.',
  '1099-G': 'Check taxable state-refund rules (prior-year itemizer test) or unemployment inclusion.',
  '1099-INT': 'Post to Schedule B; check for early-withdrawal penalty adjustment.',
  '1099-DIV': 'Split ordinary vs. qualified dividends; check capital-gain distributions.',
  '1099-B': 'Import basis data to Form 8949; verify covered/noncovered lots and wash-sale flags.',
  '1099-R': 'Verify distribution code; screen for 10% early-withdrawal penalty and rollover treatment.',
  'SSA-1099': 'Run taxable Social Security worksheet (up to 85% inclusion).',
  '1098': 'Post mortgage interest to Schedule A; run itemize-vs-standard comparison ($15,750/$31,500 TY2025).',
  '1098-T': 'Screen AOTC eligibility ($2,500 max, 40% refundable) vs. Lifetime Learning Credit.',
  'K-1': 'Trace pass-through items to Schedule E page 2; check basis and at-risk limitations.',
  '1040': 'Import prior-year AGI, carryovers (capital loss, NOL, charitable) and payment history.',
  'ID-DOCUMENT': 'Attach to due-diligence file; verify identity per IRS Pub 4557 / WISP requirements.',
};

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function safeSlug(s: string): string {
  return s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Match the parsed document to an existing CRM client. */
export function matchClient(doc: ParsedTaxDocument): ClientMatch {
  const contacts = useAppStore.getState().contacts;

  if (doc.identity.email) {
    const hit = contacts.find((c) => c.email?.toLowerCase() === doc.identity.email!.toLowerCase());
    if (hit) return { contactId: hit.id, displayName: `${hit.firstName} ${hit.lastName}`, method: 'email', confidence: 99 };
  }
  if (doc.identity.ssnLast4) {
    const hit = contacts.find((c) => c.customFields?.ssn_last4 === doc.identity.ssnLast4);
    if (hit) return { contactId: hit.id, displayName: `${hit.firstName} ${hit.lastName}`, method: 'ssn_last4', confidence: 96 };
  }
  if (doc.identity.fullName) {
    const target = normName(doc.identity.fullName);
    const hit = contacts.find((c) => normName(`${c.firstName} ${c.lastName}`) === target);
    if (hit) return { contactId: hit.id, displayName: `${hit.firstName} ${hit.lastName}`, method: 'name', confidence: 88 };
  }
  return {
    displayName: doc.identity.fullName || 'New / Unidentified Client',
    method: 'new_client',
    confidence: doc.identity.fullName ? 72 : 40,
  };
}

/** Build the complete automatic filing plan for a parsed document. */
export function buildFilingPlan(doc: ParsedTaxDocument, originalFileName: string): FilingPlan {
  const map = FOLDER_MAP[doc.formType] ?? FOLDER_MAP.UNKNOWN;
  const client = matchClient(doc);
  const taxYear = doc.taxYear || String(new Date().getFullYear() - 1);
  const ext = originalFileName.includes('.') ? originalFileName.split('.').pop()!.toLowerCase() : 'pdf';

  const namePart = safeSlug(client.displayName === 'New / Unidentified Client' ? 'Unmatched' : client.displayName);
  const payerPart = doc.employer.name ? `_${safeSlug(doc.employer.name).slice(0, 20)}` : '';
  const standardizedName = `${namePart}_TY${taxYear}_${safeSlug(doc.formType)}${payerPart}.${ext}`;

  const autoProcessEligible =
    doc.formType !== 'UNKNOWN' &&
    doc.formConfidence >= 70 &&
    client.confidence >= 85 &&
    doc.fields.length >= 3;

  return {
    folder: map.folder,
    folderReason: map.reason,
    standardizedName,
    clientMatch: client,
    taxYear,
    nextAction: NEXT_ACTION[doc.formType] ?? 'Route to preparer review queue for classification.',
    autoProcessEligible,
  };
}

export const ALL_FOLDERS: FilingFolder[] = [
  'Income',
  'Deductions & Credits',
  'Retirement & Investments',
  'Business Records',
  'Education',
  'Identity & Verification',
  'IRS Notices',
  'Unclassified',
];
