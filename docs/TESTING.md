# Testing

Tests exist to let you change code confidently. A test that breaks on every refactor
without catching a bug is a liability — it teaches people to delete tests.

## Layers

| Layer       | Tool                       | What it covers                    | Rule                                                 |
| ----------- | -------------------------- | --------------------------------- | ---------------------------------------------------- |
| Unit        | Vitest                     | pure logic, utils, reducers       | Fast, no I/O                                         |
| Component   | Vitest + Testing Library   | behaviour from the user's view    | Query by role/label, never by class or test id first |
| Integration | Vitest + **real Postgres** | repositories, services, isolation | Never mock the database                              |
| E2E         | Playwright                 | critical journeys only            | Auth, workspace switch, primary flow                 |
| Visual      | Storybook + diff           | consistency across components     | Blocks the PR                                        |

## Non-negotiable suites

1. **Workspace isolation** — `WORKSPACE_ISOLATION.md` §7. Runs against real Postgres,
   including the pooled-connection reuse case. Mocks cannot prove connection behaviour.
2. **Authorization** — every protected route/action has a test asserting an
   unauthorised actor is denied. Deny-by-default is a claim that needs evidence.
3. **Error boundaries** — the contract in `ERROR_HANDLING.md` §6 is asserted:
   no internals in the response body, `requestId` always present.

## Rules

- Test **behaviour**, not implementation. If a refactor with no behaviour change breaks
  a test, the test was wrong.
- Every bug fix starts with a failing test (`ERROR_FIXING_PROTOCOL.md` step 1). Verify it
  fails when the fix is reverted — an unverified test proves nothing.
- Arrange–Act–Assert, visibly separated. One reason to fail per test.
- Test names read as sentences: `denies access when the actor has no membership`.
- No shared mutable state between tests; each builds its own fixtures.
- Deterministic: fixed clock, seeded random, no network, no sleeps.
- Coverage is a diagnostic, not a target. 100% coverage of getters proves nothing;
  the isolation suite passing proves a great deal.
