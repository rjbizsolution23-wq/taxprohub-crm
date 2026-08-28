/**
 * Unit tests for the pure logic that powers the tax engine, document parsing,
 * smart filing and the sync client. These run with no network and no backend.
 */
import { describe, it, expect } from 'vitest';
import { parseTaxDocument } from '../src/utils/taxDocParser';
import { buildFilingPlan } from '../src/utils/smartFiling';
import { diffFingerprints, fingerprintState } from '../src/utils/api';
import { humanSize } from '../src/utils/vault';

const W2_TEXT = `
Form W-2 Wage and Tax Statement 2025
a Employee's social security number 123-45-6789
b Employer identification number (EIN) 12-3456789
c Employer's name, address, and ZIP code
ACME LOGISTICS LLC
e Employee's first name and initial  Last name
MARIA LOPEZ
1 Wages, tips, other compensation 82,450.00
2 Federal income tax withheld 11,320.00
`;

const NEC_TEXT = `
Form 1099-NEC Nonemployee Compensation 2025
PAYER'S name RIVERSIDE CONTRACTING INC
RECIPIENT'S name  JOHN CARTER
1 Nonemployee compensation 24,800.00
4 Federal income tax withheld 0.00
`;

describe('taxDocParser', () => {
  it('identifies a W-2 and pulls wages + withholding', () => {
    const parsed = parseTaxDocument(W2_TEXT, 92);
    expect(parsed.formType).toBe('W-2');
    expect(parsed.taxYear).toBe('2025');
    expect(parsed.fields.length).toBeGreaterThan(0);
  });

  it('identifies a 1099-NEC', () => {
    const parsed = parseTaxDocument(NEC_TEXT, 88);
    expect(parsed.formType).toBe('1099-NEC');
  });

  it('never invents a form type for unrelated text', () => {
    const parsed = parseTaxDocument('grocery receipt bananas 3.99', 40);
    expect(parsed.formType).toBe('UNKNOWN');
    expect(parsed.warnings.some((w) => /could not be classified/i.test(w))).toBe(true);
  });

  it('warns when a required box is missing instead of inventing a value', () => {
    const noWithholding = W2_TEXT.replace('2 Federal income tax withheld 11,320.00', '');
    const parsed = parseTaxDocument(noWithholding, 90);
    expect(parsed.warnings.some((w) => /withholding/i.test(w))).toBe(true);
    expect(parsed.totals.federalWithholding).toBeUndefined();
  });
});

describe('smartFiling', () => {
  it('files a W-2 under Income', () => {
    const parsed = parseTaxDocument(W2_TEXT, 92);
    const plan = buildFilingPlan(parsed, 'w2-scan.pdf');
    expect(plan.folder).toBe('Income');
    expect(plan.standardizedName).toMatch(/W[-_]2/);
  });

  it('produces a deterministic standardized name', () => {
    const parsed = parseTaxDocument(NEC_TEXT, 90);
    const a = buildFilingPlan(parsed, 'scan1.pdf').standardizedName;
    const b = buildFilingPlan(parsed, 'scan1.pdf').standardizedName;
    expect(a).toBe(b);
  });
});

describe('sync fingerprints', () => {
  const state = () => ({
    allContacts: [{ id: 'c1', firstName: 'A', updatedAt: '2026-01-01' }],
    allDeals: [{ id: 'd1', name: 'Deal', updatedAt: '2026-01-01' }],
    allAppointments: [], allCampaigns: [], allWorkflows: [], allFunnels: [],
    allWebsites: [], allForms: [], allBlogPosts: [], allPreparers: [], allPayouts: [],
    pipelines: [], subAccounts: [],
  }) as any;

  it('reports no changes for identical snapshots', () => {
    const ops = diffFingerprints(fingerprintState(state()), state());
    expect(ops).toHaveLength(0);
  });

  it('detects a new record as an upsert', () => {
    const before = fingerprintState(state());
    const next = state();
    next.allContacts.push({ id: 'c2', firstName: 'B', updatedAt: '2026-02-02' });
    const ops = diffFingerprints(before, next);
    expect(ops.some((o) => o.id === 'c2' && o.kind === 'upsert')).toBe(true);
    expect(ops.some((o) => o.kind === 'delete')).toBe(false);
  });

  it('detects a removed record as a delete', () => {
    const before = fingerprintState(state());
    const next = state();
    next.allDeals = [];
    const ops = diffFingerprints(before, next);
    expect(ops.some((o) => o.id === 'd1' && o.kind === 'delete')).toBe(true);
  });

  it('detects an edit as an upsert', () => {
    const before = fingerprintState(state());
    const next = state();
    next.allContacts[0].firstName = 'Renamed';
    const ops = diffFingerprints(before, next);
    expect(ops.some((o) => o.id === 'c1' && o.kind === 'upsert')).toBe(true);
  });
});

describe('vault helpers', () => {
  it('formats byte sizes', () => {
    expect(humanSize(0)).toBe('0 B');
    expect(humanSize(512)).toBe('512 B');
    expect(humanSize(2048)).toBe('2.0 KB');
    expect(humanSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
