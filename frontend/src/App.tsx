import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Amplify from 'aws-amplify';
import { AuthContextProvider } from 'context';
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
  TermsOfUse
} from 'pages';
import { AuthRoute, AuthRedirectRoute, Layout } from 'components';
import './styles.scss';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

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

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#122D5D'
    }
  }
});

const App: React.FC = () => (
  <Router>
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <Layout>
          <Switch>
            <AuthRoute
              exact
              path="/"
              authComponent={Dashboard}
              unauthComponent={AuthLogin}
            />

            <Route exact path="/create-account" component={AuthCreateAccount} />

            <Route exact path="/terms" component={TermsOfUse} />

            <AuthRedirectRoute path="/domain/:domainId" component={Domain} />
            <AuthRedirectRoute
              path="/vulnerabilities"
              component={Vulnerabilities}
            />
            <AuthRedirectRoute path="/risk" component={Risk} />
            <AuthRedirectRoute path="/alerts" component={Alerts} />
            <AuthRedirectRoute path="/scans" component={Scans} />
            <AuthRedirectRoute
              path="/organizations"
              component={Organizations}
            />
            <AuthRedirectRoute path="/organization" component={Organization} />
            <AuthRedirectRoute path="/users" component={Users} />
            <AuthRedirectRoute path="/logs" component={Logs} />
            <AuthRedirectRoute path="/settings" component={Settings} />
          </Switch>
        </Layout>
      </AuthContextProvider>
    </ThemeProvider>
  </Router>
);

export default App;
