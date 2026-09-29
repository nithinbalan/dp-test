/**
 * MOCK DATA — see the note in `workspace.ts`. A tiny keyword-matched
 * knowledge base standing in for a real model — `/ai` scores each entry by
 * how many of its keywords appear in the question and returns the best match.
 */

export type KnowledgeEntry = {
  id: string;
  keywords: string[];
  answer: string;
};

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'kb-dpdp-act',
    keywords: ['dpdp act', 'what is dpdp', 'digital personal data protection'],
    answer:
      'The Digital Personal Data Protection Act, 2023 (DPDP Act) is India\'s law governing how organisations — "Data Fiduciaries" — collect, use, store and share the personal data of individuals, or "Data Principals". Jethur tracks your compliance against it module by module: notice, consent, rights, security, retention, breach, processors, transfers and governance.',
  },
  {
    id: 'kb-consent',
    keywords: ['consent', 'withdraw', 'opt out', 'opt-out'],
    answer:
      'Consent under section 6 must be free, specific, informed and unambiguous — no pre-ticked boxes, no bundling. Withdrawal has to be as easy as giving consent was. You can see every consent event and its withdrawal state in the Consent Ledger.',
  },
  {
    id: 'kb-breach',
    keywords: ['breach', 'incident', '72 hours', 'notify board'],
    answer:
      'A personal data breach triggers two clocks: affected data principals are told without delay, and the Data Protection Board gets an immediate description followed by a detailed report within 72 hours (Rule 7). Breach Management tracks both timers from the moment of detection.',
  },
  {
    id: 'kb-dpo',
    keywords: ['dpo', 'data protection officer', 'contact person'],
    answer:
      'Section 8(9) and Rule 9 require a published contact for questions about processing — a Data Protection Officer for Significant Data Fiduciaries, or a nominated contact person otherwise. Configuration Studio is where that contact is published.',
  },
  {
    id: 'kb-children',
    keywords: ['children', 'minor', 'parental consent', 'under 18', 'guardian'],
    answer:
      "Section 9 requires verifiable parental or guardian consent before processing a child's personal data, and bans tracking, behavioural monitoring or targeted advertising directed at children. Penalties here can run up to ₹200 crore.",
  },
  {
    id: 'kb-transfers',
    keywords: ['cross-border', 'transfer', 'outside india', 'restricted countries'],
    answer:
      'Section 16 lets personal data leave India by default, except to destinations the Central Government has restricted by notification. Cross-Border Transfers keeps the register of what leaves India and screens it against the current restricted list.',
  },
  {
    id: 'kb-retention',
    keywords: ['retention', 'erase', 'delete', 'erasure', 'how long'],
    answer:
      "Rule 8 requires personal data to be erased once its purpose is served, with at least 48 hours' notice before deletion where the data principal could still act on it. Every processing activity in RoPA should carry a sourced retention period.",
  },
  {
    id: 'kb-rights',
    keywords: ['rights', 'access request', 'correction', 'grievance'],
    answer:
      'Data principals can ask for a summary of what is processed about them (s.11), ask for correction or erasure (s.12), raise a grievance with you before the Board (s.13), and nominate someone to act for them (s.14). DSR Requests tracks each of these end to end.',
  },
  {
    id: 'kb-dpia',
    keywords: ['dpia', 'impact assessment'],
    answer:
      'A Data Protection Impact Assessment screens a processing activity for risk before it scales — typically triggered by sensitive categories like financial data, government IDs, or activity involving children. The DPIA module screens your RoPA automatically.',
  },
  {
    id: 'kb-penalty',
    keywords: ['penalty', 'fine', 'crore'],
    answer:
      "Penalties under the DPDP Act scale with the obligation breached — up to ₹250 crore for a failure of reasonable security safeguards, ₹200 crore for a breach involving children's data, and ₹50 crore for processing without a lawful basis. Controls · CCM shows which obligations carry which exposure.",
  },
];

const FALLBACK_ANSWER =
  "I don't have a confident answer for that yet. Try asking about consent, notices, breach timelines, DPIA, retention, or data principal rights — or check the relevant module in the sidebar.";

export function findAnswer(query: string): string {
  const normalised = query.toLowerCase();
  let best: { entry: KnowledgeEntry; score: number } | null = null;
  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.keywords.filter((keyword) => normalised.includes(keyword)).length;
    if (score > 0 && (best === null || score > best.score)) {
      best = { entry, score };
    }
  }
  return best?.entry.answer ?? FALLBACK_ANSWER;
}
