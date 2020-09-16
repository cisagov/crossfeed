import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Amplify from 'aws-amplify';
import { AuthContextProvider, CFThemeProvider } from 'context';
import {
  Alerts,
  Dashboard,
  Domain,
  AuthLogin,
  AuthCreateAccount,
  Scans,
  Logs,
  Risk,
  Organizations,
  Organization,
  Users,
  Settings,
  Vulnerabilities,
  TermsOfUse,
  LoginGovCallback
} from 'pages';
import { Layout, RouteGuard } from 'components';
import './styles.scss';

Amplify.configure({
  API: {
    endpoints: [
      {
        name: 'crossfeed',
        endpoint: process.env.REACT_APP_API_URL
      }
    ]
  },
  Auth: process.env.REACT_APP_USE_COGNITO
    ? {
        region: 'us-east-1',
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID
      }
    : undefined
});

const App: React.FC = () => (
  <Router>
    <CFThemeProvider>
      <AuthContextProvider>
        <Layout>
          <Switch>
            <RouteGuard
              exact
              path="/"
              component={Dashboard}
              unauth={AuthLogin}
            />

            <Route
              exact
              path="/login-gov-callback"
              component={LoginGovCallback}
            />
            <Route exact path="/create-account" component={AuthCreateAccount} />
            <Route exact path="/terms" component={TermsOfUse} />

            <RouteGuard path="/domain/:domainId" component={Domain} />
            <RouteGuard path="/vulnerabilities" component={Vulnerabilities} />
            <RouteGuard path="/risk" component={Risk} />
            <RouteGuard path="/alerts" component={Alerts} />
            <RouteGuard path="/scans" component={Scans} />
            <RouteGuard path="/organizations" component={Organizations} />
            <RouteGuard path="/organization" component={Organization} />
            <RouteGuard path="/users" component={Users} />
            <RouteGuard path="/logs" component={Logs} />
            <RouteGuard path="/settings" component={Settings} />
          </Switch>
        </Layout>
      </AuthContextProvider>
    </CFThemeProvider>
  </Router>
);

export default App;
