import React from 'react';
import { RouteProps, Route, useHistory } from 'react-router-dom';
import { useAuthContext } from 'context';

interface AuthRedirectRouteProps extends RouteProps {
  unauth?: string | React.ComponentType;
  permissions?: Array<String>;
  component: React.ComponentType;
}

/*
possible states:

- user is authenticated
- user has authenticated but needs to create account
- user has authenticated but needs to sign terms
- user is not authenticated
- user is not authenticated, this is oauth callback (should not be protected)
- user is authenticated, but does not have tha correct permissions for route
*/

export const RouteGuard: React.FC<AuthRedirectRouteProps> = ({
  unauth = '/',
  permissions = [],
  component,
  ...rest
}) => {
  const { token, user, userMustSign, logout } = useAuthContext();
  const history = useHistory();

  if (token && !user) {
    // waiting on user profile
    console.log('Token Route Check');
    return null;
  }

  if (user && !user.isRegistered) {
    // user has authenticated but needs to create an account
    console.log('User Registered Check');
    history.push('/create-account');
    return null;
  }

  if (user && userMustSign) {
    // user has authenticated but needs to sign terms
    console.log('User must sign check');
    history.push('/terms');
    return null;
  }

  if (typeof unauth === 'string' && !user) {
    history.push(unauth);
    return null;
  }

  if (user && permissions && permissions.length > 0) {
    // user is not globalAdmin and invalid userType permissions
    if (
      user.userType !== 'globalAdmin' &&
      !permissions.includes(user.userType)
    ) {
      console.log('User access denied. Logging out!');
      logout();
      history.push('/');
      return null;
    }
  }

  return (
    <Route
      {...rest}
      component={user ? component : (unauth as React.ComponentType)}
    />
  );
};
