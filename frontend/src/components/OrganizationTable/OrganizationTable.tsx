import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Organization, Query } from 'types';
import { OrganizationForm } from 'components/OrganizationForm';
import { OrganizationBulkOperationsDialog } from 'components/OrganizationBulkOperationsDialog';
import { Grid } from '@material-ui/core';
import { FaThList } from 'react-icons/fa';
import { useAuthContext } from 'context';
import { TableInstance } from 'react-table';
import { Table, Paginator } from 'components';
import { createColumns } from './columns';
import { useOrganizationApi } from 'hooks';
import { ComponentPropsToStylePropsMapKeys, Flex } from '@aws-amplify/ui-react';
import { Button } from '@material-ui/core';
export const OrganizationTable: React.FC<{
  parent?: Organization;
}> = ({ parent }) => {
  const { apiPost, apiDelete, setFeedbackMessage, user } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  // Hold on to current query for use in bulk operations.
  const [currentQuery, setCurrentQuery] = useState<Query<Organization>>({
    sort: [],
    page: 0,
    filters: [],
    pageSize: 0
  });

  const tableRef = useRef<TableInstance<Organization>>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const columns = useMemo(() => createColumns(), []);
  const { listOrganizations } = useOrganizationApi();
  const PAGE_SIZE = 15;
  const onBulkSubmit = async () => {
    const { organizations, count } = await listOrganizations({
      sort: [],
      page: 1,
      pageSize: -1, //show all records.
      filters: currentQuery.filters
    });
    console.log(`Deleting ${count} organizations.`);
    const ids = organizations.map((org) => org.id);
    //break into 1000-org slices so that we don't send too large of a request.
    const chunkSize = 1000;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await apiDelete('/organizations', {
        //pattern asks for something, 0 isn't a UUID and will be skipped
        body: chunk
      });
    }
    fetchOrganizations(currentQuery);
    // now we can show the deleted records.
  };
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
        setCurrentQuery(q);
        console.log(q);
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
      <Flex justifyContent="space-between">
        {user?.userType === 'globalAdmin' && (
          <button
            type="button"
            className="usa-button"
            onClick={() => setDialogOpen(true)}
          >
            Create new {parent ? 'Team' : 'Organization'}
          </button>
        )}
        <Button
          type="button"
          variant="contained"
          color="secondary"
          onClick={() => setBulkDialogOpen(true)}
        >
          <FaThList></FaThList> Bulk Operations
        </Button>
      </Flex>
      <Table<Organization>
        renderPagination={renderPagination}
        tableRef={tableRef}
        columns={columns}
        data={organizations}
        pageCount={Math.ceil(totalResults / PAGE_SIZE)}
        fetchData={fetchOrganizations}
        pageSize={PAGE_SIZE}
      />
      <OrganizationBulkOperationsDialog
        onSubmit={onBulkSubmit}
        totalResults={totalResults}
        open={bulkDialogOpen}
        setOpen={setBulkDialogOpen}
      ></OrganizationBulkOperationsDialog>
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
