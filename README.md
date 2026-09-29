# Jethur

Multi-workspace (multi-tenant) platform. Next.js 15 App Router, TypeScript, Postgres
with **one schema per workspace**.

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in; the app refuses to boot on bad config
```

### Database Setup & Two-Role Architecture

Jethur is a multi-tenant platform with **one PostgreSQL schema per workspace**. To enforce strict tenant isolation and security, the application uses **two separate database roles**:

| Variable                 | Role Name (default) | Purpose                       | Privileges                                                                                                                                                                      |
| ------------------------ | ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | `app_user`          | **Runtime Web Traffic**       | **Least Privilege**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` within scoped schemas. **Cannot** `CREATE SCHEMA`, `DROP`, or alter DDL.                                            |
| `DATABASE_MIGRATION_URL` | `migrator`          | **Provisioning & Migrations** | **Administrative / DDL**: Can `CREATE SCHEMA`, apply versioned migrations, and `GRANT` permissions on new tenant schemas to `app_user`. Never exposed to HTTP request handlers. |

#### 1. Local PostgreSQL Initialization

Run this SQL block in your PostgreSQL client (`psql -U postgres`) to initialize the database and both roles:

```sql
-- Create database
CREATE DATABASE jethur_dpdp;

-- Connect to the database
\c jethur_dpdp

-- Create the administrative migration role
CREATE ROLE migrator WITH LOGIN SUPERUSER PASSWORD 'change_me';

-- Create the low-privilege application runtime role
CREATE ROLE app_user WITH LOGIN PASSWORD 'change_me';

-- Grant public schema permissions to app_user
GRANT CONNECT ON DATABASE jethur_dpdp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

_(Replace `change_me` with your own passwords and match them in `.env.local`)_

#### 2. Apply Migrations & Provision a Workspace

```bash
# Run migrations across the public schema (control plane)
pnpm db:migrate

# Provision your first development workspace (slug: acme)
pnpm db:provision --slug acme --name "Acme Corp"

# Start the dev server
pnpm dev
```

---

### AI Assistant Onboarding Prompt

If you or a developer on your team are using an AI coding assistant (e.g. Claude, ChatGPT, Cursor, Antigravity) to help set up the environment, copy and paste this prompt:

```markdown
I am setting up the local environment for this repository (Jethur DPDP). This project uses a strict schema-per-workspace multi-tenant architecture with two distinct PostgreSQL database roles:

1. `DATABASE_URL` uses `app_user` (a low-privilege role for handling web requests with no DDL or CREATE SCHEMA permissions).
2. `DATABASE_MIGRATION_URL` uses `migrator` (an administrative role for DDL, running `pnpm db:migrate`, and provisioning new tenant schemas via `pnpm db:provision`).

Please guide me through configuring my `.env.local` and running the necessary PostgreSQL commands, migrations, and workspace provisioning steps to get `pnpm dev` and `pnpm test` running smoothly.
```

## Commands

| Command                               | Does                                                              |
| ------------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                            | Dev server                                                        |
| `pnpm verify`                         | **The gate.** format + lint + types + ds:check + ds:tiers + tests |
| `pnpm ds:neighbors "<desc>"`          | Find existing components before creating a new one                |
| `pnpm ds:neighbors "<desc>" --prompt` | Emit the full generation prompt envelope                          |
| `pnpm ds:manifest`                    | Regenerate the component manifest (after adding a component)      |
| `pnpm ds:check`                       | Validate components against the API contract                      |
| `pnpm ds:tiers`                       | Validate tier structure and file naming                           |
| `pnpm storybook`                      | Component workbench                                               |
| `pnpm test`                           | Vitest                                                            |

## Structure

```
src/app/            routes — the only tier that fetches data
src/components/     atoms → molecules → organisms → templates (one-way deps)
src/server/         server-only: db, workspace isolation, errors, auth, domains
src/shared/         tier-neutral utilities, types, config
design-system/      tokens + generated component manifest
tooling/            eslint rules + scripts (the enforcement machinery)
docs/               the rules
```

## Start here

**[CLAUDE.md](./CLAUDE.md)** — contributor and agent instructions, 5 minutes.
**[docs/00-INDEX.md](./docs/00-INDEX.md)** — full documentation index.

The four rules that block a merge:
[workspace isolation](./docs/WORKSPACE_ISOLATION.md) ·
[error handling](./docs/ERROR_HANDLING.md) ·
[error fixing protocol](./docs/ERROR_FIXING_PROTOCOL.md) ·
[security hygiene](./docs/SECURITY_HYGIENE.md)
