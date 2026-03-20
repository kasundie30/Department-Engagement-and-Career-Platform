/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/integration/**/*.test.js'],
  testTimeout: 30000, // 30s for external service calls
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
