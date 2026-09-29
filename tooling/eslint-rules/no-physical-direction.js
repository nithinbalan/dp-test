/**
 * Bans physical direction properties in favour of CSS logical properties.
 *
 * RTL is the one class of bug that is invisible to everyone who cannot read the
 * language. `ml-4` looks perfectly correct in English review, ships, and puts the
 * margin on the wrong side of every Arabic screen. Nobody notices until a customer
 * does — which is exactly the shape of failure this repo enforces away rather than
 * reviews for.
 *
 * Logical properties (`ms-4`, `text-start`, `border-s`) resolve against the `dir`
 * attribute at runtime, so one class is correct in both directions and there is no
 * runtime branch to forget.
 *
 * `rtl:` / `ltr:`-prefixed utilities are allowed: those are deliberate,
 * direction-aware overrides, e.g. `rtl:-scale-x-100` to mirror a chevron.
 */
'use strict';

/** Tailwind utility -> logical replacement. */
const CLASS_MAP = [
  [/^-?ml-/, 'ms-'],
  [/^-?mr-/, 'me-'],
  [/^-?pl-/, 'ps-'],
  [/^-?pr-/, 'pe-'],
  [/^-?left-/, 'start-'],
  [/^-?right-/, 'end-'],
  [/^-?scroll-ml-/, 'scroll-ms-'],
  [/^-?scroll-mr-/, 'scroll-me-'],
  [/^-?scroll-pl-/, 'scroll-ps-'],
  [/^-?scroll-pr-/, 'scroll-pe-'],
  [/^text-left$/, 'text-start'],
  [/^text-right$/, 'text-end'],
  [/^float-left$/, 'float-start'],
  [/^float-right$/, 'float-end'],
  [/^clear-left$/, 'clear-start'],
  [/^clear-right$/, 'clear-end'],
  // `$1` preserves the separator: rounded-tl-md -> rounded-ss-md, border-l -> border-s
  [/^border-l(-|$)/, 'border-s$1'],
  [/^border-r(-|$)/, 'border-e$1'],
  [/^rounded-l(-|$)/, 'rounded-s$1'],
  [/^rounded-r(-|$)/, 'rounded-e$1'],
  [/^rounded-tl(-|$)/, 'rounded-ss$1'],
  [/^rounded-tr(-|$)/, 'rounded-se$1'],
  [/^rounded-bl(-|$)/, 'rounded-es$1'],
  [/^rounded-br(-|$)/, 'rounded-ee$1'],
];

/** Inline style / CSS-in-JS property -> logical replacement. */
const STYLE_MAP = {
  marginLeft: 'marginInlineStart',
  marginRight: 'marginInlineEnd',
  paddingLeft: 'paddingInlineStart',
  paddingRight: 'paddingInlineEnd',
  borderLeft: 'borderInlineStart',
  borderRight: 'borderInlineEnd',
  borderLeftWidth: 'borderInlineStartWidth',
  borderRightWidth: 'borderInlineEndWidth',
  borderLeftColor: 'borderInlineStartColor',
  borderRightColor: 'borderInlineEndColor',
  borderTopLeftRadius: 'borderStartStartRadius',
  borderTopRightRadius: 'borderStartEndRadius',
  borderBottomLeftRadius: 'borderEndStartRadius',
  borderBottomRightRadius: 'borderEndEndRadius',
  left: 'insetInlineStart',
  right: 'insetInlineEnd',
};

const CLASS_FNS = new Set(['cn', 'clsx', 'classNames', 'cva', 'tv', 'twMerge']);

