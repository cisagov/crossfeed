import React from 'react';
import classes from './Settings.module.css';
import { useAuthContext } from 'context';

const Settings: React.FC = () => {
  const { logout, user } = useAuthContext();

  return (
    <div className={classes.root}>
      <h1>Logged in as: {user && user.fullName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Settings;
