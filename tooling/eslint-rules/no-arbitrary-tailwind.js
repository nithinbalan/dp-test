/**
 * Bans Tailwind arbitrary values (`text-[#3b82f6]`, `p-[13px]`, `w-[calc(...)]`)
 * inside className/class attributes and cn()/clsx()/cva() calls.
 *
 * Arbitrary values are the single largest source of visual drift in generated UI:
 * they type-check, they lint clean under stock configs, and they silently
 * fork the design system. If you genuinely need a new value, add a token.
 */
'use strict';

const ARBITRARY = /(?:^|\s)[a-z-]+(?:-[a-z0-9]+)*-\[[^\]]+\]/;
const CLASS_FNS = new Set(['cn', 'clsx', 'classNames', 'cva', 'tv', 'twMerge']);
const ALLOWED = [/\.stories\.[jt]sx?$/, /tooling[\\/]/];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow Tailwind arbitrary values; extend the token theme instead.' },
    schema: [],
    messages: {
      arbitrary:
        'Arbitrary Tailwind value "{{value}}". Add a semantic token to design-system/tokens instead of inlining. See docs/DESIGN_SYSTEM.md §Tokens.',
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

    function scan(node, raw) {
      if (typeof raw !== 'string') return;
      const m = raw.match(ARBITRARY);
      if (m) context.report({ node, messageId: 'arbitrary', data: { value: m[0].trim() } });
    }

    function walkStrings(node) {
      if (!node) return;
      if (node.type === 'Literal' && typeof node.value === 'string') scan(node, node.value);
      else if (node.type === 'TemplateLiteral') node.quasis.forEach((q) => scan(q, q.value.raw));
      else if (node.type === 'ConditionalExpression') {
        walkStrings(node.consequent);
        walkStrings(node.alternate);
      } else if (node.type === 'LogicalExpression') {
        walkStrings(node.left);
        walkStrings(node.right);
      } else if (node.type === 'ArrayExpression') node.elements.forEach(walkStrings);
      else if (node.type === 'ObjectExpression') {
        node.properties.forEach((p) => {
          if (p.type === 'Property') {
            if (p.key.type === 'Literal') scan(p.key, p.key.value);
            walkStrings(p.value);
          }
        });
      }
    }

    return {
      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (name !== 'className' && name !== 'class') return;
        if (!node.value) return;
        if (node.value.type === 'JSXExpressionContainer') walkStrings(node.value.expression);
        else walkStrings(node.value);
      },
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee.type === 'Identifier'
            ? callee.name
            : callee.type === 'MemberExpression' && callee.property.type === 'Identifier'
              ? callee.property.name
              : null;
        if (!name || !CLASS_FNS.has(name)) return;
        node.arguments.forEach(walkStrings);
      },
    };
  },
};
