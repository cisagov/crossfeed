import React from 'react';
import { RouteProps, Redirect, Route } from 'react-router-dom';
import { useAuthContext } from 'context';

interface AuthRedirectRouteProps extends RouteProps {
  redirectUrl?: string;
  component: React.ComponentType;
}

export const AuthRedirectRoute: React.FC<AuthRedirectRouteProps> = ({
  redirectUrl = '/',
  component,
  ...rest
}) => {
  const { user } = useAuthContext();

  if (user === undefined) {
    return null;
  }

  const RedirectComponent = () => (
    <Redirect to={{ pathname: redirectUrl, state: { authRequired: true } }} />
  );
  return (
    <Route
      {...rest}
      component={user && user.isRegistered ? component : RedirectComponent}
    />
  );
};

interface AuthRouteProps extends RouteProps {
  authComponent: React.ComponentType;
  unauthComponent: React.ComponentType;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({
  authComponent,
  unauthComponent,
  ...rest
}) => {
  const { user } = useAuthContext();

  if (user === undefined) {
    return null;
  }

  return <Route {...rest} component={user ? authComponent : unauthComponent} />;
};
