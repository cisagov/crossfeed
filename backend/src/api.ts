// Main entrypoint for serverless API code.

import * as serverless from 'serverless-http';
import app from './api/app';

module.exports.handler = serverless(app, {
  binary: ['image/*', 'font/*']
});
