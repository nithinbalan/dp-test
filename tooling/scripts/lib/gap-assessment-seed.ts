/**
 * Gap Assessment questionnaire seeding for a workspace schema — called by
 * tooling/scripts/provision.ts as its final step, same as
 * `seedDefaultRoles()`. Copies the platform's `questionnaire_template`/
 * `question_domain_template`/`question_template` (db/seed/
 * 0002_gap_assessment_questionnaire.sql) into the tenant's own
 * `questionnaire`/`question_domain`/`question` tables, so a newly (or
 * repaired) provisioned workspace can run the Gap Assessment without a
 * separate manual step.
 *
 * Idempotent: `ON CONFLICT DO NOTHING` throughout, safe to re-run on
 * `db:provision --repair` — including against a workspace provisioned before
 * this seed step existed.
 */
import type postgres from 'postgres';
import { assertWorkspaceSchemaName } from './db-migrations.ts';

/** Copies every published platform questionnaire template into one workspace schema. */
export async function seedGapAssessmentQuestionnaire(
  sql: postgres.Sql,
  schemaName: string,
): Promise<void> {
  assertWorkspaceSchemaName(schemaName, 'seedGapAssessmentQuestionnaire');

  const templates = await sql<
    {
      key: string;
      kind: string;
      name: string;
      description: string;
      version: number;
      scoring: unknown;
    }[]
  >`
    select key, kind, name, description, version, scoring
    from public.questionnaire_template
  `;
  if (templates.length === 0) {
    console.log(
      '  · public.questionnaire_template is empty — run `pnpm db:seed` first; skipping questionnaire seed',
    );
    return;
  }

  for (const template of templates) {
    const insertedQuestionnaire = await sql.unsafe<{ id: string }[]>(
      `insert into "${schemaName}".questionnaire (key, template_key, kind, name, description, version, scoring)
       values ($1, $1, $2, $3, $4, $5, $6)
       on conflict (key) do nothing
       returning id`,
      [
        template.key,
        template.kind,
        template.name,
        template.description,
        template.version,
        JSON.stringify(template.scoring),
      ],
    );

    let questionnaireId = insertedQuestionnaire[0]?.id;
    if (questionnaireId === undefined) {
      const existing = await sql.unsafe<{ id: string }[]>(
        `select id from "${schemaName}".questionnaire where key = $1`,
        [template.key],
      );
      questionnaireId = existing[0]?.id;
    }
    if (questionnaireId === undefined) continue;

    const domains = await sql<
      {
        key: string;
        name: string;
        sectionRefs: string[];
        moduleKey: string | null;
        gateKey: string | null;
        position: number;
      }[]
    >`
      select key, name, section_refs as "sectionRefs", module_key as "moduleKey", gate_key as "gateKey", position
      from public.question_domain_template
      where questionnaire_key = ${template.key}
      order by position
    `;

    const domainIdByKey = new Map<string, string>();
    for (const domain of domains) {
      const insertedDomain = await sql.unsafe<{ id: string }[]>(
        `insert into "${schemaName}".question_domain (questionnaire_id, key, name, section_refs, module_key, gate_key, position)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (questionnaire_id, key) do nothing
         returning id`,
        [
          questionnaireId,
          domain.key,
          domain.name,
          domain.sectionRefs,
          domain.moduleKey,
          domain.gateKey,
          domain.position,
        ],
      );
      let domainId = insertedDomain[0]?.id;
      if (domainId === undefined) {
        const existing = await sql.unsafe<{ id: string }[]>(
          `select id from "${schemaName}".question_domain where questionnaire_id = $1 and key = $2`,
          [questionnaireId, domain.key],
        );
        domainId = existing[0]?.id;
      }
      if (domainId !== undefined) domainIdByKey.set(domain.key, domainId);
    }

    const questions = await sql<
      {
        domainKey: string;
        code: string;
        weight: number;
        sectionRef: string | null;
        prompt: string;
        remedy: string;
        moduleKey: string | null;
        position: number;
      }[]
    >`
      select domain_key as "domainKey", code, weight, section_ref as "sectionRef", prompt, remedy, module_key as "moduleKey", position
      from public.question_template
      where questionnaire_key = ${template.key}
      order by position
    `;

    for (const q of questions) {
      const domainId = domainIdByKey.get(q.domainKey);
      if (domainId === undefined) continue;
      await sql.unsafe(
        `insert into "${schemaName}".question (questionnaire_id, domain_id, code, weight, section_ref, prompt, remedy, module_key, position)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (questionnaire_id, code) do nothing`,
        [
          questionnaireId,
          domainId,
          q.code,
          q.weight,
          q.sectionRef,
          q.prompt,
          q.remedy,
          q.moduleKey,
          q.position,
        ],
      );
    }
  }
}