/** Strip Tailwind variants (`hover:`, `md:`, `rtl:`) and report whether direction-aware. */
function splitVariants(token) {
  const parts = token.split(':');
  const base = parts.pop();
  return { base, variants: parts };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow physical direction properties; use CSS logical properties so layouts work in RTL.',
    },
    schema: [],
    messages: {
      utility:
        'Physical direction utility "{{found}}" breaks RTL — it puts the {{side}} on the wrong side in Arabic. Use "{{suggest}}". See docs/INTERNATIONALIZATION.md.',
      style:
        'Physical CSS property "{{found}}" breaks RTL. Use "{{suggest}}". See docs/INTERNATIONALIZATION.md.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (/tooling[\\/]/.test(filename)) return {};
    if (/GENERATED/.test(context.sourceCode.getText().slice(0, 400))) return {};

    /** Both the JSX-style handler and the generic Property visitor can see the same
     *  node; report each one once. */
    const reported = new Set();
    const reportStyle = (node, key) => {
      const id = `${node.range[0]}:${node.range[1]}`;
      if (reported.has(id)) return;
      reported.add(id);
      context.report({ node, messageId: 'style', data: { found: key, suggest: STYLE_MAP[key] } });
    };

    function checkClassString(node, raw) {
      if (typeof raw !== 'string') return;
      for (const token of raw.split(/\s+/)) {
        if (!token) continue;
        const { base, variants } = splitVariants(token);
        // An explicit rtl:/ltr: variant is a deliberate direction-aware override.
        if (variants.includes('rtl') || variants.includes('ltr')) continue;
        for (const [pattern, suggest] of CLASS_MAP) {
          if (pattern.test(base)) {
            const replacement = base.replace(pattern, suggest);
            // Side comes from the replacement, not from letters in the original —
            // `/l/` matches the "l" in "float", which mislabelled float-right.
            const isStart =
              /^(ms-|ps-|start-|scroll-ms-|scroll-ps-|text-start|float-start|clear-start|border-s|rounded-s)/.test(
                replacement,
              );
            context.report({
              node,
              messageId: 'utility',
              data: {
                found: token,
                suggest: replacement,
                side: isStart ? 'inline-start edge' : 'inline-end edge',
              },
            });
            break;
          }
        }
      }
    }

    function walkStrings(node) {
      if (!node) return;
      if (node.type === 'Literal' && typeof node.value === 'string')
        checkClassString(node, node.value);
      else if (node.type === 'TemplateLiteral')
        node.quasis.forEach((q) => checkClassString(q, q.value.raw));
      else if (node.type === 'ConditionalExpression') {
        walkStrings(node.consequent);
        walkStrings(node.alternate);
      } else if (node.type === 'LogicalExpression') {
        walkStrings(node.left);
        walkStrings(node.right);
      } else if (node.type === 'ArrayExpression') node.elements.forEach(walkStrings);
      else if (node.type === 'ObjectExpression') {
        node.properties.forEach((p) => {
          if (p.type !== 'Property') return;
          if (p.key.type === 'Literal') checkClassString(p.key, p.key.value);
          walkStrings(p.value);
        });
      } else if (node.type === 'BinaryExpression') {
        walkStrings(node.left);
        walkStrings(node.right);
      }
    }

    return {
      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (name === 'className' || name === 'class') {
          if (!node.value) return;
          if (node.value.type === 'JSXExpressionContainer') walkStrings(node.value.expression);
          else walkStrings(node.value);
          return;
        }
        // style={{ marginLeft: 8 }}
        if (name === 'style' && node.value?.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;
          if (expr.type !== 'ObjectExpression') return;
          for (const prop of expr.properties) {
            if (prop.type !== 'Property') continue;
            const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
            if (STYLE_MAP[key]) reportStyle(prop, key);
          }
        }
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
      Property(node) {
        // Style objects outside JSX, e.g. a `const styles = { marginLeft: 8 }`.
        const key = node.key.type === 'Identifier' ? node.key.name : node.key.value;
        if (!STYLE_MAP[key]) return;
        const v = node.value;
        const looksLikeStyle =
          (v.type === 'Literal' &&
            (typeof v.value === 'number' || /rem|px|%|em$/.test(String(v.value)))) ||
          v.type === 'TemplateLiteral';
        if (looksLikeStyle) reportStyle(node, key);
      },
    };
  },
};
