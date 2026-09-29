'use strict';

/**
 * Local ESLint plugin. Rules here encode the parts of this repo's conventions
 * that must be enforced mechanically rather than by review or by prose docs —
 * because reviewers get tired and generated code does not read docs.
 */
module.exports = {
  rules: {
    'no-hardcoded-design-values': require('./no-hardcoded-design-values.js'),
    'no-arbitrary-tailwind': require('./no-arbitrary-tailwind.js'),
    'no-physical-direction': require('./no-physical-direction.js'),
    'no-literal-ui-text': require('./no-literal-ui-text.js'),
    'tier-boundary': require('./tier-boundary.js'),
    'require-workspace-scope': require('./require-workspace-scope.js'),
    'error-handling-contract': require('./error-handling-contract.js'),
  },
};
