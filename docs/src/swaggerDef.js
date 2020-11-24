/**
 * Configuration for REST API Swagger generation.
 * This file is consumed by "npm run codegen".
 */
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Crossfeed REST API',
    version: '0.0.1',
  },
  apis: ['../backend/src/api/**.ts'],
  host: 'https://api.crossfeed.cyber.dhs.gov/',
};
