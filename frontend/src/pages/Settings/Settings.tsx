import React from 'react';
import classes from './Settings.module.css';
import { useAuthContext } from 'context';
import { Button } from '@trussworks/react-uswds';
import { Table } from 'components';
import { ApiKey } from 'types/api-key';
import { Column } from 'react-table';
import { FaTimes } from 'react-icons/fa';
import { formatDistanceToNow, parseISO } from 'date-fns';

const Settings: React.FC = () => {
  const { logout, user, setUser, apiPost, apiDelete } = useAuthContext();

  const generateApiKey = async () => {
    if (!user) return;
    const apiKey = await apiPost<ApiKey>('/api-keys');
    setUser({ ...user, apiKeys: user.apiKeys.concat([apiKey]) });
  };

  const deleteApiKey = async (key: string) => {
    if (!user) return;
    await apiDelete<ApiKey>('/api-keys/' + key);
    setUser({
      ...user,
      apiKeys: user.apiKeys.filter((k) => k.id !== key)
    });
  };

  const columns: Column<ApiKey>[] = [
    {
      Header: 'Key',
      accessor: 'key',
      width: 200,
      disableFilters: true,
      id: 'key'
    },
    {
      Header: 'Date Created',
      accessor: ({ createdAt }) =>
        `${formatDistanceToNow(parseISO(createdAt))} ago`,
      width: 50,
      minWidth: 50,
      id: 'createdAt',
      disableFilters: true
    },
    {
      Header: 'Last Used',
      accessor: ({ lastUsed }) =>
        lastUsed ? `${formatDistanceToNow(parseISO(lastUsed))} ago` : 'Never',
      width: 50,
      minWidth: 50,
      id: 'lastUsed',
      disableFilters: true
    },
    {
      Header: 'Delete',
      id: 'delete',
      Cell: ({ row }: { row: { index: number } }) => (
        <span
          onClick={() => {
            if (!user) return;
            deleteApiKey(user.apiKeys[row.index].id);
          }}
        >
          <FaTimes />
        </span>
      ),
      disableFilters: true
    }
  ];

  return (
    <div className={classes.root}>
      <h1>My Account</h1>
      <Button type="button" onClick={logout}>
        Logout
      </Button>
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
      <h2>API Keys:</h2>
      {(!user?.apiKeys || user.apiKeys.length === 0) && <p>No API Keys</p>}
      {user?.apiKeys && (
        <Table<ApiKey> columns={columns} data={user?.apiKeys} />
      )}
      <br></br>
      <Button type="button" onClick={generateApiKey}>
        Generate API Key
      </Button>
      <br></br>
      <br></br>
      {user?.userType === 'globalAdmin' && (
        <>
          <a href={`${process.env.REACT_APP_API_URL}/matomo/index.php`}>
            <Button type="button">Matomo</Button>
          </a>
          <br />
          <br />
        </>
      )}
    </div>
  );
};

export default Settings;
