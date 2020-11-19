import React from 'react';
import classes from './Settings.module.css';
import { useAuthContext } from 'context';
import { Button } from '@trussworks/react-uswds';

const Settings: React.FC = () => {
  const { logout, user, setUser, apiPost } = useAuthContext();

  const generateApiKey = async () => {
    if (!user) return;
    const { apiKey } = await apiPost<{ apiKey: string }>(
      '/users/me/generateApiKey'
    );
    setUser({ ...user, apiKey });
  };

  return (
    <div className={classes.root}>
      <h1>My Account</h1>
      <h2>Name: {user && user.fullName}</h2>
      <h2>Email: {user && user.email}</h2>
      <h2>
        API Key: {user?.apiKey ? user.apiKey : 'None'}{' '}
        <Button type="button" onClick={generateApiKey}>
          {user?.apiKey ? 'Regenerate' : 'Generate'}
        </Button>
      </h2>
      <h2>
        Member of:{' '}
        {user &&
          (user.roles || [])
            .filter((role) => role.approved)
            .map((role) => role.organization.name)
            .join(', ')}
      </h2>
      {user?.userType === 'globalAdmin' && (
        <>
          <a href={`${process.env.REACT_APP_API_URL}/matomo/index.php`}>
            <Button type="button">Matomo</Button>
          </a>
          <br />
          <br />
        </>
      )}
      <Button type="button" onClick={logout}>
        Logout
      </Button>
    </div>
  );
};

export default Settings;
