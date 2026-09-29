#!/usr/bin/env node
/**
 * Scans hand-written CSS for physical direction properties.
 *
 * ESLint covers TS/TSX, where nearly all styling lives. This covers the stylesheets
 * it cannot see. Generated CSS is skipped — it is a projection of theme.json and
 * locales.json, both of which are direction-neutral by construction.
 *
 * Writes nothing.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

const PHYSICAL = [
  [/\bmargin-left\s*:/, 'margin-inline-start'],
  [/\bmargin-right\s*:/, 'margin-inline-end'],
  [/\bpadding-left\s*:/, 'padding-inline-start'],
  [/\bpadding-right\s*:/, 'padding-inline-end'],
  [/\bborder-left\b(?!-radius)/, 'border-inline-start'],
  [/\bborder-right\b(?!-radius)/, 'border-inline-end'],
  [/\bborder-top-left-radius\s*:/, 'border-start-start-radius'],
  [/\bborder-top-right-radius\s*:/, 'border-start-end-radius'],
  [/\bborder-bottom-left-radius\s*:/, 'border-end-start-radius'],
  [/\bborder-bottom-right-radius\s*:/, 'border-end-end-radius'],
  [/^\s*left\s*:/, 'inset-inline-start'],
  [/^\s*right\s*:/, 'inset-inline-end'],
  [/text-align\s*:\s*(left|right)/, 'text-align: start | end'],
  [/\bfloat\s*:\s*(left|right)/, 'float: inline-start | inline-end'],
];

const files = [];
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.css')) files.push(p);
  }
};
walk(join(ROOT, 'src'));
walk(join(ROOT, 'design-system'));

const errors = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/GENERATED/.test(text.slice(0, 400))) continue;

  text.split('\n').forEach((line, i) => {
    if (/\/\*/.test(line)) return;
    for (const [pattern, suggest] of PHYSICAL) {
      if (pattern.test(line)) {
        errors.push(
          `${relative(ROOT, file)}:${i + 1}: physical property breaks RTL — use \`${suggest}\`\n      ${line.trim()}`,
        );
        break;
      }
    }
  });
}

errors.forEach((e) => console.error(`  ERROR ${e}`));
if (errors.length) {
  console.error(
    `\nds:rtl failed — ${errors.length} physical direction propert(ies) in hand-written CSS.`,
  );
  console.error('See docs/INTERNATIONALIZATION.md.\n');
  process.exit(1);
}
console.log(`ds:rtl passed — ${files.length} stylesheet(s), no physical direction properties`);
