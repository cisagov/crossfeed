import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Organization as OrganizationType, Role, ScanTask } from 'types';
import { FaGlobe, FaNetworkWired, FaClock, FaUsers } from 'react-icons/fa';
import { Column } from 'react-table';
import { Table } from 'components';
import { OrganizationForm } from 'components/OrganizationForm';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

export const Organization: React.FC = () => {
  const { organizationId } = useParams();
  const { apiGet, apiPut, apiPost } = useAuthContext();
  const [organization, setOrganization] = useState<OrganizationType>();
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');

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
      accessor: ({ approved }) => (approved ? 'Member' : 'Pending approval'),
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
    try {
      let organization = await apiGet<OrganizationType>(
        `/organizations/${organizationId}`
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
  }, [organizationId, apiGet, setOrganization]);

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

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        {organization && (
          <>
            <div className={classes.header}>
              <div className={classes.headerDetails}>
                <h1>{organization.name}</h1>
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
              </div>
            </div>
            <h1>Organization Users</h1>
            <Table<Role> columns={userRoleColumns} data={userRoles} />

            <h1>Organization Scan Tasks</h1>
            <Table<ScanTask> columns={scanTaskColumns} data={scanTasks} />
            <h2>Update Organization</h2>
            {errors.global && <p className={classes.error}>{errors.global}</p>}
            {message && <p>{message}</p>}
            <OrganizationForm
              onSubmit={updateOrganization}
              organization={organization}
              type="update"
            ></OrganizationForm>
          </>
        )}
      </div>
    </div>
  );
};

export default Organization;
