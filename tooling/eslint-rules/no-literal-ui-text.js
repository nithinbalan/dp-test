/**
 * Bans user-facing copy welded into component markup.
 *
 * RTL layout is only half of shipping Arabic. A component that renders the literal
 * text "Sign in" is untranslatable no matter how correct its logical properties are,
 * and the problem is invisible in review because the English build looks perfect.
 *
 * The line this rule draws:
 *   BANNED   copy in JSX text children, and inline literals in user-facing
 *            attributes (aria-label, title, placeholder, alt). That is copy welded
 *            into markup — no caller can replace it.
 *   ALLOWED  a named defaults object (`const DEFAULT_MESSAGES = { ... }`) whose
 *            values reach JSX through props. English defaults are acceptable for
 *            accessibility strings: an unlabelled control is worse than an
 *            untranslated one. What matters is that the prop EXISTS so the app can
 *            localise it.
 *
 * Applies to src/components/** and src/app/**. Components receive copy as props;
 * pages resolve it from the message catalogue with `t()`. Neither may contain it.
 */
'use strict';

/** Attributes whose value is read by a human or a screen reader. */
const USER_FACING_ATTRS = new Set([
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'title',
  'placeholder',
  'alt',
]);

/** Text that carries no translatable meaning. */
function isInsignificant(text) {
  const t = text.trim();
  if (t.length === 0) return true;
  if (t.length === 1) return true; // glyphs, bullets, separators: ×, ·, ☀
  if (!/\p{L}/u.test(t)) return true; // no letters at all: "—", "()", "12:00"
  return false;
}

// Components AND pages. Pages compose copy — from the catalogue, not from literals.
// A page is exactly where "just this one string" gets typed.
const COMPONENTS = /src[\\/](components|app)[\\/]/;
const EXEMPT = /\.(stories|test)\.[jt]sx?$/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded user-facing copy in components so the UI can be translated.',
    },
    schema: [],
    messages: {
      text: 'Hardcoded copy "{{text}}" cannot be translated — this component is unusable in Arabic. Accept it as a prop (e.g. `label`, or a `messages` object). See docs/INTERNATIONALIZATION.md.',
      attr: 'Hardcoded "{{attr}}" cannot be translated, and screen-reader users get English regardless of locale. Accept it as a prop. See docs/INTERNATIONALIZATION.md.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!COMPONENTS.test(filename)) return {};
    if (EXEMPT.test(filename)) return {};

    return {
      JSXText(node) {
        if (isInsignificant(node.value)) return;
        const preview = node.value.trim().replace(/\s+/g, ' ').slice(0, 40);
        context.report({ node, messageId: 'text', data: { text: preview } });
      },
      JSXAttribute(node) {
        const name =
          node.name.type === 'JSXIdentifier'
            ? node.name.name
            : node.name.type === 'JSXNamespacedName'
              ? `${node.name.namespace.name}:${node.name.name.name}`
              : null;
        if (!name || !USER_FACING_ATTRS.has(name)) return;
        if (!node.value) return;

        // A literal value is welded in. An expression may come from a prop.
        if (node.value.type === 'Literal' && !isInsignificant(String(node.value.value))) {
          context.report({ node, messageId: 'attr', data: { attr: name } });
          return;
        }
        // A template literal with English text between the holes is equally welded.
        if (node.value.type === 'JSXExpressionContainer') {
          const expr = node.value.expression;
          if (expr.type === 'TemplateLiteral') {
            const hasCopy = expr.quasis.some((q) => !isInsignificant(q.value.raw));
            if (hasCopy) context.report({ node, messageId: 'attr', data: { attr: name } });
          }
        }
      },
    };
  },
};
