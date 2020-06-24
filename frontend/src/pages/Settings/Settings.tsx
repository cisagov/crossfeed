import React from "react";
import classes from "./Settings.module.css";
import { useAuthContext } from "context";

const Settings: React.FC = () => {
  const { logout } = useAuthContext();

  return (
    <div className={classes.root}>
      <h1>This is an example page for settings</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Settings;
