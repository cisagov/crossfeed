import React from 'react';
import classes from './Settings.module.css';
import { useAuthContext } from 'context';

const Settings: React.FC = () => {
  const { user } = useAuthContext();
  return (
    <div className={classes.root}>
      <h1>Account Settings</h1>
      <h2>Name: {user && user.fullName}</h2>
      <h2>Email: {user && user.email}</h2>
      <h2>
        Member of:{' '}
        {user &&
          (user.roles || [])
            .filter((role) => role.approved)
            .map((role) => role.organization.name)
            .join(', ')}
      </h2>
    </div>
  );
};

export default Settings;
