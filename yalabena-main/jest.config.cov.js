// Temporary config for scoped coverage runs (auth/finance/chat).
// Usage: npx jest --config jest.config.cov.js --coverage
const base = require('./package.json').jest;
module.exports = {
  ...base,
  collectCoverageFrom: [
    'modules/auth/**/*.ts',
    'modules/finance/**/*.ts',
    'modules/chat/**/*.ts',
    '!**/*.spec.ts',
    '!**/dto/**',
  ],
};
