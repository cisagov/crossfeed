import React from 'react';
import { approveUser, removeUser } from '../userActions';
import { 
  Role,
  Organization as OrganizationType 
} from 'types';
import { Column } from 'react-table';
import { Button } from '@mui/material';
import { ControlPoint } from '@mui/icons-material';


const [ organization ] = React.useState<OrganizationType>();
const [ dialog, setDialog ] = React.useState<{
  open: boolean;
  type?: 'rootDomains' | 'ipBlocks' | 'tags';
  label?: string;
  stage?: number;
  domainVerificationStatusMessage?: string;
}>({ open: false });

export const userRoleColumns: Column<Role>[] = [
    {
      Header: 'Name',
      accessor: ({ user }) => user?.fullName,
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: ({ user }) => user?.email,
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Role',
      accessor: ({ approved, role, user }) => {
        if (approved) {
          if (user?.invitePending) {
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
      Header: () => {
        return (
          <div style={{ justifyContent: 'flex-center' }}>
            <Button color="secondary" onClick={() => setDialog({ open: true })}>
              <ControlPoint style={{ marginRight: '10px' }}></ControlPoint>
              Add member
            </Button>
          </div>
        );
      },
      id: 'action',
      Cell: ({ row }: { row: { index: number } }) => {
        const isApproved =
          !organization?.userRoles[row.index] ||
          organization?.userRoles[row.index].approved;
        return (
          <>
            {isApproved ? (
              <Button
                onClick={() => {
                  removeUser(row.index);
                }}
                color="secondary"
              >
                <p>Remove</p>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  approveUser(row.index);
                }}
                color="secondary"
              >
                <p>Approve</p>
              </Button>
            )}
          </>
        );
      },
      disableFilters: true
    }
  ];