import React from 'react';
import classes from './Settings.module.css';
import { useAuthContext } from 'context';
import { Button } from '@trussworks/react-uswds';

const Settings: React.FC = () => {
  const { logout, user } = useAuthContext();

  console.log(user);
  return (
    <div className={classes.root}>
      <h1>My Account</h1>
      <h2>Name: {user && user.fullName}</h2>
      <h2>Email: {user && user.email}</h2>
      <h2>
        Member of:{' '}
        {user &&
          (user.roles || [])
            .filter(role => role.approved)
            .map(role => role.organization.name)
            .join(', ')}
      </h2>
      <Button type="button" onClick={logout}>
        Logout
      </Button>
    </div>
  );
};

export default Settings;
