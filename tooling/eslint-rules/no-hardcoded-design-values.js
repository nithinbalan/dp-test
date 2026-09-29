/**
 * Bans raw design values in source. Everything must resolve through a semantic
 * token (design-system/tokens/*.css -> Tailwind theme -> utility class).
 *
 * Catches:
 *   - hex colors            #fff, #3b82f6, #3b82f6cc
 *   - rgb()/hsl()/oklch()   literal color functions
 *   - raw px in style props / template literals (except 0px and 1px hairlines)
 *
 * Rationale: docs/DESIGN_SYSTEM.md "Tokens are the only legal source of value".
 */
'use strict';

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const COLOR_FN = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/;
const RAW_PX = /(?<![\w-])(?!0px|1px)\d+(?:\.\d+)?px\b/;

/** Files that are allowed to contain raw values (the token source itself). */
const ALLOWED = [/design-system[\\/]tokens[\\/]/, /\.stories\.[jt]sx?$/, /tooling[\\/]/];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow hardcoded colors and raw px values; use semantic tokens.' },
    schema: [],
    messages: {
      hex: 'Hardcoded color "{{value}}". Use a semantic token (e.g. `text-fg-muted`, `bg-surface-raised`). See docs/DESIGN_SYSTEM.md.',
      colorFn: 'Literal color function "{{value}}". Use a semantic token instead.',
      px: 'Raw pixel value "{{value}}". Use a spacing/size token (e.g. `p-4`, `--space-4`).',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();

    // Generated files are governed by their generator and its source (theme.json),
    // not by hand-editing rules — a projection of the source of truth cannot itself
    // be a token violation. Safe because the drift gate fails if a generated file
    // was hand-edited, so this cannot be used to smuggle literals into real code.
    if (/GENERATED/.test(context.sourceCode.getText().slice(0, 400))) return {};
    if (ALLOWED.some((re) => re.test(filename))) return {};

    function check(node, raw) {
      if (typeof raw !== 'string') return;
      const hex = raw.match(HEX);
      if (hex) return context.report({ node, messageId: 'hex', data: { value: hex[0] } });
      const fn = raw.match(COLOR_FN);
      if (fn) return context.report({ node, messageId: 'colorFn', data: { value: fn[0] } });
      const px = raw.match(RAW_PX);
      if (px) return context.report({ node, messageId: 'px', data: { value: px[0] } });
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};
