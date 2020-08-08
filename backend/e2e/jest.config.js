require('dotenv').config({ path: '../.env' });
const ts_preset = require('ts-jest/jest-preset');
const puppeteer_preset = require('jest-puppeteer/jest-preset');

process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'crossfeed_test';
process.env.BACKEND_URL = '';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'crossfeed_test';
process.env.IS_LOCAL = 'true';
process.env.CENSYS_API_ID = 'CENSYS_API_ID';
process.env.CENSYS_API_SECRET = 'CENSYS_API_SECRET';

const config = Object.assign(ts_preset, puppeteer_preset);

module.exports = {
  ...config,
  testPathIgnorePatterns: ['/test/', '/node_modules/'],
  testTimeout: 300000
};
