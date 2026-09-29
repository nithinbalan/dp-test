# Architecture Decision Records

One file per decision that is expensive to reverse. Numbered, immutable once accepted —
superseded by a new ADR rather than edited, so the reasoning history stays readable.

Write one when: a boundary changes, a dependency is added that would be painful to
remove, an invariant in `WORKSPACE_ISOLATION.md` or `ERROR_HANDLING.md` is amended, or
someone asks "why is it like this?" for the second time.

Copy `0000-template.md`.
