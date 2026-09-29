#!/usr/bin/env node
/**
 * Drizzle ↔ SQL drift check.
 *
 * db/schema/*.sql is the source of truth (docs/DATABASE_DESIGN.md §9). The Drizzle
 * schema under src/server/db/schema/ is a hand-written, deliberately PARTIAL mirror:
 * only tables the app queries are declared. Partial is fine; wrong is not. This
 * script fails when a mirrored table disagrees with the SQL it claims to mirror:
 *
 *   - a Drizzle table that no SQL migration creates
 *   - a column present on one side and not the other
 *   - a column whose NOT NULL differs
 *   - a pgEnum whose values differ from the SQL enum
 *   - a CHECK (col IN (...)) allowlist the TypeScript side narrows differently
 *
 * SQL tables with no Drizzle mirror are listed for information only.
 *
 * Deterministic and database-free, so it runs in `pnpm verify` and CI. Usage:
 *   node tooling/scripts/check-db-schema.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// `import.meta.dirname`, like every other script in this folder. A
// `new URL(...).pathname` here yields a percent-encoded, leading-slash path that is
// not a valid Windows path, so the check crashed instead of running.
const ROOT = resolve(import.meta.dirname, '../..');
const SQL_DIR = join(ROOT, 'db/schema');
const TS_DIR = join(ROOT, 'src/server/db/schema');

// ---------------------------------------------------------------------------
// SQL side
// ---------------------------------------------------------------------------

function stripSqlComments(text) {
  return text.replace(/--[^\n]*/g, '');
}

/** Splits `a, b(c, d), e` on top-level commas only. */
function splitTopLevel(body, separator = ',') {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Finds the body between the `(` that follows `start` and its matching `)`. */
function balancedBody(text, start) {
  const open = text.indexOf('(', start);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return { body: text.slice(open + 1, i), end: i };
    }
  }
  throw new Error(`Unbalanced parentheses after offset ${start}`);
}

