import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as cookie from 'cookie';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { handler as healthcheck } from './healthcheck';
import * as auth from './auth';
import * as domains from './domains';
import * as search from './search';
import * as vulnerabilities from './vulnerabilities';
import * as organizations from './organizations';
import * as scans from './scans';
import * as users from './users';
import * as scanTasks from './scan-tasks';
import * as stats from './stats';
import * as apiKeys from './api-keys';
import * as reports from './reports';
import * as savedSearches from './saved-searches';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { UserType } from '../models';

if (
  (process.env.IS_OFFLINE || process.env.IS_LOCAL) &&
  typeof jest === 'undefined'
) {
  // Run scheduler during local development. When deployed on AWS,
  // the scheduler runs on a separate lambda function.
  const { handler: scheduler } = require('../tasks/scheduler');
  const { listenForDockerEvents } = require('./docker-events');
  listenForDockerEvents();
  setInterval(() => scheduler({}, {} as any, () => null), 30000);
}

const handlerToExpress = (handler) => async (req, res, next) => {
  const { statusCode, body } = await handler(
    {
      pathParameters: req.params,
      query: req.query,
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
    res.setHeader('content-type', 'text/plain');
    res.status(statusCode).send(body);
  }
};

const app = express();

app.use(cors());
app.use(express.json({ strict: false }));
app.use(helmet.hsts({ maxAge: 31536000, preload: true }));
app.use(cookieParser());

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
  const approvedEmailAddresses = ['@cisa.dhs.gov', '@associates.cisa.dhs.gov'];
  if (process.env.NODE_ENV === 'test')
    approvedEmailAddresses.push('@crossfeed.cisa.gov');
  for (const email of approvedEmailAddresses) {
    if (
      req.requestContext.authorizer.email &&
      req.requestContext.authorizer.email.endsWith(email)
    )
      return next();
  }
  if (
    !req.requestContext.authorizer.dateAcceptedTerms ||
    (req.requestContext.authorizer.acceptedTermsVersion &&
      req.requestContext.authorizer.acceptedTermsVersion !==
        getToUVersion(req.requestContext.authorizer))
  ) {
    return res.status(403).send('User must accept terms of use');
  }
  return next();
};

const getMaximumRole = (user) => {
  if (user?.userType === UserType.GLOBAL_VIEW) return 'user';
  return user && user.roles && user.roles.find((role) => role.role === 'admin')
    ? 'admin'
    : 'user';
};

const getToUVersion = (user) => {
  return `v${process.env.REACT_APP_TERMS_VERSION}-${getMaximumRole(user)}`;
};

// Rewrite the URL for some Matomo admin dashboard URLs, due to a bug in
// how Matomo handles relative URLs when hosted on a subpath.
app.get('/plugins/Morpheus/images/logo.svg', (req, res) =>
  res.redirect('/matomo/plugins/Morpheus/images/logo.svg?matomo')
);
app.get('/index.php', (req, res) => res.redirect('/matomo/index.php'));

/**
 * @swagger
 *
 * /matomo:
 *  get:
 *    description: All paths under /matomo proxy to a Matomo instance, which is used to handle and process user analytics. A global admin user can access this page from the "My Account" page.
 *    tags:
 *    - Analytics
 */
const matomoProxy = createProxyMiddleware({
  target: process.env.MATOMO_URL,
  headers: { HTTP_X_FORWARDED_URI: '/matomo' },
  pathRewrite: function (path, req) {
    return path.replace(/^\/matomo/, '');
  },
  onProxyReq: function (proxyReq, req, res) {
    // Only pass the MATOMO_SESSID cookie to Matomo.
    if (!proxyReq.getHeader('Cookie')) return;
    const cookies = cookie.parse(proxyReq.getHeader('Cookie'));
    const newCookies = cookie.serialize(
      'MATOMO_SESSID',
      String(cookies['MATOMO_SESSID'])
    );
    proxyReq.setHeader('Cookie', newCookies);
  },
  onProxyRes: function (proxyRes, req, res) {
    // Remove transfer-encoding: chunked responses, because API Gateway doesn't
    // support chunked encoding.
    if (proxyRes.headers['transfer-encoding'] === 'chunked') {
      proxyRes.headers['transfer-encoding'] = '';
    }
  }
});

/**
 * @swagger
 *
 * /pe:
 *  get:
 *    description: All paths under /pe proxy to the P&E django application and API. Only a global admin can access.
 */
const peProxy = createProxyMiddleware({
  target: process.env.PE_API_URL,
  changeOrigin: true
});

