import serverless from 'serverless-http';
import express from 'express';
import path from 'path';

export const app = express();

app.use(express.static(path.join(__dirname, '../docs/build')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../docs/build/index.html'));
});

export const handler = serverless(app, {
  binary: ['image/*', 'font/*']
});
