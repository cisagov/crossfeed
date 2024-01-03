/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '.*report.*' // Remove this when we enable report / vulnerability functionality
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios')
  },
};