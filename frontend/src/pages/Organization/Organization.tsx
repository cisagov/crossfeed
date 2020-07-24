import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Organization as OrganizationType, Role, ScanTask } from 'types';
import { FaGlobe, FaNetworkWired, FaClock, FaUsers } from 'react-icons/fa';
import { Column } from 'react-table';
import { Table } from 'components';
import { OrganizationForm } from 'components/OrganizationForm';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  PrimaryNav,
  Header,
  Label,
  TextInput,
  Button,
  Dropdown
} from '@trussworks/react-uswds';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

export const Organization: React.FC = () => {
  const { currentOrganization, apiGet, apiPut, apiPost } = useAuthContext();
  const [organization, setOrganization] = useState<OrganizationType>();
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [currentView, setCurrentView] = useState<number>(0);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');
  const [newUserValues, setNewUserValues] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    organization?: OrganizationType;
    role: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });

  const dateAccessor = (date?: string) => {
    return !date || new Date(date).getTime() === new Date(0).getTime()
      ? 'Never'
      : `${formatDistanceToNow(parseISO(date))} ago`;
  };

  const userRoleColumns: Column<Role>[] = [
    {
      Header: 'Name',
      accessor: ({ user }) => user.fullName,
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: ({ user }) => user.email,
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: ({ approved, role, user }) => {
        if (approved) {
          if (user.invitePending) {
            return 'Invite pending';
          } else if (role === 'admin') {
            return 'Administrator';
          } else {
            return 'Member';
          }
        }
        return 'Pending approval';
      },
      width: 50,
      minWidth: 50,
      id: 'approved',
      disableFilters: true
    },
    {
      Header: 'Action',
      id: 'action',
      Cell: ({ row }: { row: { index: number } }) =>
        organization?.userRoles[row.index].approved ? (
          <Link
            to="#"
            onClick={() => {
              removeUser(row.index);
            }}
          >
            <p>Remove</p>
          </Link>
        ) : (
          <Link
            to="#"
            onClick={() => {
              approveUser(row.index);
            }}
          >
            <p>Approve</p>
          </Link>
        ),
      disableFilters: true
    }
  ];

  const scanTaskColumns: Column<ScanTask>[] = [
    {
      Header: 'ID',
      accessor: 'id',
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: 'status',
      disableFilters: true
    },
    {
      Header: 'Type',
      accessor: 'type',
      disableFilters: true
    },
    {
      Header: 'Name',
      accessor: ({ input }) => {
        if (!input) return;
        return JSON.parse(input).scanName;
      },
      disableFilters: true
    },
    {
      Header: 'Created At',
      accessor: ({ createdAt }) => dateAccessor(createdAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Requested At',
      accessor: ({ requestedAt }) => dateAccessor(requestedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Started At',
      accessor: ({ startedAt }) => dateAccessor(startedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Finished At',
      accessor: ({ finishedAt }) => dateAccessor(finishedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Output',
      accessor: 'output',
      disableFilters: true
    }
  ];

  const fetchOrganization = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }
    try {
      const organization = await apiGet<OrganizationType>(
        `/organizations/${currentOrganization.id}`
      );
      organization.scanTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrganization(organization);
      setUserRoles(organization.userRoles);
      setScanTasks(organization.scanTasks);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, setOrganization, currentOrganization]);

  const approveUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${organization?.userRoles[user].id}/approve`,
        {}
      );
      const copy = userRoles.map((role, id) =>
        id === user ? { ...role, approved: true } : role
      );
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

  const removeUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${organization?.userRoles[user].id}/remove`,
        {}
      );
      const copy = userRoles.filter((_, ind) => ind !== user);
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrganization = async (body: Object) => {
    try {
      const org = await apiPut('/organizations/' + organization?.id, {
        body
      });
      setOrganization(org);
      setMessage('Organization successfully updated');
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting organization entry.'
            : e.message ?? e.toString()
      });
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const onInviteUserSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      let body = {
        firstName: newUserValues.firstName,
        lastName: newUserValues.lastName,
        email: newUserValues.email,
        organization: organization?.id,
        organizationAdmin: newUserValues.role === 'admin'
      };
      const user = await apiPost('/users/', {
        body
      });
      setUserRoles(userRoles.concat(user));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting user entry.'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onInviteUserTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = e => onInviteUserChange(e.target.name, e.target.value);

  const onInviteUserChange = (name: string, value: any) => {
    setNewUserValues(values => ({
      ...values,
      [name]: value
    }));
  };

  if (!organization) return <div></div>;

  const views = [
    <>
      <div className={classes.headerRow}>
        <label>
          <FaNetworkWired />
          Root Domains
        </label>
        <span>{organization.rootDomains.join(', ')}</span>
      </div>

      <div className={classes.headerRow}>
        <label>
          <FaGlobe />
          IP Blocks
        </label>
        <span>{organization.ipBlocks.join(', ')}</span>
      </div>

      <div className={classes.headerRow}>
        <label>
          <FaClock />
          Passive Mode
        </label>
        <span>{organization.isPassive ? 'Yes' : 'No'}</span>
      </div>

      <div className={classes.headerRow}>
        <label>
          <FaUsers />
          Invite Only
        </label>
        <span>{organization.inviteOnly ? 'Yes' : 'No'}</span>
      </div>
    </>,
    <>
      {' '}
      <h1>Organization Users</h1>
      <Table<Role> columns={userRoleColumns} data={userRoles} />
      <h2>Invite a user</h2>
      <form onSubmit={onInviteUserSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="firstName">First Name</Label>
        <TextInput
          required
          id="firstName"
          name="firstName"
          className={classes.textField}
          type="text"
          value={newUserValues.firstName}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="lastName">Last Name</Label>
        <TextInput
          required
          id="lastName"
          name="lastName"
          className={classes.textField}
          type="text"
          value={newUserValues.lastName}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="email">Email</Label>
        <TextInput
          required
          id="email"
          name="email"
          className={classes.textField}
          type="text"
          value={newUserValues.email}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="role">Organization Role</Label>
        <Dropdown
          required
          id="role"
          name="role"
          className={classes.textField}
          onChange={onInviteUserTextChange}
          value={newUserValues.role}
        >
          <option key="standard" value="standard">
            Standard
          </option>
          <option key="admin" value="admin">
            Administrator
          </option>
        </Dropdown>
        <br></br>
        <Button type="submit">Invite User</Button>
      </form>
    </>,
    <>
      <h1>Organization Scan Tasks</h1>
      <Table<ScanTask> columns={scanTaskColumns} data={scanTasks} />
    </>,

    <>
      <h1>Update Organization</h1>
      {errors.global && <p className={classes.error}>{errors.global}</p>}
      {message && <p>{message}</p>}
      <OrganizationForm
        onSubmit={updateOrganization}
        organization={organization}
        type="update"
      ></OrganizationForm>
    </>
  ];

  return (
    <div className={classes.root}>
      <Header>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <h1>{organization.name}</h1>
          </div>
          <PrimaryNav
            items={[
              <a
                key="one"
                href="#"
                onClick={() => {
                  setCurrentView(0);
                }}
                className="usa-nav__link"
              >
                <span>Overview</span>
              </a>,
              <a
                key="two"
                href="#"
                onClick={() => {
                  setCurrentView(1);
                }}
              >
                <span>Manage Users</span>
              </a>,
              <a
                key="three"
                href="#"
                onClick={() => {
                  setCurrentView(2);
                }}
              >
                <span>Manage Scans</span>
              </a>,
              <a
                key="four"
                href="#"
                onClick={() => {
                  setCurrentView(3);
                }}
              >
                <span>Update organization</span>
              </a>
            ]}
            onToggleMobileNav={function noRefCheck() {}}
          />
        </div>
      </Header>
      {views[currentView]}
    </div>
  );
};

export default Organization;
