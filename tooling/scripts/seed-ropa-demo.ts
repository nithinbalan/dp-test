#!/usr/bin/env -S node --experimental-strip-types
/**
 * Seeds one workspace's `processing_activity` (+ category/operation/safeguard
 * satellite tables) with the RoPA module's demo fixture data — the same six
 * activities `src/shared/mock/ropa.ts` used to serve directly before the
 * module was wired to the real backend. Idempotent by `ref_code`: re-running
 * skips any activity whose ref_code is already present.
 *
 * Unlike db/seed/*.sql (public-schema reference/catalog data, applied by
 * `pnpm db:seed`), this seeds one TENANT schema with demo/fixture rows — not
 * something every workspace should get on provisioning, so it is a standalone
 * script rather than part of that pipeline. Connects with
 * DATABASE_MIGRATION_URL, same privileged role migrate.ts/provision.ts use.
 *
 * Usage:
 *   pnpm db:seed:ropa                 seeds the first (or only) workspace
 *   pnpm db:seed:ropa --slug=acme     seeds the workspace with this slug
 */
import postgres from 'postgres';
import { assertWorkspaceSchemaName, loadMigrationUrl } from './lib/db-migrations.ts';

type LawfulBasisDb =
  | 'consent'
  | 'voluntary_provision'
  | 'employment'
  | 'legal_obligation'
  | 'parental_consent'
  | 'security_safeguards';

type Fixture = {
  refSuffix: string; // for log output only — real ref comes from next_ref('RA')
  name: string;
  purpose: string;
  principalType: string;
  principalLabel: string;
  basis: LawfulBasisDb;
  basisRef: string;
  retentionRule: string;
  collectionSource: string;
  storageLocation: string;
  crossesBorder: boolean;
  status: 'approved' | 'needs_review' | 'draft';
  draftedBy: 'human' | 'ai';
  aiConfidence: number | null;
  categories: string[]; // identifier_type_key values
  operations: string[]; // lowercase, CHECK-constrained
  safeguards: string[];
  custom: Record<string, unknown>;
};

