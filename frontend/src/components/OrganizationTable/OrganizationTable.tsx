import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Organization } from 'types';
import { Grid, Paper, makeStyles } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Add } from '@material-ui/icons';
import { OrganizationForm } from 'components/OrganizationForm';
import { useAuthContext } from 'context';
import { TableInstance } from 'react-table';
import { Table, Paginator, Subnav } from 'components';
import { createColumns } from './columns';

export const OrganizationTable: React.FC<{
  parent?: Organization;
}> = ({ parent }) => {
  const { apiPost, apiGet, setFeedbackMessage, user } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const history = useHistory();
  const classes = useStyles();
  const tableRef = useRef<TableInstance<Organization>>(null);
  const { showAllOrganizations } = useAuthContext();
  const [totalResults, setTotalResults] = useState(0);
  const columns = useMemo(() => createColumns(), []);

  const PAGE_SIZE = 30;

  const onSubmit = async (body: Object) => {
    try {
      const org = await apiPost('/organizations/', {
        body
      });
      setOrganizations(organizations.concat(org));
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error when submitting organization entry.'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  const renderPagination = (table: TableInstance<Organization>) => (
    <Paginator table={table} totalResults={totalResults} />
  );

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<Organization[]>('/organizations/');
      setOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  React.useEffect(() => {
    if (!parent) fetchOrganizations();
    else {
      setOrganizations(parent.children);
    }
  }, [fetchOrganizations, parent]);

  return (
    <>
      <Table<Organization>
        renderPagination={renderPagination}
        tableRef={tableRef}
        columns={columns}
        data={organizations}
        pageCount={Math.ceil(totalResults / PAGE_SIZE)}
        fetchData={fetchOrganizations}
        pageSize={PAGE_SIZE}
      />
      <OrganizationForm
        onSubmit={onSubmit}
        open={dialogOpen}
        setOpen={setDialogOpen}
        type="create"
        parent={parent}
      ></OrganizationForm>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  cardRoot: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    border: '2px solid #DCDEE0',
    height: 150,
    width: 200,
    borderRadius: '5px',
    padding: '1rem',
    color: '#3D4551',
    '& h1': {
      fontSize: '20px',
      margin: 0
    },
    '& p': {
      fontSize: '14px'
    }
  }
}));
