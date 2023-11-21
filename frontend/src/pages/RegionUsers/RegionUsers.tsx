import React, { useState, useEffect, useCallback } from 'react';
import { initializeUser, User, Organization as OrganizationType } from 'types';
import ConfirmDialog from 'components/Dialog/ConfirmDialog';
import InfoDialog from 'components/Dialog/InfoDialog';
import { useAuthContext } from 'context';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridToolbar,
  useGridApiRef
} from '@mui/x-data-grid';
import DoneIcon from '@mui/icons-material/Done';
import { CheckCircleOutline as CheckIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';

type DialogStates = {
  isOrgDialogOpen: boolean;
  isDenyDialogOpen: boolean;
  isApproveDialogOpen: boolean;
  isInfoDialogOpen: boolean;
};

type ErrorStates = {
  getOrgsError: string;
  getUsersError: string;
  getUpdateError: string;
};

type CloseReason = 'backdropClick' | 'escapeKeyDown' | 'closeButtonClick';

const transformData = (data: User[]): User[] => {
  return data.map(({ roles, ...user }) => ({
    ...user,
    roles,
    organizations: roles.map((role) => ' ' + role.organization.name)
  }));
};
export const RegionUsers: React.FC = () => {
  const { apiGet, apiPost, apiPut, user } = useAuthContext();
  const apiRefPendingUsers = useGridApiRef();
  const apiRefCurrentUsers = useGridApiRef();
  const regionId = user?.regionId;
  const getOrgsURL = `/organizations/regionId/${regionId}`;
  const getUsersURL = `/v2/users?regionId=${regionId}&invitePending=`;
  const pendingCols: GridColDef[] = [
    { field: 'fullName', headerName: 'Name', minWidth: 100, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 100, flex: 2 },
    { field: 'state', headerName: 'State', minWidth: 100, flex: 1 },
    { field: 'createdAt', headerName: 'Created At', minWidth: 100, flex: 1.5 },
    {
      field: 'status',
      headerName: 'Registration Status',
      minWidth: 250,
      flex: 2,
      renderCell: (cellValues: GridRenderCellParams) => {
        return (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              endIcon={<DoneIcon />}
              color="success"
              onClick={() => handleApproveClick(cellValues.row)}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              endIcon={<CloseIcon />}
              color="error"
              onClick={() => handleDenyClick(cellValues.row)}
            >
              Deny
            </Button>
          </Stack>
        );
      }
    }
  ];
  const memberCols: GridColDef[] = [
    { field: 'fullName', headerName: 'Name', minWidth: 100, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 100, flex: 2 },
    { field: 'state', headerName: 'State', minWidth: 100, flex: 1 },
    {
      field: 'lastLoggedIn',
      headerName: 'Last Logged In',
      minWidth: 100,
      flex: 1.5
    },
    {
      field: 'organizations',
      headerName: 'Organizations',
      minWidth: 250,
      flex: 2
    }
  ];
  const orgCols: GridColDef[] = [
    { field: 'name', headerName: 'Name', minWidth: 100, flex: 2 },
    { field: 'updatedAt', headerName: 'Updated At', minWidth: 100, flex: 1 },
    { field: 'stateName', headerName: 'State', minWidth: 100, flex: 1 }
  ];
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    isOrgDialogOpen: false,
    isDenyDialogOpen: false,
    isApproveDialogOpen: false,
    isInfoDialogOpen: false
  });
  const [errorStates, setErrorStates] = useState<ErrorStates>({
    getOrgsError: '',
    getUsersError: '',
    getUpdateError: ''
  });
  const [selectedUser, selectUser] = useState<User>(initializeUser);
  const [selectedOrgRows, selectOrgRows] = useState<GridRowSelectionModel>([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<OrganizationType[]>(getOrgsURL);
      setOrganizations(rows);
      setErrorStates({ ...errorStates, getOrgsError: '' });
    } catch (e: any) {
      setErrorStates({ ...errorStates, getOrgsError: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGet]);
  const fetchPendingUsers = useCallback(async () => {
    try {
      const rows = await apiGet<User[]>(`${getUsersURL}true`);
      setPendingUsers(rows);
      setErrorStates({ ...errorStates, getUsersError: '' });
    } catch (e: any) {
      setErrorStates({ ...errorStates, getUsersError: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGet]);
  const fetchCurrentUsers = useCallback(async () => {
    try {
      const rows = await apiGet<User[]>(`${getUsersURL}false`);
      setCurrentUsers(transformData(rows));
      setErrorStates({ ...errorStates, getUsersError: '' });
    } catch (e: any) {
      setErrorStates({ ...errorStates, getUsersError: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGet]);

  useEffect(() => {
    fetchOrganizations();
    fetchPendingUsers();
    fetchCurrentUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addOrgToUser = useCallback(
    (userId: string, selectedOrgId: any) => {
      apiPost(`/v2/organizations/${selectedOrgId}/users`, {
        body: { userId, role: 'user' }
      }).then(
        () => updateUser(userId),
        (e) => setErrorStates({ ...errorStates, getUpdateError: e.message })
      );
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiPost]
  );

  const updateUser = useCallback(
    (userId: string) => {
      apiPut(`/v2/users/${userId}`, {
        body: { invitePending: false }
      }).then(
        (res) => {
          apiRefPendingUsers.current.updateRows([
            { id: userId, _action: 'delete' }
          ]);
          setPendingUsers((prevPendingUsers) =>
            prevPendingUsers.filter((user) => user.id !== userId)
          );
          apiRefCurrentUsers.current.updateRows([res]);
          setCurrentUsers((prevCurrentUsers) => [...prevCurrentUsers, res]);
        },
        (e) => setErrorStates({ ...errorStates, getUpdateError: e.message })
      );
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiPut]
  );

  const handleSubmitClick = (value: CloseReason) => {
    if (value === 'backdropClick' || value === 'escapeKeyDown') {
      return;
    }
    // TODO: Handle API error response
    setDialogStates({
      ...dialogStates,
      isOrgDialogOpen: false
    });
    selectUser(initializeUser);
  };
  // TODO: Remove selectedUser from User table.
  const handleConfirmDeny = () => {
    // TODO: Handle API error response
    setDialogStates({
      ...dialogStates,
      isDenyDialogOpen: false
    });
  };

  const handleApproveClick = (row: typeof initializeUser) => {
    selectOrgRows([]);
    setDialogStates({
      ...dialogStates,
      isOrgDialogOpen: true
    });
    selectUser(row);
  };

  const handleDenyClick = (row: typeof initializeUser) => {
    setDialogStates({
      ...dialogStates,
      isDenyDialogOpen: true
    });
    selectUser(row);
  };

  const handleDenyCancelClick = () => {
    setDialogStates((prevState) => ({
      ...prevState,
      isDenyDialogOpen: false
    }));
  };

  const handleApproveCancelClick = () => {
    setDialogStates((prevState) => ({
      ...prevState,
      isOrgDialogOpen: false
    }));
    selectUser(initializeUser);
  };

  const handleApproveConfirmClick = () => {
    addOrgToUser(selectedUser.id, selectedOrgRows[0]);
    handleSubmitClick('closeButtonClick');
    setDialogStates((prevState) => ({
      ...prevState,
      isInfoDialogOpen: true
    }));
  };

  const onRowSelectionModelChange = (newRowSelectionModel: any) => {
    if (newRowSelectionModel.length > 1) {
      const selectionSet = new Set(selectedOrgRows);
      const result = newRowSelectionModel.filter(
        (s: any) => !selectionSet.has(s)
      );
      selectOrgRows(result);
    } else {
      selectOrgRows(newRowSelectionModel);
    }
  };
  if (user?.userType !== ('globalAdmin' || 'regionAdmin')) {
    return (
      <Alert severity="warning" sx={{ fontSize: 17 }}>
        <b>Access Prohibited:</b> You are not authorized to view this page.
        Contact an administrator for access.
      </Alert>
    );
  }
  return (
    <Box m={5} sx={{ height: '150vh' }}>
      <Box
        sx={{
          maxWidth: '1700px',
          m: 'auto',
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ m: 'auto', maxWidth: '1500px', px: 2, py: 5 }}>
          <Typography variant="h4">Region 1 Admin Dashboard</Typography>
          <br />
          <Typography variant="h6" pb={2} pt={2}>
            Pending Requests
          </Typography>
          <Box sx={{ height: '400px', pb: 2 }}>
            <DataGrid
              apiRef={apiRefPendingUsers}
              columns={pendingCols}
              rows={pendingUsers}
              disableRowSelectionOnClick
              autoPageSize
            />
          </Box>
          {errorStates.getUsersError && (
            <Alert severity="error">
              Error retrieving users from the database:{' '}
              {errorStates.getUsersError}
            </Alert>
          )}
          <Typography variant="h6" pb={2} pt={3}>
            Members of Region 1
          </Typography>
          <Box sx={{ maxHeight: '1500px' }}>
            <DataGrid
              apiRef={apiRefCurrentUsers}
              columns={memberCols}
              rows={currentUsers}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 }
                }
              }}
            />
          </Box>
        </Box>
      </Box>
      <ConfirmDialog
        isOpen={dialogStates.isOrgDialogOpen}
        onClose={(_, reason) => handleSubmitClick(reason)}
        onConfirm={handleApproveConfirmClick}
        onCancel={handleApproveCancelClick}
        title={`Add ${selectedUser.fullName} to an organization`}
        content={
          <>
            <Typography mb={3}>
              To complete the approval process, select one organization for this
              user to join.
            </Typography>
            <Box sx={{ height: 600, margin: 'auto', pb: 2 }}>
              <DataGrid
                checkboxSelection
                onRowSelectionModelChange={onRowSelectionModelChange}
                rowSelectionModel={selectedOrgRows}
                rows={organizations}
                columns={orgCols}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true
                  }
                }}
              />
            </Box>
            {errorStates.getOrgsError && (
              <Alert severity="error">
                Error retrieving organizations: {errorStates.getOrgsError}
              </Alert>
            )}
            {selectedOrgRows.length !== 0 ? (
              <Alert severity="info">
                {selectedUser.fullName} will become a member of the selected
                organization.
              </Alert>
            ) : (
              <Box pt={6} />
            )}
          </>
        }
        disabled={selectedOrgRows.length === 0 ? true : false}
        screenWidth="lg"
      />
      <ConfirmDialog
        isOpen={dialogStates.isDenyDialogOpen}
        onConfirm={handleConfirmDeny}
        onCancel={handleDenyCancelClick}
        title={`Are you sure?`}
        content={
          <>
            <Typography mb={3}>
              Denying the request from {selectedUser.fullName} will permanently
              remove this user and cannot be undone.
            </Typography>
            {/* {apiError[0] && (
            <Alert severity="error">
              {apiError[1]}: Unable to remove this user to the database.
            </Alert>
          )} */}
          </>
        }
      />
      <InfoDialog
        isOpen={dialogStates.isInfoDialogOpen}
        handleClick={() => {
          setDialogStates((prevState) => ({
            ...prevState,
            isInfoDialogOpen: false
          }));
        }}
        icon={<CheckIcon color="success" sx={{ fontSize: '80px' }} />}
        title={<Typography variant="h4">Success</Typography>}
        content={
          <Typography variant="body1">
            This user has been approved and is now a member of Region 1.
          </Typography>
        }
      />
    </Box>
  );
};

export default RegionUsers;
