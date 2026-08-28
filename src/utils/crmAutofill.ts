/**
 * 🔗 RJ BUSINESS SOLUTIONS — CRM AUTO-FILL INJECTION BRIDGE
 * Takes structured tax-document extraction output and injects it directly
 * into the CRM: creating or enriching Contacts, tagging, custom fields,
 * activity trail, and optional tax-prep Deal creation.
 *
 * De-duplication strategy (in priority order):
 *   1. Email exact match
 *   2. SSN last-4 custom field match
 *   3. Fuzzy full-name match (normalized)
 */

import { useAppStore } from '../store';
import type { Contact, Deal, Notification } from '../types';
import type { ParsedTaxDocument } from './taxDocParser';

export interface AutofillResult {
  action: 'created' | 'updated';
  contactId: string;
  contactName: string;
  fieldsWritten: number;
  dealCreated: boolean;
  dealId?: string;
  summary: string[];
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function money(n?: number): string {
  return n !== undefined ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';
}

/**
 * Injects a parsed tax document into the CRM.
 * Creates a new contact or enriches an existing one, writes every extracted
 * field into customFields, tags the document type, logs an audit activity,
 * and (optionally) opens a tax-prep pipeline deal with the detected values.
 */
export function autofillCRM(
  doc: ParsedTaxDocument,
  options: { fileName: string; createDeal?: boolean }
): AutofillResult {
  const state = useAppStore.getState();
  const summary: string[] = [];
  const now = new Date();

  const first = doc.identity.firstName || 'Unknown';
  const last = doc.identity.lastName || 'Taxpayer';
  const fullName = doc.identity.fullName || `${first} ${last}`;

  // ── Locate existing contact ────────────────────────────────────────────────
  let existing: Contact | undefined;
  if (doc.identity.email) {
    existing = state.contacts.find((c) => c.email?.toLowerCase() === doc.identity.email);
    if (existing) summary.push(`Matched existing contact by email (${doc.identity.email})`);
  }
  if (!existing && doc.identity.ssnLast4) {
    existing = state.contacts.find((c) => c.customFields?.ssn_last4 === doc.identity.ssnLast4);
    if (existing) summary.push(`Matched existing contact by SSN last-4 (•••${doc.identity.ssnLast4})`);
  }
  if (!existing && doc.identity.fullName) {
    const target = normName(doc.identity.fullName);
    existing = state.contacts.find((c) => normName(`${c.firstName} ${c.lastName}`) === target);
    if (existing) summary.push(`Matched existing contact by name (${doc.identity.fullName})`);
  }

  // ── Build custom-field payload from every extracted box ──────────────────
  const customFields: Record<string, string> = {};
  for (const f of doc.fields) {
    customFields[f.key] = f.value;
  }
  if (doc.identity.ssnLast4) customFields['ssn_last4'] = doc.identity.ssnLast4;
  if (doc.taxYear) customFields['tax_year'] = doc.taxYear;
  customFields['last_document_type'] = doc.formType;
  customFields['last_document_file'] = options.fileName;
  customFields['last_ocr_sync'] = now.toISOString();
  if (doc.totals.totalIncome !== undefined) customFields['detected_total_income'] = money(doc.totals.totalIncome);
  if (doc.totals.federalWithholding !== undefined) customFields['detected_fed_withholding'] = money(doc.totals.federalWithholding);

  const docTag = `doc:${doc.formType.toLowerCase()}`;
  const yearTag = doc.taxYear ? `ty${doc.taxYear}` : null;

  const auditActivity = {
    id: uid('act'),
    type: 'note' as const,
    description: `📄 Document Intelligence: parsed "${options.fileName}" (${doc.formType}, ${doc.fields.length} fields, ${doc.formConfidence}% classification). ${doc.warnings.length ? `⚠️ ${doc.warnings.length} warning(s).` : 'No warnings.'}`,
    completed: true,
    contactId: existing?.id || '',
    completedAt: now,
    createdAt: now,
  };

  let contactId: string;
  let action: AutofillResult['action'];

  if (existing) {
    // ── Enrich existing contact (never overwrite good data with blanks) ────
    contactId = existing.id;
    action = 'updated';
    const merged: Partial<Contact> = {
      customFields: { ...existing.customFields, ...customFields },
      tags: Array.from(new Set([...existing.tags, docTag, ...(yearTag ? [yearTag] : [])])),
      updatedAt: now,
      activities: [...existing.activities, { ...auditActivity, contactId: existing.id }],
    };
    if (!existing.email && doc.identity.email) merged.email = doc.identity.email;
    if (!existing.phone && doc.identity.phone) merged.phone = doc.identity.phone;
    if (doc.employer.name && !existing.company) merged.company = doc.employer.name;
    state.updateContact(existing.id, merged);
    summary.push(`Enriched contact with ${doc.fields.length} extracted fields`);
  } else {
    // ── Create fresh contact fully pre-filled from the document ────────────
    contactId = uid('contact');
    action = 'created';
    const contact: Contact = {
      id: contactId,
      firstName: first,
      lastName: last,
      email: doc.identity.email || '',
      phone: doc.identity.phone || '',
      company: doc.employer.name,
      tags: ['document-intake', docTag, ...(yearTag ? [yearTag] : [])],
      customFields,
      source: 'Document Intelligence OCR',
      status: 'lead',
      notes: [],
      activities: [{ ...auditActivity, contactId }],
      createdAt: now,
      updatedAt: now,
      subAccountId: state.currentSubAccount?.id,
    };
    state.addContact(contact);
    summary.push(`Created new CRM contact "${fullName}" from document`);
  }

  // ── Optional: open a tax-prep deal seeded with detected values ────────────
  let dealCreated = false;
  let dealId: string | undefined;
  if (options.createDeal) {
    const taxPipeline = state.pipelines.find((p) => /tax/i.test(p.name)) || state.pipelines[0];
    if (taxPipeline?.stages?.length) {
      dealId = uid('deal');
      const income = doc.totals.totalIncome || 0;
      const complexity: Deal['filingComplexity'] =
        doc.formType === 'K-1' || doc.formType === '1099-B' ? 'Complex'
        : doc.formType.startsWith('1099') ? 'Moderate'
        : 'Simple';
      const deal: Deal = {
        id: dealId,
        name: `${fullName} — TY${doc.taxYear || new Date().getFullYear()} ${doc.formType} Return`,
        contactId,
        contactName: fullName,
        pipelineId: taxPipeline.id,
        stageId: taxPipeline.stages[0].id,
        value: Math.max(250, Math.round(income * 0.004)), // heuristic prep-fee estimate
        probability: 60,
        tags: ['ocr-intake', docTag],
        createdAt: now,
        updatedAt: now,
        source: 'Document Intelligence',
        subAccountId: state.currentSubAccount?.id,
        filingComplexity: complexity,
        feeStructure: 'Flat',
        estimatedRefund: doc.totals.federalWithholding ? Math.round(doc.totals.federalWithholding * 0.35) : undefined,
        returnsCount: 1,
        daysInStage: 0,
        slaDays: 14,
        documentCompleteness: `1 of ~3 expected (${doc.formType} received)`,
        aiScore: Math.min(95, 55 + Math.round(doc.formConfidence / 4)),
        aiRationale: [
          `${doc.formType} parsed with ${doc.fields.length} verified fields`,
          income ? `Detected income ${money(income)}` : 'Income pending additional documents',
          doc.totals.federalWithholding ? `Federal withholding ${money(doc.totals.federalWithholding)} — refund likely` : 'No withholding detected yet',
        ],
        aiNextAction: doc.warnings.length
          ? `Verify ${doc.warnings.length} flagged extraction warning(s), then request remaining documents.`
          : 'Request remaining supporting documents & schedule intake call.',
      };
      state.addDeal(deal);
      dealCreated = true;
      summary.push(`Opened deal in "${taxPipeline.name}" pipeline (est. fee ${money(deal.value)})`);
    }
  }

  // ── Notify ────────────────────────────────────────────────────────────────
  const notification: Notification = {
    id: uid('ntf'),
    type: 'success',
    title: `Document Parsed → CRM ${action === 'created' ? 'Contact Created' : 'Contact Updated'}`,
    message: `${doc.formType} "${options.fileName}" → ${fullName}: ${doc.fields.length} fields injected${dealCreated ? ' + deal opened' : ''}.`,
    read: false,
    createdAt: now,
  };
  state.addNotification(notification);

  return {
    action,
    contactId,
    contactName: fullName,
    fieldsWritten: doc.fields.length,
    dealCreated,
    dealId,
    summary,
  };
}
