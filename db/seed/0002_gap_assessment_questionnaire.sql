-- ─────────────────────────────────────────────────────────────────────────────
-- SEED · GAP ASSESSMENT QUESTIONNAIRE TEMPLATE (JDP-GAP)
-- ─────────────────────────────────────────────────────────────────────────────
-- Applies to `public` only — the platform-level TEMPLATE a workspace's own
-- `questionnaire`/`question_domain`/`question` rows are copied from at
-- provisioning time (see tooling/scripts/lib/gap-assessment-seed.ts). Applied
-- by `pnpm db:seed`, same as 0001_module_permission_catalog.sql: idempotent,
-- extended in place, never superseded by a new numbered file.
--
-- 9 domains (A–I), 43 questions. `module_key` values are the exact keys from
-- `module` (0001_module_permission_catalog.sql) — note `thirdparty` and
-- `datamap` have no hyphen there, unlike their route folder names
-- (`/third-party`, `/data-map`); the service layer's `MODULE_ROUTES` maps
-- between the two, so this file must keep using the catalog's real keys.
--
-- `penalty_head_key` is left NULL throughout: `penalty_head.section_ref`
-- itself references the (not yet seeded) `dpdp_section` statutory catalog —
-- the same "do not guess a statutory judgment call from here" reasoning
-- 0001_module_permission_catalog.sql already documents for `section_ref`.
-- The statutory-exposure card (which is what actually reads this column) is
-- out of scope for this pass; populate it once `dpdp_section`/`penalty_head`
-- are seeded for real.

