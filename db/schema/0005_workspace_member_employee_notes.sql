-- =============================================================================
-- JETHUR DPDP · WORKSPACE · Documents the member <-> employee insert ordering
-- =============================================================================
-- `member.employee_id` and `employee.member_id` reference each other (both
-- nullable), which the September 2026 backend audit flagged as a design smell
-- worth a one-line convention rather than being reinvented per module. Recorded
-- as COMMENT ON so it surfaces in \d and any schema-introspection tooling, not
-- only in a doc someone has to remember to open. No behavioural change.
-- =============================================================================

COMMENT ON COLUMN member.employee_id IS
  'Nullable, references employee(id). A member created before their employee '
  'record exists (e.g. self-signup) has this NULL until reconciled. Insert order: '
  'create employee first when both are known at once (the common case: HR-driven '
  'onboarding); create member first only for self-signup, and backfill employee_id '
  'once the employee register catches up. Neither FK is deferred, so never insert '
  'either row expecting the other side to already exist.';

COMMENT ON COLUMN employee.member_id IS
  'Nullable, references member(id). NULL means this employee has no platform '
  'login (most of the People Register). See member.employee_id for the insert-'
  'order convention between this pair.';
