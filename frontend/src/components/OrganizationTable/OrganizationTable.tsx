import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Organization, Query } from 'types';
import { OrganizationForm } from 'components/OrganizationForm';
import { Grid, makeStyles } from '@material-ui/core';
import { useAuthContext } from 'context';
import { TableInstance } from 'react-table';
import { Table, Paginator } from 'components';
import { createColumns } from './columns';
import { useOrganizationApi } from 'hooks';

export const OrganizationTable: React.FC<{
  parent?: Organization;
}> = ({ parent }) => {
  const { apiPost, setFeedbackMessage, user } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const tableRef = useRef<TableInstance<Organization>>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const columns = useMemo(() => createColumns(), []);
  const { listOrganizations } = useOrganizationApi();
  const PAGE_SIZE = 15;
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

  const fetchOrganizations = useCallback(
    async (q: Query<Organization>) => {
      try {
        const { organizations, count } = await listOrganizations(q);
        setOrganizations(organizations);
        setTotalResults(count);
      } catch (e) {
        console.error(e);
      }
    },
    [listOrganizations]
  );

  const renderPagination = (table: TableInstance<Organization>) => (
    <Paginator table={table} totalResults={totalResults} />
  );

  return (
    <>
      {user?.userType === 'globalAdmin' && (
        <Grid item>
          <button onClick={() => setDialogOpen(true)}>
            Create new {parent ? 'Team' : 'Organization'}
          </button>
        </Grid>
      )}
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
