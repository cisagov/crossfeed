// Main entrypoint for dev server.

import app from './api/app';

process.env.IS_OFFLINE = 'true';

const port = 3000;
app.listen(port, () => {
  console.log('App listening on port ' + port);
});
