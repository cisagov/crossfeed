import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation
} from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import { AuthContextProvider, CFThemeProvider, SearchProvider } from 'context';
import {
  MatomoProvider,
  createInstance,
  useMatomo
} from '@jonkoops/matomo-tracker-react';
import {
  Domain,
  AuthLogin,
  AuthLoginCreate,
  AuthCreateAccount,
  Scans,
  Scan,
  Risk,
  Organizations,
  Organization,
  Users,
  Settings,
  Vulnerabilities,
  Vulnerability,
  TermsOfUse,
  SearchPage,
  LoginGovCallback,
  Feeds,
  Domains,
  Reports,
  RegionUsers
} from 'pages';
import { Layout, RouteGuard } from 'components';
import './styles.scss';
import { Authenticator } from '@aws-amplify/ui-react';

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
          <Authenticator.Provider>
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
                  <RouteGuard
                    exact
                    path="/signup"
                    render={() => <Redirect to="/inventory" />}
                    unauth={AuthLoginCreate}
                    component={Risk}
                  />
                  <RouteGuard
                    exact
                    path="/registration"
                    render={() => <Redirect to="/inventory" />}
                    unauth={AuthLoginCreate}
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

                  <RouteGuard
                    exact
                    path="/inventory"
                    component={SearchPage}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/inventory/domain/:domainId"
                    component={Domain}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard path="/inventory/domains" component={Domains} />
                  <RouteGuard
                    path="/inventory/vulnerabilities"
                    exact
                    component={Vulnerabilities}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/inventory/vulnerabilities/grouped"
                    component={(props) => (
                      <Vulnerabilities {...props} groupBy="title" />
                    )}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/inventory/vulnerability/:vulnerabilityId"
                    component={Vulnerability}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/feeds"
                    component={Feeds}
                    permissions={['globalView']}
                  />
                  <RouteGuard
                    path="/reports"
                    component={Reports}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/scans"
                    exact
                    component={Scans}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/scans/history"
                    component={Scans}
                    exact
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/scans/:scanId"
                    component={Scan}
                    permissions={['standard', 'globalView']}
                  />
                  <RouteGuard
                    path="/organizations/:organizationId"
                    component={Organization}
                    permissions={['globalView']}
                  />
                  <RouteGuard
                    path="/organizations"
                    component={Organizations}
                    permissions={['standard', 'globalView', 'regionalAdmin']}
                  />
                  <RouteGuard
                    path="/users"
                    component={Users}
                    permissions={['globalView', 'regionalAdmin']}
                  />
                  <RouteGuard
                    path="/settings"
                    component={Settings}
                    permissions={['standard', 'globalView', 'regionalAdmin']}
                  />
                  <RouteGuard
                    path="/region-admin-dashboard"
                    component={RegionUsers}
                    permissions={['regionalAdmin']}
                  />
                </Switch>
              </Layout>
            </SearchProvider>
          </Authenticator.Provider>
        </AuthContextProvider>
      </CFThemeProvider>
    </Router>
  </MatomoProvider>
);

export default App;
