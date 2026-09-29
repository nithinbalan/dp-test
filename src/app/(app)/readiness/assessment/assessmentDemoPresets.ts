/**
 * Prototype review aid: pre-filled sample assessments (`GA_DEMO` in the
 * prototype's `app.html`) — not a product feature. Exists so the wizard and
 * its report can be reviewed without answering every question by hand. Each
 * scenario cycles a fixed answer pattern over whichever questions are
 * currently in scope, so the same choice always produces the same score.
 * Rendered only outside production — see `AssessmentDemoBar`'s caller.
 */
import type { AnswerValue, AssessmentProfile } from '@shared/hooks';

export type DemoPresetKey = 'early' | 'typical' | 'mature';

export type DemoPreset = {
  /** Dropdown label, score band included so the choice previews its outcome. */
  label: string;
  /** Merged onto the profile — everything but `assessorEmployeeId`, which is
   * resolved against the workspace's real employee roster at fill time. */
  profile: Omit<AssessmentProfile, 'assessorEmployeeId'>;
  /** Loosely matched against an employee's designation to pick "Completed by". */
  assessorRoleHint: string;
  /** Cycled modulo its length over every in-scope question, in question order. */
  mix: readonly AnswerValue[];
  /** Question code → note text, applied only to questions that got answered. */
  notes: Readonly<Record<string, string>>;
};

export const ASSESSMENT_DEMO_PRESETS: Readonly<Record<DemoPresetKey, DemoPreset>> = {
  early: {
    label: 'Early stage — most duties unmet (~20%)',
    profile: {
      entity: 'Kirana Direct Pvt Ltd',
      sector: 'E-commerce / D2C',
      recordsHeld: 'Under 10,000',
      kids: 'no',
      proc: 'yes',
      xbt: 'yes',
      sens: 'no',
    },
    assessorRoleHint: 'product',
    mix: ['n', 'n', 'u', 'p', 'n', 'n', 'y', 'n', 'u', 'n', 'p', 'n'],
    notes: {
      A1: 'No notice anywhere yet — the sign-up form collects name, phone and address.',
      E1: 'Nobody owns incident response. IT would call the founder.',
    },
  },
  typical: {
    label: 'Typical SME — developing (~60%)',
    profile: {
      entity: 'Your Company Pvt Ltd',
      sector: 'SaaS / IT services',
      recordsHeld: '10,000 – 1 lakh',
      kids: 'no',
      proc: 'yes',
      xbt: 'yes',
      sens: 'yes',
    },
    assessorRoleHint: 'lead',
    mix: ['y', 'p', 'n', 'y', 'p', 'y', 'u', 'p', 'y', 'n', 'p', 'y'],
    notes: {
      D1: 'Encryption at rest is on for RDS, but the S3 file store was never checked.',
      G1: 'Payroll vendor contract signed 2024 — predates DPDP, no processing clauses.',
    },
  },
  mature: {
    label: 'Mature programme — ready (~90%)',
    profile: {
      entity: 'Northline Finserv Pvt Ltd',
      sector: 'BFSI / Fintech',
      recordsHeld: 'Over 10 lakh',
      kids: 'yes',
      proc: 'yes',
      xbt: 'yes',
      sens: 'yes',
    },
    assessorRoleHint: 'dpo',
    mix: ['y', 'y', 'y', 'p', 'y', 'y', 'y', 'y', 'p', 'y', 'y', 'y'],
    notes: {
      E4: 'Last tabletop was Nov 2025 — outside the 12-month window.',
    },
  },
};

export const DEFAULT_DEMO_PRESET: DemoPresetKey = 'typical';
