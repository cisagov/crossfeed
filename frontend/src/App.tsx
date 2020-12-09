import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useLocation,
  Redirect
} from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import { AuthContextProvider, CFThemeProvider, SearchProvider } from 'context';
import {
  MatomoProvider,
  createInstance,
  useMatomo
} from '@datapunt/matomo-tracker-react';
import {
  Domain,
  AuthLogin,
  AuthCreateAccount,
  Scans,
  Scan,
  Risk,
  Organizations,
  Organization,
  Users,
  Settings,
  Vulnerabilities,
  TermsOfUse,
  SearchPage,
  LoginGovCallback,
  Feeds,
  Dashboard
} from 'pages';
import { Layout, RouteGuard } from 'components';
import './styles.scss';

API.configure({
  endpoints: [
    {
      name: 'crossfeed',
      endpoint: process.env.REACT_APP_API_URL
    }
  ]
});

if (process.env.REACT_APP_USE_COGNITO) {
  Auth.configure({
    region: 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID
  });
}

const instance = createInstance({
  urlBase: `${process.env.REACT_APP_API_URL}/matomo`,
  siteId: 1,
  disabled: false,
  heartBeat: {
    // optional, enabled by default
    active: true, // optional, default value: true
    seconds: 15 // optional, default value: `15
  },
  linkTracking: false // optional, default value: true
  // configurations: { // optional, default value: {}
  //   // any valid matomo configuration, all below are optional
  //   disableCookies: true,
  //   setSecureCookie: true,
  //   setRequestMethod: 'POST'
  // }
});

const LinkTracker = () => {
  const location = useLocation();
  const { trackPageView } = useMatomo();

  useEffect(() => trackPageView({}), [location, trackPageView]);

  return null;
};

const App: React.FC = () => (
  <MatomoProvider value={instance}>
    <Router>
      <CFThemeProvider>
        <AuthContextProvider>
          <SearchProvider>
            <Layout>
              <LinkTracker />
              <Switch>
                <RouteGuard
                  exact
                  path="/"
                  render={() => <Redirect to="/inventory" />}
                  unauth={AuthLogin}
                  component={Risk}
                />

                <Route
                  exact
                  path="/login-gov-callback"
                  component={LoginGovCallback}
                />
                <Route
                  exact
                  path="/create-account"
                  component={AuthCreateAccount}
                />
                <Route exact path="/terms" component={TermsOfUse} />

                <RouteGuard exact path="/inventory" component={SearchPage} />
                <RouteGuard
                  path="/inventory/domain/:domainId"
                  component={Domain}
                />
                <RouteGuard path="/inventory/domains" component={Dashboard} />
                <RouteGuard
                  path="/inventory/vulnerabilities"
                  component={Vulnerabilities}
                />

                <RouteGuard path="/feeds" component={Feeds} />
                <RouteGuard path="/scans/:scanId" component={Scan} />
                <RouteGuard path="/scans" component={Scans} />
                <RouteGuard path="/organizations" component={Organizations} />
                <RouteGuard path="/organization" component={Organization} />
                <RouteGuard path="/users" component={Users} />
                <RouteGuard path="/settings" component={Settings} />
              </Switch>
            </Layout>
          </SearchProvider>
        </AuthContextProvider>
      </CFThemeProvider>
    </Router>
  </MatomoProvider>
);

export default App;
