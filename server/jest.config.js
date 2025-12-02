module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'models/**/*.js',
    '!models/**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
  ],
  // Ensure coverage is collected from required files
  coverageProvider: 'v8',
};
