import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Amplify from "aws-amplify";
import { AuthContextProvider } from "context";
import {
  Alerts,
  Dashboard,
  Domain,
  AuthLogin,
  AuthRegister,
  AuthRegisterConfirm,
  AuthPasswordReset,
  Scans,
  Logs,
  Risk,
  Organizations,
  Settings,
  Vulnerabilities,
  AuthCreatePassword,
} from "pages";
import { AuthRoute, AuthRedirectRoute, Layout } from "components";
import "./styles.scss";

Amplify.configure({
  Auth: {
    region: "us-west-2",
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: "crossfeed",
        endpoint: process.env.REACT_APP_API_URL,
      },
    ],
  },
});

const App: React.FC = () => (
  <Router>
    <AuthContextProvider>
      <Layout>
        <Switch>
          <AuthRoute
            exact
            path="/"
            authComponent={Dashboard}
            unauthComponent={AuthLogin}
          />

          <Route exact path="/register" component={AuthRegister} />
          <Route
            exact
            path="/register-confirm"
            component={AuthRegisterConfirm}
          />
          <Route exact path="/reset-password" component={AuthPasswordReset} />
          <Route exact path="/create-password" component={AuthCreatePassword} />

          <AuthRedirectRoute path="/domain/:domainId" component={Domain} />
          <AuthRedirectRoute
            path="/vulnerabilities"
            component={Vulnerabilities}
          />
          <AuthRedirectRoute path="/risk" component={Risk} />
          <AuthRedirectRoute path="/alerts" component={Alerts} />
          <AuthRedirectRoute path="/scans" component={Scans} />
          <AuthRedirectRoute path="/organizations" component={Organizations} />
          <AuthRedirectRoute path="/logs" component={Logs} />
          <AuthRedirectRoute path="/settings" component={Settings} />
        </Switch>
      </Layout>
    </AuthContextProvider>
  </Router>
);

export default App;
