---
id: ADR-0002
title: Single Next.js app, boundaries enforced by lint
status: accepted
date: 2026-08-20
affects:
  - src/components
  - src/server
  - src/shared
tags: [architecture, boundaries, tooling]
---

# ADR-0002: Single Next.js app, boundaries enforced by lint

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

The project needs strong internal boundaries (tiers, isolation layer, shared code). The
usual answer is a monorepo with one package per boundary, which makes violations
impossible to compile. It also adds build orchestration, versioning, and a slower loop —
before there is a second consumer of any package.

## Decision

One app. Boundaries enforced by ESLint rules (`tier-boundary`, `require-workspace-scope`)
and by branded types. Directory structure mirrors what the packages would be, so the
split is mechanical later.

## Consequences

**Good:** fast loop, no build orchestration, single version, boundaries still enforced in CI.
**Bad:** enforcement is a lint rule, which can be disabled — hence the ADR requirement on
disabling isolation rules. No independent versioning.
**Now harder to change:** nothing structural; the directory layout is the future package layout.

## Revisit when

A second consumer appears (mobile app, second web surface, published design system), or
CI time is dominated by rebuilding unchanged code.
