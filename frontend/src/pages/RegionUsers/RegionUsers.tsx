import React, { useState, useEffect, useCallback } from 'react';
import { initializeUser, User, Organization as OrganizationType } from 'types';
import { testUsers } from './testData';
import ConfirmDialog from 'components/Dialog/ConfirmDialog';
import InfoDialog from 'components/Dialog/InfoDialog';
import { useAuthContext } from 'context';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridToolbar
} from '@mui/x-data-grid';
import DoneIcon from '@mui/icons-material/Done';
import { CheckCircleOutline as CheckIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';

export interface ApiResponse {
  result: User[];
  count: number;
  url?: string;
}

type DialogStates = {
  isOrgDialogOpen: boolean;
  isDenyDialogOpen: boolean;
  isApproveDialogOpen: boolean;
  isInfoDialogOpen: boolean;
};

type ErrorStates = {
  getOrgsError: string;
  getUsersError: string;
  updateUserError: string;
};

type CloseReason = 'backdropClick' | 'escapeKeyDown' | 'closeButtonClick';

export const RegionUsers: React.FC = () => {
  const { apiGet } = useAuthContext();
  const pendingCols: GridColDef[] = [
    { field: 'fullName', headerName: 'Name', minWidth: 100, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 100, flex: 2 },
    { field: 'createdAt', headerName: 'Created At', minWidth: 100, flex: 2 },
    {
      field: 'status',
      headerName: 'Registration Status',
      minWidth: 250,
      flex: 1,
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
    {
      field: 'lastLoggedIn',
      headerName: 'Last Logged In',
      minWidth: 100,
      flex: 1
    },
    {
      field: 'organizations',
      headerName: 'Organizations',
      minWidth: 250,
      flex: 3
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
    updateUserError: ''
  });
  const [selectedUser, selectUser] = useState(initializeUser);
  const [selectedOrgRows, selectOrgRows] = useState<GridRowSelectionModel>([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const orgURL = '/organizations/regionId/';

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<OrganizationType[]>(orgURL + '1');
      setOrganizations(rows);
      setErrorStates({ ...errorStates, getOrgsError: '' });
    } catch (e: any) {
      setErrorStates({ ...errorStates, getOrgsError: e.message });
    }
  }, [apiGet]);

  useEffect(() => {
    fetchOrganizations();
  }, [apiGet, fetchOrganizations]);

  // TODO: Update selectedUser with invitePending as false and add selected organizations.
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
    selectOrgRows([]);
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

  const handleCancelDeny = () => {
    setDialogStates((prevState) => ({
      ...prevState,
      isDenyDialogOpen: false
    }));
  };

  const handleCancelApprove = () => {
    setDialogStates((prevState) => ({
      ...prevState,
      isOrgDialogOpen: false
    }));
    selectUser(initializeUser);
    selectOrgRows([]);
  };

  const handleConfirmApprove = () => {
    handleSubmitClick('closeButtonClick');
    setDialogStates((prevState) => ({
      ...prevState,
      isInfoDialogOpen: true
    }));
  };

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
          <Box sx={{ height: '400px' }}>
            <DataGrid
              columns={pendingCols}
              rows={testUsers}
              disableRowSelectionOnClick
              autoPageSize
            />
          </Box>
          <Typography variant="h6" pb={2} pt={5}>
            Members of Region 1
          </Typography>
          <Box sx={{ height: '400px' }}>
            <DataGrid
              columns={memberCols}
              rows={testUsers}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
            />
          </Box>
        </Box>
      </Box>
      <ConfirmDialog
        isOpen={dialogStates.isOrgDialogOpen}
        onClose={(_, reason) => handleSubmitClick(reason)}
        onConfirm={handleConfirmApprove}
        onCancel={handleCancelApprove}
        title={`Add ${selectedUser.fullName} to organizations`}
        content={
          <>
            <Typography mb={3}>
              To complete the approval process, select at least one organization
              for this user.
            </Typography>
            <Box sx={{ height: 600, margin: 'auto', pb: 2 }}>
              <DataGrid
                checkboxSelection
                onRowSelectionModelChange={(newRowSelectionModel) => {
                  selectOrgRows(newRowSelectionModel);
                }}
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
          </>
        }
        disabled={selectedOrgRows.length === 0 ? true : false}
        screenWidth="lg"
      />
      <ConfirmDialog
        isOpen={dialogStates.isDenyDialogOpen}
        onConfirm={handleConfirmDeny}
        onCancel={handleCancelDeny}
        title={`Are you sure?`}
        content={
          <>
            <Typography mb={3}>
              Removing {selectedUser.fullName} from pending requests will be
              permanent and cannot be undone.
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
          selectOrgRows([]);
        }}
        icon={<CheckIcon color="success" sx={{ fontSize: '80px' }} />}
        title={<Typography variant="h4">Success</Typography>}
        content={
          <Typography variant="body1">
            This user has been approved and is now a member of organizations in
            Region 1.
          </Typography>
        }
      />
    </Box>
  );
};

export default RegionUsers;