INSERT INTO questionnaire_template (key, kind, name, description, version, scoring) VALUES
  ('gap_dpdp_v1', 'gap', 'DPDP Gap Assessment',
   'A guided self-assessment against the Digital Personal Data Protection Act, 2023.',
   1, '{"points":{"y":100,"p":50,"n":0,"u":0},"bands":[{"min":85,"key":"ready"},{"min":65,"key":"substantial"},{"min":40,"key":"developing"},{"min":0,"key":"high-exposure"}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO question_domain_template (questionnaire_key, key, name, section_refs, icon, module_key, penalty_head_key, gate_key, position) VALUES
  ('gap_dpdp_v1', 'A', 'Notice & Consent',            '{s.5,s.6,s.7}',   'file-text',      'notices',    NULL,    NULL,    1),
  ('gap_dpdp_v1', 'B', 'Children & Guardians',        '{s.9}',           'mood-kid',       'consent',    NULL,    'kids',  2),
  ('gap_dpdp_v1', 'C', 'Data Principal Rights',       '{s.11,s.12,s.13,s.14}', 'inbox',    'dsr',        NULL,    NULL,    3),
  ('gap_dpdp_v1', 'D', 'Security Safeguards',         '{s.8(4),s.8(5)}', 'shield-lock',    'controls',   NULL,    NULL,    4),
  ('gap_dpdp_v1', 'E', 'Breach Response',             '{s.8(6)}',        'urgent',         'breach',     NULL,    NULL,    5),
  ('gap_dpdp_v1', 'F', 'Retention & Erasure',         '{s.8(7),s.8(8)}', 'trash',          'ropa',       NULL,    NULL,    6),
  ('gap_dpdp_v1', 'G', 'Processors & Third Parties',  '{s.8(1),s.8(2)}', 'affiliate',      'thirdparty', NULL,    'proc',  7),
  ('gap_dpdp_v1', 'H', 'Cross-Border Transfers',      '{s.16}',          'world-share',    'transfers',  NULL,    'xbt',   8),
  ('gap_dpdp_v1', 'I', 'Governance & Accountability', '{s.8(9),s.10}',   'scale',          'settings',   NULL,    NULL,    9)
ON CONFLICT (questionnaire_key, key) DO NOTHING;

INSERT INTO question_template (questionnaire_key, domain_key, code, weight, section_ref, prompt, remedy, module_key, position) VALUES
  ('gap_dpdp_v1','A','A1',3,'s.5(1)','Every point where you collect personal data shows a notice before or at the time of collection.','Publish a notice for each collection point — web form, app sign-up, WhatsApp, offline register. Notice Manager drafts one per RoPA activity.','notices',1),
  ('gap_dpdp_v1','A','A2',2,'s.5(1)(a)–(c)','The notice itemises the exact personal data, the specific purpose, how to exercise rights, and how to complain to the Data Protection Board.','Use the itemised notice template — Jethur AI checks every required element is present before you publish.','notices',2),
  ('gap_dpdp_v1','A','A3',2,'s.5(3)','The notice is available in English and in the Eighth Schedule languages your data principals actually use.','Publish translations from the notice editor — Hindi plus one regional language covers most Indian SME user bases.','notices',3),
  ('gap_dpdp_v1','A','A4',3,'s.6(1)','Consent is free, specific, informed, unconditional and unambiguous, given by a clear affirmative action — no pre-ticked boxes, no bundling.','Replace pre-ticked and bundled checkboxes with one purpose-wise opt-in per collection point.','consent',4),
  ('gap_dpdp_v1','A','A5',3,'s.6(4)–(6)','A data principal can withdraw consent as easily as they gave it, and withdrawal actually stops the processing — including at your processors.','Add a one-click withdrawal path and wire withdrawal propagation to downstream tools in the Consent Ledger.','consent',5),
  ('gap_dpdp_v1','A','A6',2,'s.6(1) · s.4(1)','You collect only what the stated purpose needs, and you keep a record of what each person consented to and when.','Trim over-collected fields, then log every consent event with purpose, timestamp and notice version.','consent',6),
  ('gap_dpdp_v1','A','A7',1,'s.7','Where you rely on a legitimate use instead of consent, you have recorded which clause of s.7 applies and why.','Record the legitimate-use ground on the RoPA entry for each activity that does not run on consent.','ropa',7),
  ('gap_dpdp_v1','B','B1',3,'s.9(1)','You obtain verifiable consent from a parent or lawful guardian before processing a child''s personal data.','Add a guardian-consent flow with an identity check before any under-18 account becomes active.','consent',8),
  ('gap_dpdp_v1','B','B2',3,'s.9(1)','Age is verified at sign-up by a reliable method — not a self-declared tick box.','Introduce an age-assurance step (DigiLocker, guardian verification, or a documented risk-based method).','consent',9),
  ('gap_dpdp_v1','B','B3',3,'s.9(3)','You do no behavioural tracking and no advertising targeted at children.','Disable tracking pixels, profiling and ad targeting on every under-18 account.','consent',10),
  ('gap_dpdp_v1','B','B4',2,'s.9(2)','You do not undertake processing likely to cause any detrimental effect on the well-being of a child.','Run a DPIA on every child-facing feature and record the well-being assessment.','dpia',11),
  ('gap_dpdp_v1','B','B5',2,'s.9(1)','For a person with disability who has a lawful guardian, consent is taken from that guardian.','Extend the guardian-consent flow to lawful guardians appointed under disability law.','consent',12),
  ('gap_dpdp_v1','C','C1',3,'s.11','On request you can give a data principal a summary of their personal data and the identity of everyone it was shared with.','Connect your data sources so a rights request is answered from the Data Map instead of by hand.','dsr',13),
  ('gap_dpdp_v1','C','C2',3,'s.12','You can correct, complete, update and erase a person''s data across every system that holds it.','Map each dataset to its owner and system so a correction or erasure can be executed end to end.','dsr',14),
  ('gap_dpdp_v1','C','C3',3,'s.13','A grievance redressal mechanism is published, with a named responder and a stated response period.','Publish the grievance channel in your notice and name the responder in Configuration Studio.','dsr',15),
  ('gap_dpdp_v1','C','C4',2,'s.14','A data principal can nominate someone to exercise their rights in the event of death or incapacity.','Add a nomination field to account settings and store the nominee against the principal record.','dsr',16),
  ('gap_dpdp_v1','C','C5',2,'s.13(2)','Every rights request is logged with timestamps, so you can prove you responded inside your published period.','Route all requests through the DSR module so the clock, owner and outcome are recorded automatically.','dsr',17),
  ('gap_dpdp_v1','C','C6',1,'s.5(1)(b)','The means to exercise rights is published where users can actually find it — not buried in a PDF.','Link the rights page from your notice, your site footer and the in-app account screen.','notices',18),
  ('gap_dpdp_v1','D','D1',3,'s.8(5)','Reasonable security safeguards are in place and documented — encryption in transit and at rest, plus access control.','Document the safeguards per system and attach the evidence to the s.8(5) controls in CCM.','controls',19),
  ('gap_dpdp_v1','D','D2',2,'s.8(5)','Access to personal data is least-privilege, reviewed periodically, and leavers are de-provisioned promptly.','Run a quarterly access review and tie de-provisioning to the employee exit checklist.','controls',20),
  ('gap_dpdp_v1','D','D3',2,'s.8(5)','Logging and monitoring would let you detect unauthorised access and reconstruct what happened.','Turn on audit logging for every system holding personal data, and retain logs long enough to investigate.','controls',21),
  ('gap_dpdp_v1','D','D4',2,'s.8(4)','Organisational measures exist — a data protection policy, defined roles and staff training — not only technical controls.','Publish the policy, assign roles, and complete the DPDP awareness course for everyone who touches personal data.','academy',22),
  ('gap_dpdp_v1','D','D5',2,'s.8(5)','Backups are taken, encrypted, and restore-tested at a defined interval.','Schedule a restore test and keep the result as control evidence.','controls',23),
  ('gap_dpdp_v1','E','E1',3,'s.8(6)','A documented breach response plan says who decides, who notifies, and within what time.','Adopt the breach playbook and name the decision-maker and the notifier in Configuration Studio.','breach',24),
  ('gap_dpdp_v1','E','E2',3,'s.8(6)','You could notify the Data Protection Board of India in the prescribed form without delay.','Pre-fill the Board notification template so a live incident only needs the facts filled in.','breach',25),
  ('gap_dpdp_v1','E','E3',3,'s.8(6)','You could notify every affected data principal — which means you can identify exactly who was affected.','Keep the Data Map current so an incident can be scoped to the datasets and the people involved.','breach',26),
  ('gap_dpdp_v1','E','E4',1,'s.8(6)','The plan has been rehearsed at least once — tabletop or live drill — in the last 12 months.','Run a one-hour tabletop against a realistic scenario and file the notes as evidence.','breach',27),
  ('gap_dpdp_v1','F','F1',3,'s.8(7)','A retention period is defined for each purpose, and personal data is erased once that purpose is served.','Set a retention rule on every RoPA activity, then schedule the erasure job.','ropa',28),
  ('gap_dpdp_v1','F','F2',2,'s.8(7)','Erasure reaches processors, backups and copies — not just the primary database.','List every copy of a dataset in the Data Map, and include processors in the erasure instruction.','datamap',29),
  ('gap_dpdp_v1','F','F3',2,'s.8(8)','Where another law sets the retention period (tax, labour, sectoral), you have recorded that law against the data.','Record the statutory basis on the retention rule so a longer period can be justified.','ropa',30),
  ('gap_dpdp_v1','F','F4',1,'s.8(7)','Erasure events are logged, so you can evidence that data was actually deleted.','Capture the erasure log as control evidence against the retention control.','controls',31),
  ('gap_dpdp_v1','G','G1',3,'s.8(2)','Every processor that handles personal data on your behalf is engaged under a valid written contract.','Collect a signed DPDP-compliant contract for each processor in the Third-Party Risk register.','thirdparty',32),
  ('gap_dpdp_v1','G','G2',2,'s.8(1)','Contracts cascade your duties — security, breach reporting in time for your s.8(6) deadline, erasure on instruction, and cease-on-withdrawal under s.6(6).','Add the four cascade clauses to your standard processing addendum and re-paper existing vendors.','thirdparty',33),
  ('gap_dpdp_v1','G','G3',2,'s.8(1)','You keep a current register of processors and exactly what personal data each one holds.','Build the processor register from the recipients already named in your RoPA.','thirdparty',34),
  ('gap_dpdp_v1','G','G4',2,'s.8(5)','You assess a processor''s security before onboarding, and re-check it periodically.','Send the standard security questionnaire at onboarding and on an annual cycle.','thirdparty',35),
  ('gap_dpdp_v1','H','H1',2,'s.16(1)','You know every country personal data is transferred to — including cloud regions, backups and support access from outside India.','Record each transfer with destination, vendor and mechanism in Cross-Border Transfers.','transfers',36),
  ('gap_dpdp_v1','H','H2',2,'s.16(1)','Destinations are checked against the Central Government''s restricted-country notifications.','Turn on notification monitoring so a newly restricted country flags your existing transfers.','transfers',37),
  ('gap_dpdp_v1','H','H3',1,'s.16(2)','Where a sectoral law (RBI, IRDAI and the like) demands local storage, you follow the stricter rule.','Record the sectoral restriction against the affected datasets and block non-compliant destinations.','transfers',38),
  ('gap_dpdp_v1','I','I1',3,'s.8(9)','The business contact information of a Data Protection Officer — or of a person able to answer questions about your processing — is published.','Name the contact in Configuration Studio and publish it in every notice and on your website.','settings',39),
  ('gap_dpdp_v1','I','I2',2,'s.8(1)','You maintain a record of processing activities that is current and confirmed by the owner of each activity.','Complete your RoPA and send each activity to its owner for confirmation.','ropa',40),
  ('gap_dpdp_v1','I','I3',2,'s.10','You have assessed whether you are a Significant Data Fiduciary — and if notified as one, appointed an India-based DPO and an independent data auditor, and run periodic DPIAs and audits.','Record the SDF assessment; if you are notified, start the DPIA and audit cycle.','dpia',41),
  ('gap_dpdp_v1','I','I4',2,'s.8(1)','DPDP responsibilities are assigned to named people, with management sign-off.','Assign module owners in Configuration Studio and take a documented management sign-off.','settings',42),
  ('gap_dpdp_v1','I','I5',1,'s.8(1)','Compliance is reviewed at a defined cadence, and the review itself is evidenced.','Set a quarterly review and re-run this assessment each time, so the trend is on record.','gap',43)
ON CONFLICT (questionnaire_key, code) DO NOTHING;