function parseSqlEnumValues(list) {
  return [...list.matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

function parseSql(text) {
  const clean = stripSqlComments(text);
  const tables = new Map();
  const enums = new Map();

  for (const m of clean.matchAll(/CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\(/gi)) {
    const { body } = balancedBody(clean, m.index + m[0].length - 1);
    enums.set(m[1].toLowerCase(), parseSqlEnumValues(body));
  }

  for (const m of clean.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/gi)) {
    const name = m[1].toLowerCase();
    const { body } = balancedBody(clean, m.index + m[0].length - 1);
    const columns = new Map();
    for (const entry of splitTopLevel(body)) {
      const head = entry.split(/\s+/)[0].toUpperCase();
      if (['CONSTRAINT', 'UNIQUE', 'PRIMARY', 'CHECK', 'FOREIGN', 'EXCLUDE'].includes(head)) {
        continue;
      }
      const [, col, type] = /^(\w+)\s+(\w+(?:\([^)]*\))?(?:\[\])?)/.exec(entry) ?? [];
      if (!col) continue;
      const upper = entry.toUpperCase();
      const notNull = /\bNOT\s+NULL\b/.test(upper) || /\bPRIMARY\s+KEY\b/.test(upper);
      const check = /\bCHECK\s*\(\s*\w+\s+IN\s*\(/i.exec(entry);
      const allowed = check ? parseSqlEnumValues(balancedBody(entry, check.index).body) : null;
      columns.set(col.toLowerCase(), { type: type.toLowerCase(), notNull, allowed });
    }
    tables.set(name, columns);
  }

  return { tables, enums };
}

/**
 * A later migration may replace a column's CHECK allowlist, add a new column to
 * a table an earlier migration created, or drop one. Applied in file order on
 * top of the CREATE TABLE definitions, so the merged view is what the database
 * enforces after every migration has run.
 */
function applySqlAlterations(text, tables) {
  const clean = stripSqlComments(text);

  const checkRe = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+CHECK\s*\(\s*(\w+)\s+IN\s*\(/gi;
  for (const m of clean.matchAll(checkRe)) {
    const column = tables.get(m[1].toLowerCase())?.get(m[2].toLowerCase());
    if (!column) continue;
    column.allowed = parseSqlEnumValues(balancedBody(clean, m.index + m[0].length - 1).body);
  }

  const addColumnRe =
    /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)\s+(\w+(?:\([^)]*\))?(?:\[\])?)([^;]*);/gi;
  for (const m of clean.matchAll(addColumnRe)) {
    const columns = tables.get(m[1].toLowerCase());
    if (!columns) continue;
    const [, , col, type, rest] = m;
    const upper = rest.toUpperCase();
    const notNull = /\bNOT\s+NULL\b/.test(upper);
    columns.set(col.toLowerCase(), { type: type.toLowerCase(), notNull, allowed: null });
  }

  const dropColumnRe = /ALTER\s+TABLE\s+(\w+)\s+DROP\s+COLUMN\s+(\w+)\s*;/gi;
  for (const m of clean.matchAll(dropColumnRe)) {
    tables.get(m[1].toLowerCase())?.delete(m[2].toLowerCase());
  }
}

// ---------------------------------------------------------------------------
// Drizzle side
// ---------------------------------------------------------------------------

function stripTsComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function parseTs(text) {
  const clean = stripTsComments(text);
  const tables = new Map();
  const enums = new Map();

  // `export type Foo = 'a' | 'b';` — string-literal unions a column may narrow to.
  const aliases = new Map();
  for (const m of clean.matchAll(/type\s+(\w+)\s*=\s*([^;]+);/g)) {
    if (m[2].includes("'")) aliases.set(m[1], parseSqlEnumValues(m[2]));
  }

  for (const m of clean.matchAll(/pgEnum\(\s*'(\w+)'\s*,\s*\[/g)) {
    const start = clean.indexOf('[', m.index);
    const end = clean.indexOf(']', start);
    enums.set(m[1], parseSqlEnumValues(clean.slice(start, end)));
  }

  for (const m of clean.matchAll(/pgTable\(\s*'(\w+)'\s*,\s*\{/g)) {
    const open = clean.indexOf('{', m.index);
    let depth = 0;
    let close = open;
    for (let i = open; i < clean.length; i += 1) {
      if (clean[i] === '{') depth += 1;
      if (clean[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    const columns = new Map();
    for (const entry of splitTopLevel(clean.slice(open + 1, close))) {
      const [, builder, col] = /^\w+\s*:\s*(\w+)\(\s*'(\w+)'/.exec(entry) ?? [];
      if (!col) continue;
      const notNull = /\.notNull\(\)/.test(entry) || /\.primaryKey\(\)/.test(entry);
      const enumRef = enums.has(builder) ? builder : null;
      // `.$type<'a' | 'b'>()` narrows a text column to a literal union.
      const typed = /\.\$type<([^>]*)>\(\)/.exec(entry)?.[1].trim();
      const allowed = typed
        ? (aliases.get(typed) ?? (typed.includes("'") ? parseSqlEnumValues(typed) : null))
        : null;
      columns.set(col, { builder, notNull, enumRef, allowed });
    }
    tables.set(m[1], columns);
  }

  return { tables, enums };
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

function readAll(dir, ext) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'));
}

const sqlFiles = readAll(SQL_DIR, '.sql');
const sql = sqlFiles.map(parseSql).reduce(
  (acc, part) => {
    for (const [k, v] of part.tables) acc.tables.set(k, v);
    for (const [k, v] of part.enums) acc.enums.set(k, v);
    return acc;
  },
  { tables: new Map(), enums: new Map() },
);
for (const file of sqlFiles) applySqlAlterations(file, sql.tables);
const ts = readAll(TS_DIR, '.ts')
  .map(parseTs)
  .reduce(
    (acc, part) => {
      for (const [k, v] of part.tables) acc.tables.set(k, v);
      for (const [k, v] of part.enums) acc.enums.set(k, v);
      return acc;
    },
    { tables: new Map(), enums: new Map() },
  );

const problems = [];
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

for (const [name, values] of ts.enums) {
  const sqlValues = sql.enums.get(name);
  if (!sqlValues)
    problems.push(`enum "${name}" is declared in Drizzle but no SQL migration creates it`);
  else if (!same(values, sqlValues)) {
    problems.push(`enum "${name}": Drizzle [${values.join(', ')}] ≠ SQL [${sqlValues.join(', ')}]`);
  }
}

for (const [table, tsCols] of ts.tables) {
  const sqlCols = sql.tables.get(table);
  if (!sqlCols) {
    problems.push(`table "${table}" is declared in Drizzle but no SQL migration creates it`);
    continue;
  }
  for (const col of sqlCols.keys()) {
    if (!tsCols.has(col))
      problems.push(`${table}.${col} exists in SQL but not in the Drizzle mirror`);
  }
  for (const [col, tsCol] of tsCols) {
    const sqlCol = sqlCols.get(col);
    if (!sqlCol) {
      problems.push(`${table}.${col} is declared in Drizzle but does not exist in SQL`);
      continue;
    }
    if (sqlCol.notNull !== tsCol.notNull) {
      problems.push(
        `${table}.${col}: NOT NULL is ${String(sqlCol.notNull)} in SQL, ${String(tsCol.notNull)} in Drizzle`,
      );
    }
    if (sqlCol.allowed && !tsCol.enumRef) {
      // Free-text column with a CHECK allowlist: the TS side must narrow to the
      // same literal union, so a service cannot compile a value the row would reject.
      const expected = `.$type<'${sqlCol.allowed.join("' | '")}'>()`;
      if (!tsCol.allowed) {
        problems.push(
          `${table}.${col}: SQL restricts to (${sqlCol.allowed.join(', ')}) — declare it with ${expected}`,
        );
      } else if (!same([...tsCol.allowed].sort(), [...sqlCol.allowed].sort())) {
        problems.push(
          `${table}.${col}: Drizzle allows (${tsCol.allowed.join(', ')}) but SQL CHECK allows (${sqlCol.allowed.join(', ')}) — declare it with ${expected}`,
        );
      }
    }
  }
}

const unmirrored = [...sql.tables.keys()].filter((t) => !ts.tables.has(t));

if (problems.length > 0) {
  console.error('db schema drift — Drizzle mirror disagrees with db/schema/*.sql:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    '\nSQL is the source of truth. Fix the Drizzle declaration (or write a NEW migration —' +
      ' never edit an applied one). See docs/DATABASE_DESIGN.md §9.',
  );
  process.exit(1);
}

console.log(
  `db schema: ${String(ts.tables.size)} mirrored table(s) match SQL; ` +
    `${String(unmirrored.length)} SQL table(s) have no Drizzle mirror yet.`,
);
