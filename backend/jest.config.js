require('dotenv').config({ path: '../.env' });
process.env.BACKEND_URL = '';
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node'
};
