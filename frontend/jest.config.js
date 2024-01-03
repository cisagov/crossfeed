module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/.build/'],
  globalSetup: '<rootDir>/test/setup.ts',
  clearMocks: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '.*report.*' // Remove this when we enable report / vulnerability functionality
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios')
  },
  coverageThreshold: {
    global: {
      branches: 50
    }
  }
};