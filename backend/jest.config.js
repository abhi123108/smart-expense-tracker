module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000, // integration tests spin up an in-memory MongoDB, which needs a bit more time
  verbose: true,
  // Runs unit tests (no DB) separately from integration tests if needed:
  // npx jest tests/unit        -> fast, no network required
  // npx jest tests/integration -> needs internet on first run (downloads an in-memory MongoDB binary)
};
