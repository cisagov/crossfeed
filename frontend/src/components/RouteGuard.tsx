import React from 'react';
import { RouteProps, Redirect, Route } from 'react-router-dom';
import { useAuthContext } from 'context';
import { userMustSign } from 'pages';

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
  const token = localStorage.getItem('token');
  const { user } = useAuthContext();

  if (token && !user) {
    // waiting on refreshing the user
    return null;
  }

  if (user && !user.isRegistered) {
    // user has authenticated but needs to create an account
    return <Redirect to={{ pathname: "/create-account" }} />
  }

  if (user && userMustSign(user)) {
    // user has authenticated but needs to sign terms
    return <Redirect to={{ pathname: "/terms" }} />
  }

  const RedirectComponent = typeof unauth === "string" ?
    () => <Redirect to={{ pathname: unauth }} /> : unauth;

  return (
    <Route
      {...rest}
      component={user ? component : RedirectComponent}
    />
  );
};
