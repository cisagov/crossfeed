import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { handler as healthcheck } from './healthcheck';
import * as auth from './auth';
import * as domains from './domains';
import * as vulnerabilities from './vulnerabilities';
import * as organizations from './organizations';
import * as scans from './scans';
import * as users from './users';
import * as scanTasks from './scan-tasks';
import * as stats from './stats';
import * as Docker from 'dockerode';
import { handler as updateScanTaskStatus, EventBridgeEvent } from '../tasks/updateScanTaskStatus';

if (process.env.IS_OFFLINE || process.env.IS_LOCAL) {
  (async () => {
    const docker = new Docker();
    const stream = await docker.getEvents();
    /**
     * backend_1    | {
backend_1    |   status: 'start',
backend_1    |   id: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
backend_1    |   from: 'crossfeed-worker',
backend_1    |   Type: 'container',
backend_1    |   Action: 'start',
backend_1    |   Actor: {
backend_1    |     ID: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
backend_1    |     Attributes: {
backend_1    |       image: 'crossfeed-worker',
backend_1    |       name: 'crossfeed_worker_cisa_censys_2681225'
backend_1    |     }
backend_1    |   },
backend_1    |   scope: 'local',
backend_1    |   time: 1597458556,
backend_1    |   timeNano: 1597458556898095000
backend_1    | }
{
backend_1    |   status: 'die',
backend_1    |   id: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
backend_1    |   from: 'crossfeed-worker',
backend_1    |   Type: 'container',
backend_1    |   Action: 'die',
backend_1    |   Actor: {
backend_1    |     ID: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
backend_1    |     Attributes: {
backend_1    |       exitCode: '0',
backend_1    |       image: 'crossfeed-worker',
backend_1    |       name: 'crossfeed_worker_cisa_censys_2681225'
backend_1    |     }
backend_1    |   },
backend_1    |   scope: 'local',
backend_1    |   time: 1597458571,
backend_1    |   timeNano: 1597458571266194000
backend_1    | }
     */
    stream.on('data', async (chunk: any) => {
      const message = JSON.parse(Buffer.from(chunk).toString("utf-8"));
      if (message.from !== "crossfeed-worker") {
        return;
      }
      let payload: EventBridgeEvent;
      if (message.status === "start") {
        payload = {
          detail: {
            stopCode: "",
            stoppedReason: "",
            taskArn: message.Actor.Attributes.name,
            lastStatus: "RUNNING",
            containers: [{}]
          }
        };
      } else if (message.status === "die") {
        payload = {
          detail: {
            stopCode: "EssentialContainerExited",
            stoppedReason: "Essential container in task exited",
            taskArn: message.Actor.Attributes.name,
            lastStatus: "STOPPED",
            containers:
              [
                {
                  exitCode: Number(message.Actor.Attributes.exitCode),
                }
              ]
          }
        };
      } else {
        return;
      }
      await updateScanTaskStatus(payload, {} as any, () => null);
    });
  })();
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

const authenticatedRoute = express.Router();
authenticatedRoute.use(async (req, res, next) => {
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
});

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
authenticatedRoute.post('/scan-tasks/search', handlerToExpress(scanTasks.list));
authenticatedRoute.post(
  '/scan-tasks/:scanTaskId/kill',
  handlerToExpress(scanTasks.kill)
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
authenticatedRoute.get('/users/me', handlerToExpress(users.me));
authenticatedRoute.post('/users', handlerToExpress(users.invite));
authenticatedRoute.put('/users/:userId', handlerToExpress(users.update));
authenticatedRoute.delete('/users/:userId', handlerToExpress(users.del));

app.use(authenticatedRoute);

export default app;