const FIXTURES: Fixture[] = [
  {
    refSuffix: '1',
    name: 'Customer support ticketing',
    purpose: 'Resolve customer issues and track support history',
    principalType: 'customers',
    principalLabel: 'Customers',
    basis: 'voluntary_provision',
    basisRef: 's.7(a)',
    retentionRule: '3 years after last contact',
    collectionSource: 'Directly from the individual',
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    crossesBorder: false,
    status: 'approved',
    draftedBy: 'ai',
    aiConfidence: 94,
    categories: ['name', 'email', 'phone'],
    operations: ['collection', 'storage', 'use', 'retrieval'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['Zoho CRM', 'Jira SUPPORT'],
      evidence: ['Zoho CRM · Contacts', 'Jira SUPPORT · 1,120 items', 'support@ mailbox'],
      processors: [],
      recipients: [],
      issues: [],
      aiRationale:
        'Support tickets in Jira are linked to Zoho CRM contacts by email, and the support@ mailbox forwards into the same ticket queue — a customer support flow exists.',
    },
  },
  {
    refSuffix: '2',
    name: 'Payroll processing',
    purpose: 'Calculate and disburse employee salaries',
    principalType: 'employees',
    principalLabel: 'Employees',
    basis: 'employment',
    basisRef: 's.7(i)',
    retentionRule: '8 years (statutory)',
    collectionSource: 'Employer / customer organisation',
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    crossesBorder: false,
    status: 'approved',
    draftedBy: 'human',
    aiConfidence: null,
    categories: ['name', 'aadhaar', 'pan', 'financial'],
    operations: ['collection', 'storage', 'use'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['M365 HR mailbox', 'SharePoint HR-Docs'],
      evidence: ['M365 HR mailbox · salary data', 'SharePoint HR-Docs · offer letters'],
      processors: [],
      recipients: ['Tax authorities (statutory filings)'],
      issues: [],
    },
  },
  {
    refSuffix: '3',
    name: 'Sales pipeline management',
    purpose: 'Track prospects through the sales funnel',
    principalType: 'consumers',
    principalLabel: 'Consumers',
    basis: 'consent',
    basisRef: 's.6',
    retentionRule: '2 years from last activity',
    collectionSource: 'Directly from the individual',
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    crossesBorder: true,
    status: 'needs_review',
    draftedBy: 'ai',
    aiConfidence: 81,
    categories: ['name', 'email', 'phone'],
    operations: ['collection', 'storage', 'use', 'sharing'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['Zoho Leads module'],
      evidence: ['Zoho Leads module', 'M365 campaign folder', 'export_list.csv'],
      processors: ['Email/marketing tool'],
      recipients: [],
      issues: ['Processor location'],
      aiRationale:
        'Leads captured in Zoho are exported into a campaign folder and pushed to an email/marketing tool of unconfirmed location — a sales pipeline exists, but the processor’s location needs owner confirmation.',
    },
  },
  {
    refSuffix: '4',
    name: 'Payment processing',
    purpose: 'Process customer payments and refunds',
    principalType: 'customers',
    principalLabel: 'Customers',
    basis: 'voluntary_provision',
    basisRef: 's.7(a)',
    retentionRule: '7 years (statutory)',
    collectionSource: 'Another internal process',
    storageLocation: 'AWS ap-south-1 (Mumbai) · processor systems',
    crossesBorder: true,
    status: 'approved',
    draftedBy: 'human',
    aiConfidence: null,
    categories: ['name', 'financial'],
    operations: ['collection', 'storage', 'use', 'sharing'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['RDS mysql-prod', 'MySQL billing-db'],
      evidence: [
        'RDS mysql-prod · customers',
        'MySQL billing-db · invoices',
        'Razorpay payment flows',
      ],
      processors: ['Razorpay'],
      recipients: ['Tax authorities (GST filings)'],
      issues: [],
    },
  },
  {
    refSuffix: '5',
    name: 'Candidate recruitment',
    purpose: 'Evaluate and shortlist job applicants',
    principalType: 'candidates',
    principalLabel: 'Candidates',
    basis: 'consent',
    basisRef: 's.6',
    retentionRule: 'Unknown',
    collectionSource: 'Directly from the individual',
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    crossesBorder: true,
    status: 'draft',
    draftedBy: 'ai',
    aiConfidence: 72,
    categories: ['name', 'email', 'phone'],
    operations: ['collection', 'storage', 'use'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['careers@ mailbox'],
      evidence: ['careers@ mailbox', 'CV attachments · M365', 'offer tracker sheet'],
      processors: [],
      recipients: [],
      issues: [],
      retentionUnknown: true,
      aiRationale:
        'CVs land in the careers@ mailbox as M365 attachments and are logged on an offer tracker sheet — a recruitment flow exists, but no retention rule for candidate data was found.',
    },
  },
  {
    refSuffix: '6',
    name: 'Support device inventory',
    purpose: 'Track company devices issued to employees',
    principalType: 'employees',
    principalLabel: 'Employees',
    basis: 'employment',
    basisRef: 's.7(i)',
    retentionRule: 'Duration of employment + 1 year',
    collectionSource: 'Generated internally',
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    crossesBorder: false,
    status: 'draft',
    draftedBy: 'ai',
    aiConfidence: 84,
    categories: ['name', 'device_ids'],
    operations: ['storage', 'use', 'erasure'],
    safeguards: ['encryption_at_rest', 'access_control', 'audit_logging'],
    custom: {
      systems: ['MDM inventory system'],
      evidence: ['MDM inventory export · 240 devices'],
      processors: [],
      recipients: [],
      issues: [],
      aiRationale:
        'The MDM export ties 240 devices to employee names — a device-inventory flow exists.',
    },
  },
];