app.use(
  '/matomo',
  async (req, res, next) => {
    // Public paths -- see https://matomo.org/docs/security-how-to/
    const ALLOWED_PATHS = ['/matomo.php', '/matomo.js'];
    if (ALLOWED_PATHS.indexOf(req.path) > -1) {
      return next();
    }
    // API Gateway isn't able to proxy fonts properly -- so we're using a CDN instead.
    if (req.path === '/plugins/Morpheus/fonts/matomo.woff2') {
      return res.redirect(
        'https://cdn.jsdelivr.net/gh/matomo-org/matomo@3.14.1/plugins/Morpheus/fonts/matomo.woff2'
      );
    }
    if (req.path === '/plugins/Morpheus/fonts/matomo.woff') {
      return res.redirect(
        'https://cdn.jsdelivr.net/gh/matomo-org/matomo@3.14.1/plugins/Morpheus/fonts/matomo.woff'
      );
    }
    if (req.path === '/plugins/Morpheus/fonts/matomo.ttf') {
      return res.redirect(
        'https://cdn.jsdelivr.net/gh/matomo-org/matomo@3.14.1/plugins/Morpheus/fonts/matomo.ttf'
      );
    }
    // Only allow global admins to access all other paths.
    const user = (await auth.authorize({
      authorizationToken: req.cookies['crossfeed-token']
    })) as auth.UserToken;
    if (user.userType !== UserType.GLOBAL_ADMIN) {
      return res.status(401).send('Unauthorized');
    }
    return next();
  },
  matomoProxy
);

app.use(
  '/pe',
  async (req, res, next) => {
    // Only allow specific users to access
    const user = (await auth.authorize({
      authorizationToken: req.headers.authorization
    })) as auth.UserToken;
    if (
      user.userType !== UserType.GLOBAL_VIEW &&
      user.userType !== UserType.GLOBAL_ADMIN
    ) {
      return res.status(401).send('Unauthorized');
    }
    return next();
  },
  peProxy
);

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

authenticatedRoute.post('/api-keys', handlerToExpress(apiKeys.generate));
authenticatedRoute.delete('/api-keys/:keyId', handlerToExpress(apiKeys.del));

authenticatedRoute.post('/search', handlerToExpress(search.search));
authenticatedRoute.post('/search/export', handlerToExpress(search.export_));
authenticatedRoute.post('/domain/search', handlerToExpress(domains.list));
authenticatedRoute.post('/domain/export', handlerToExpress(domains.export_));
authenticatedRoute.get('/domain/:domainId', handlerToExpress(domains.get));
authenticatedRoute.post(
  '/vulnerabilities/search',
  handlerToExpress(vulnerabilities.list)
);
authenticatedRoute.post(
  '/vulnerabilities/export',
  handlerToExpress(vulnerabilities.export_)
);
authenticatedRoute.get(
  '/vulnerabilities/:vulnerabilityId',
  handlerToExpress(vulnerabilities.get)
);
authenticatedRoute.put(
  '/vulnerabilities/:vulnerabilityId',
  handlerToExpress(vulnerabilities.update)
);
authenticatedRoute.get('/saved-searches', handlerToExpress(savedSearches.list));
authenticatedRoute.post(
  '/saved-searches',
  handlerToExpress(savedSearches.create)
);
authenticatedRoute.get(
  '/saved-searches/:searchId',
  handlerToExpress(savedSearches.get)
);
authenticatedRoute.put(
  '/saved-searches/:searchId',
  handlerToExpress(savedSearches.update)
);
authenticatedRoute.delete(
  '/saved-searches/:searchId',
  handlerToExpress(savedSearches.del)
);
authenticatedRoute.get('/scans', handlerToExpress(scans.list));
authenticatedRoute.get('/granularScans', handlerToExpress(scans.listGranular));
authenticatedRoute.post('/scans', handlerToExpress(scans.create));
authenticatedRoute.get('/scans/:scanId', handlerToExpress(scans.get));
authenticatedRoute.put('/scans/:scanId', handlerToExpress(scans.update));
authenticatedRoute.delete('/scans/:scanId', handlerToExpress(scans.del));
authenticatedRoute.post('/scans/:scanId/run', handlerToExpress(scans.runScan));
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
  '/organizations/tags',
  handlerToExpress(organizations.getTags)
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

authenticatedRoute.post(
  '/reports/export',
  handlerToExpress(reports.export_report)
);

authenticatedRoute.post(
  '/reports/list',
  handlerToExpress(reports.list_reports)
);

app.use(authenticatedRoute);

export default app;
