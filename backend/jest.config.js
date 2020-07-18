require('dotenv').config({ path: '../.env' });
process.env.BACKEND_URL = '';
process.env.DB_HOST = 'localhost';
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/.build/']
};
