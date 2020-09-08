import React from 'react';
import { RouteProps, Route, useHistory } from 'react-router-dom';
import { useAuthContext } from 'context';

interface AuthRedirectRouteProps extends RouteProps {
  unauth?: string | React.ComponentType;
  component: React.ComponentType;
}

/*
possible states:

- user is authenticated
- user has authenticated but needs to create account
- user has authenticated but needs to sign terms
- user is not authenticated
- user is not authenticated, this is oauth callback (should not be protected)
*/

export const RouteGuard: React.FC<AuthRedirectRouteProps> = ({
  unauth = '/',
  component,
  ...rest
}) => {
  const { token, user, userMustSign } = useAuthContext();
  const history = useHistory();

  if (token && !user) {
    // waiting on user profile
    return null;
  }

  if (user && !user.isRegistered) {
    // user has authenticated but needs to create an account
    history.push('/create-account');
    return null;
  }

  if (user && userMustSign) {
    // user has authenticated but needs to sign terms
    history.push('/terms');
    return null;
  }

  if (typeof unauth === 'string' && !user) {
    history.push(unauth);
    return null;
  }

  return (
    <Route
      {...rest}
      component={user ? component : (unauth as React.ComponentType)}
    />
  );
};
