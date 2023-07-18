// Main entrypoint for serverless frontend code.

import serverless from 'serverless-http';
import helmet from 'helmet';
import express from 'express';

const app = express();
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000, includeSubDomains: true, preload: true
  }
}
));

module.exports.handler = serverless(app, {
  binary: ['image/*', 'font/*']
});
