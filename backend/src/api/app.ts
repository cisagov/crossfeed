import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { handler as healthcheck } from './routes/healthcheck';
import * as auth from './routes/auth';
import { login } from './routes/auth';
import * as domains from './routes/domains';
import * as reports from './routes/reports';
import * as organizations from './routes/organizations';
import * as scans from './routes/scans';
import * as users from './routes/users';

const handlerToExpress = handler => async (req, res, next) => {
  const { statusCode, body } = await handler({
    pathParameters: req.params,
    requestContext: req.requestContext,
    body: JSON.stringify(req.body || "{}"),
    headers: req.headers
  }, {});
  res.status(statusCode);
  if (body) {
    res.send(body);
  }
}

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", handlerToExpress(healthcheck));
app.post("/auth/login", handlerToExpress(auth.login));
app.post("/auth/callback", handlerToExpress(auth.callback));

const authenticatedRoute = express.Router();
authenticatedRoute.use(async (req, res, next) => {
  req.requestContext = {
    authorizer: await auth.authorize({ authorizationToken: req.headers.authorization })
  };
  if (!req.requestContext.authorizer.id || req.requestContext.authorizer.id === "cisa:crossfeed:anonymous") {
    return res.status(403).send("Not logged in");
  }
  return next();
})

authenticatedRoute.get("/domain/search", handlerToExpress(domains.list));
authenticatedRoute.get("/domain/:domainId", handlerToExpress(domains.get));
authenticatedRoute.get("/report/search", handlerToExpress(reports.list));
authenticatedRoute.get("/report/:reportId", handlerToExpress(reports.get));
authenticatedRoute.post("/scans/:scanId", handlerToExpress(scans.create));
authenticatedRoute.put("/scans/:scanId", handlerToExpress(scans.update));
authenticatedRoute.delete("/scans/:scanId", handlerToExpress(scans.del));
authenticatedRoute.get("/organizations", handlerToExpress(organizations.list));
authenticatedRoute.get("/organizations/public", handlerToExpress(organizations.listPublicNames));
authenticatedRoute.get("/organizations/:organizationId", handlerToExpress(organizations.get));
authenticatedRoute.post("/organizations/:organizationId", handlerToExpress(organizations.create));
authenticatedRoute.put("/organizations/:organizationId", handlerToExpress(organizations.update));
authenticatedRoute.delete("/organizations/:organizationId", handlerToExpress(organizations.del));
authenticatedRoute.post("/organizations/:organizationId/roles/:roleId/approve", handlerToExpress(organizations.approveRole));
authenticatedRoute.post("/organizations/:organizationId/roles/:roleId/remove", handlerToExpress(organizations.removeRole));
authenticatedRoute.get("/users", handlerToExpress(users.list));
authenticatedRoute.get("/users/me", handlerToExpress(users.me));
authenticatedRoute.post("/users/invite", handlerToExpress(users.invite));
authenticatedRoute.put("/users/:userId", handlerToExpress(users.update));
authenticatedRoute.put("/users/:userId", handlerToExpress(users.del));

app.use(authenticatedRoute);

export default app;