function slugArg(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith('--slug='));
  return arg?.slice('--slug='.length);
}

async function main(): Promise<void> {
  const slug = slugArg();
  const sql = postgres(loadMigrationUrl(), { max: 1 });

  try {
    const workspaces = slug
      ? await sql<{ schema_name: string; slug: string }[]>`
          select schema_name, slug from public.workspace where slug = ${slug}
        `
      : await sql<{ schema_name: string; slug: string }[]>`
          select schema_name, slug from public.workspace order by created_at limit 1
        `;
    const workspace = workspaces[0];
    if (!workspace) {
      throw new Error(slug ? `No workspace with slug "${slug}"` : 'No workspace found to seed');
    }
    assertWorkspaceSchemaName(workspace.schema_name, 'seed-ropa-demo');
    console.log(`Seeding RoPA demo data into ${workspace.schema_name} (${workspace.slug})`);

    await sql.begin(async (tx) => {
      await tx.unsafe(`set local search_path = "${workspace.schema_name}"`);

      const employees = await tx<{ id: string }[]>`
        select id from employee where deleted_at is null order by created_at
      `;
      if (employees.length === 0) {
        throw new Error(
          `Workspace ${workspace.schema_name} has no employee rows — add at least one via the Employees page before seeding RoPA demo data (activities need a real owner).`,
        );
      }

      let inserted = 0;
      let skipped = 0;
      for (const [index, fixture] of FIXTURES.entries()) {
        const owner = employees[index % employees.length];
        if (!owner) continue;

        const existing = await tx<{ id: string }[]>`
          select id from processing_activity where name = ${fixture.name} and deleted_at is null limit 1
        `;
        if (existing.length > 0) {
          skipped += 1;
          console.log(`  = "${fixture.name}" already exists — skipped`);
          continue;
        }

        const [refRow] = await tx<{ code: string }[]>`select next_ref('RA') as code`;
        const refCode = refRow?.code ?? `RA-00${fixture.refSuffix}`;

        const isApproved = fixture.status === 'approved';
        const [activity] = await tx<{ id: string }[]>`
          insert into processing_activity (
            ref_code, name, purpose, principal_type, basis, basis_ref, retention_rule,
            retention_source, collection_source, storage_location, crosses_border,
            owner_employee_id, status, drafted_by, ai_confidence, custom,
            approved_at, approved_by
          ) values (
            ${refCode}, ${fixture.name}, ${fixture.purpose}, ${fixture.principalType},
            ${fixture.basis}, ${fixture.basisRef}, ${fixture.retentionRule},
            'owner_confirmed', ${fixture.collectionSource}, ${fixture.storageLocation},
            ${fixture.crossesBorder}, ${owner.id}, ${fixture.status}, ${fixture.draftedBy},
            ${fixture.aiConfidence}, ${JSON.stringify(fixture.custom)},
            ${isApproved ? sql`now()` : null}, ${isApproved ? owner.id : null}
          )
          returning id
        `;
        if (!activity) continue;

        for (const key of fixture.categories) {
          await tx`
            insert into activity_category (activity_id, identifier_type_key, is_sensitive)
            values (${activity.id}, ${key}, ${['aadhaar', 'pan', 'bank', 'salary', 'id_proofs', 'child_data', 'health', 'financial'].includes(key)})
          `;
        }
        for (const operation of fixture.operations) {
          await tx`insert into activity_operation (activity_id, operation) values (${activity.id}, ${operation})`;
        }
        for (const safeguardKey of fixture.safeguards) {
          await tx`insert into activity_safeguard (activity_id, safeguard_key) values (${activity.id}, ${safeguardKey})`;
        }

        inserted += 1;
        console.log(`  ✓ ${refCode} "${fixture.name}" → owner ${owner.id}`);
      }

      console.log(
        `\n${String(inserted)} activity(ies) inserted, ${String(skipped)} already present.`,
      );
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
