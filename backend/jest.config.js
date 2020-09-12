require('dotenv').config({ path: '../.env' });
process.env.BACKEND_URL = '';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'crossfeed_test';
process.env.IS_LOCAL = 'true';
process.env.CENSYS_API_ID = 'CENSYS_API_ID';
process.env.CENSYS_API_SECRET = 'CENSYS_API_SECRET';
process.env.FARGATE_LOG_GROUP_NAME = 'FARGATE_LOG_GROUP_NAME';
process.env.FARGATE_MAX_CONCURRENCY = 100;
process.env.USE_COGNITO = '';

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
  coverageThreshold: {
    global: {
      branches: 50
    }
  }
};
