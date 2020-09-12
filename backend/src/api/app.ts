import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { handler as healthcheck } from './healthcheck';
import { handler as scheduler } from '../tasks/scheduler';
import * as auth from './auth';
import * as domains from './domains';
import * as vulnerabilities from './vulnerabilities';
import * as organizations from './organizations';
import * as scans from './scans';
import * as users from './users';
import * as scanTasks from './scan-tasks';
import * as stats from './stats';
import { listenForDockerEvents } from './docker-events';

if (
  (process.env.IS_OFFLINE || process.env.IS_LOCAL) &&
  typeof jest === 'undefined'
) {
  listenForDockerEvents();

  setInterval(() => scheduler({}, {} as any, () => null), 30000);
}

const handlerToExpress = (handler) => async (req, res, next) => {
  const { statusCode, body } = await handler(
    {
      pathParameters: req.params,
      requestContext: req.requestContext,
      body: JSON.stringify(req.body || '{}'),
      headers: req.headers,
      path: req.originalUrl
    },
    {}
  );
  try {
    const parsedBody = JSON.parse(body);
    res.status(statusCode).json(parsedBody);
  } catch (e) {
    // Not a JSON body
    res.status(statusCode).send(body);
  }
};

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', handlerToExpress(healthcheck));
app.post('/auth/login', handlerToExpress(auth.login));
app.post('/auth/callback', handlerToExpress(auth.callback));

const checkUserLoggedIn = async (req, res, next) => {
  req.requestContext = {
    authorizer: await auth.authorize({
      authorizationToken: req.headers.authorization
    })
  };
  if (
    !req.requestContext.authorizer.id ||
    req.requestContext.authorizer.id === 'cisa:crossfeed:anonymous'
  ) {
    return res.status(401).send('Not logged in');
  }
  return next();
};

const checkUserSignedTerms = (req, res, next) => {
  // Bypass ToU for CISA emails
  const approvedEmailAddresses = ['@cisa.dhs.gov'];
  if (process.env.NODE_ENV === 'test')
    approvedEmailAddresses.push('@crossfeed.cisa.gov');
  for (const email of approvedEmailAddresses) {
    if (
      req.requestContext.authorizer.email &&
      req.requestContext.authorizer.email.endsWith(email)
    )
      return next();
  }
  if (!req.requestContext.authorizer.dateAcceptedTerms) {
    return res.status(403).send('User must accept terms of use');
  }
  return next();
};

// Routes that require an authenticated user, without
// needing to sign the terms of service yet
const authenticatedNoTermsRoute = express.Router();
authenticatedNoTermsRoute.use(checkUserLoggedIn);
authenticatedNoTermsRoute.get('/users/me', handlerToExpress(users.me));
authenticatedNoTermsRoute.post(
  '/users/me/acceptTerms',
  handlerToExpress(users.acceptTerms)
);
authenticatedNoTermsRoute.put('/users/:userId', handlerToExpress(users.update));

app.use(authenticatedNoTermsRoute);

// Routes that require an authenticated user that has
// signed the terms of service
const authenticatedRoute = express.Router();
authenticatedRoute.use(checkUserLoggedIn);
authenticatedRoute.use(checkUserSignedTerms);

authenticatedRoute.post('/domain/search', handlerToExpress(domains.list));
authenticatedRoute.get('/domain/:domainId', handlerToExpress(domains.get));
authenticatedRoute.post(
  '/vulnerabilities/search',
  handlerToExpress(vulnerabilities.list)
);
authenticatedRoute.get(
  '/vulnerabilities/:vulnerabilityId',
  handlerToExpress(vulnerabilities.get)
);
authenticatedRoute.get('/scans', handlerToExpress(scans.list));
authenticatedRoute.get('/granularScans', handlerToExpress(scans.listGranular));
authenticatedRoute.post('/scans', handlerToExpress(scans.create));
authenticatedRoute.put('/scans/:scanId', handlerToExpress(scans.update));
authenticatedRoute.delete('/scans/:scanId', handlerToExpress(scans.del));
authenticatedRoute.post(
  '/scheduler/invoke',
  handlerToExpress(scans.invokeScheduler)
);
authenticatedRoute.post('/scan-tasks/search', handlerToExpress(scanTasks.list));
authenticatedRoute.post(
  '/scan-tasks/:scanTaskId/kill',
  handlerToExpress(scanTasks.kill)
);
authenticatedRoute.get(
  '/scan-tasks/:scanTaskId/logs',
  handlerToExpress(scanTasks.logs)
);

authenticatedRoute.get('/organizations', handlerToExpress(organizations.list));
authenticatedRoute.get(
  '/organizations/public',
  handlerToExpress(organizations.listPublicNames)
);
authenticatedRoute.get(
  '/organizations/:organizationId',
  handlerToExpress(organizations.get)
);
authenticatedRoute.post(
  '/organizations',
  handlerToExpress(organizations.create)
);
authenticatedRoute.put(
  '/organizations/:organizationId',
  handlerToExpress(organizations.update)
);
authenticatedRoute.delete(
  '/organizations/:organizationId',
  handlerToExpress(organizations.del)
);
authenticatedRoute.post(
  '/organizations/:organizationId/roles/:roleId/approve',
  handlerToExpress(organizations.approveRole)
);
authenticatedRoute.post(
  '/organizations/:organizationId/roles/:roleId/remove',
  handlerToExpress(organizations.removeRole)
);
authenticatedRoute.post(
  '/organizations/:organizationId/granularScans/:scanId/update',
  handlerToExpress(organizations.updateScan)
);
authenticatedRoute.post('/stats', handlerToExpress(stats.get));
authenticatedRoute.get('/users', handlerToExpress(users.list));
authenticatedRoute.post('/users', handlerToExpress(users.invite));
authenticatedRoute.delete('/users/:userId', handlerToExpress(users.del));

app.use(authenticatedRoute);

export default app;
