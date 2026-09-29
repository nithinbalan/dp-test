/**
 * ERROR HANDLING CONTRACT — mechanical half of docs/ERROR_HANDLING.md.
 * The pattern is fixed. This rule stops per-feature improvisation.
 *
 *   1. `throw new Error(...)` is banned in src/** — throw an `AppError` with a
 *      code from the taxonomy so it is classifiable, loggable and mappable to
 *      an HTTP status without a guess at the boundary.
 *   2. Empty catch blocks are banned — silent swallowing is never the fix.
 *   3. `catch (e) { console.log/error(e) }` as the ONLY statement is banned —
 *      logging is not handling. Rethrow as AppError or return a typed failure.
 */
'use strict';

const SRC = /src[\\/]/;

/**
 * Files that DEFINE the error primitives, and so cannot use them.
 * Same principle as the token rule exempting design-system/tokens.
 *  - result.ts   : unwrap()'s throw IS the documented escape hatch (ERROR_HANDLING §3)
 *  - env.ts      : a Fatal config failure, deliberately not an AppError — nothing
 *                  downstream can handle it and AppError implies it is catchable (§1)
 */
const PRIMITIVE_MODULES = [
  /src[\\/]shared[\\/]lib[\\/]result\.ts$/,
  /src[\\/]shared[\\/]config[\\/]env\.ts$/,
  /src[\\/]server[\\/]errors[\\/]/,
];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce the fixed AppError-based error handling pattern.' },
    schema: [],
    messages: {
      rawThrow:
        'Throw `new AppError({ code, message, cause })`, not a bare Error. Codes live in @server/errors/codes. See docs/ERROR_HANDLING.md §2.',
      emptyCatch:
        'Empty catch block. Swallowing an error is never a fix — handle it, or rethrow via `toAppError(e)`. See docs/ERROR_FIXING_PROTOCOL.md.',
      logOnlyCatch:
        'Logging is not handling. This catch must recover, rethrow an AppError, or return a typed failure. See docs/ERROR_HANDLING.md §4.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!SRC.test(filename)) return {};
    if (PRIMITIVE_MODULES.some((re) => re.test(filename))) return {};

    return {
      ThrowStatement(node) {
        const arg = node.argument;
        if (
          arg &&
          arg.type === 'NewExpression' &&
          arg.callee.type === 'Identifier' &&
          /^(Error|TypeError|RangeError)$/.test(arg.callee.name)
        ) {
          context.report({ node, messageId: 'rawThrow' });
        }
      },
      CatchClause(node) {
        const body = node.body.body;
        if (body.length === 0) {
          context.report({ node, messageId: 'emptyCatch' });
          return;
        }
        if (body.length === 1) {
          const only = body[0];
          const isConsole =
            only.type === 'ExpressionStatement' &&
            only.expression.type === 'CallExpression' &&
            only.expression.callee.type === 'MemberExpression' &&
            only.expression.callee.object.type === 'Identifier' &&
            only.expression.callee.object.name === 'console';
          if (isConsole) context.report({ node, messageId: 'logOnlyCatch' });
        }
      },
    };
  },
};
