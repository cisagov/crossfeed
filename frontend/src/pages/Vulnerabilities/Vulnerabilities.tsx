import React, { useState, useCallback, useRef, useMemo } from 'react';
import { TableInstance, Filters, SortingRule } from 'react-table';
import { Query } from 'types';
import { useAuthContext } from 'context';
import { Table, Paginator } from 'components';
import { Vulnerability } from 'types';
import classes from './styles.module.scss';
import { makeStyles } from '@material-ui/core';
import { Subnav } from 'components';
import { parse } from 'query-string';
import { createColumns, createGroupedColumns } from './columns';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
  url?: string;
}

const PAGE_SIZE = 15;

export const stateMap: { [key: string]: string } = {
  unconfirmed: 'Unconfirmed',
  exploitable: 'Exploitable',
  'false-positive': 'False Positive',
  'accepted-risk': 'Accepted Risk',
  remediated: 'Remediated'
};

export const Vulnerabilities: React.FC<{ groupBy?: string }> = ({
  groupBy = undefined
}: {
  children?: React.ReactNode;
  groupBy?: string;
}) => {
  const { currentOrganization, apiPost, apiPut, showAllOrganizations } =
    useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const tableRef = useRef<TableInstance<Vulnerability>>(null);
  const listClasses = useStyles();
  const [noResults, setNoResults] = useState(false);

  const updateVulnerability = useCallback(
    async (index: number, body: { [key: string]: string }) => {
      try {
        const res = await apiPut<Vulnerability>(
          '/vulnerabilities/' + vulnerabilities[index].id,
          {
            body: body
          }
        );
        const vulnCopy = [...vulnerabilities];
        vulnCopy[index].state = res.state;
        vulnCopy[index].substate = res.substate;
        vulnCopy[index].actions = res.actions;
        setVulnerabilities(vulnCopy);
      } catch (e) {
        console.error(e);
      }
    },
    [setVulnerabilities, apiPut, vulnerabilities]
  );
  const columns = useMemo(
    () => createColumns(updateVulnerability),
    [updateVulnerability]
  );
  const groupedColumns = useMemo(() => createGroupedColumns(), []);

  const vulnerabilitiesSearch = useCallback(
    async ({
      filters,
      sort,
      page,
      pageSize = PAGE_SIZE,
      doExport = false,
      groupBy = undefined
    }: {
      filters: Filters<Vulnerability>;
      sort: SortingRule<Vulnerability>[];
      page: number;
      pageSize?: number;
      doExport?: boolean;
      groupBy?: string;
    }): Promise<ApiResponse | undefined> => {
      try {
        const tableFilters: {
          [key: string]: string | boolean | undefined;
        } = filters
          .filter((f) => Boolean(f.value))
          .reduce(
            (accum, next) => ({
              ...accum,
              [next.id]: next.value
            }),
            {}
          );
        // If not open or closed, substitute for appropriate substate
        if (
          tableFilters['state'] &&
          !['open', 'closed'].includes(tableFilters['state'] as string)
        ) {
          const substate = (tableFilters['state'] as string)
            .match(/\((.*)\)/)
            ?.pop();
          if (substate)
            tableFilters['substate'] = substate.toLowerCase().replace(' ', '-');
          delete tableFilters['state'];
        }
        if (!showAllOrganizations && currentOrganization) {
          if ('rootDomains' in currentOrganization)
            tableFilters['organization'] = currentOrganization.id;
          else tableFilters['tag'] = currentOrganization.id;
        }
        if (tableFilters['isKev']) {
          // Convert string to boolean filter.
          tableFilters['isKev'] = tableFilters['isKev'] === 'true';
        }
        return await apiPost<ApiResponse>(
          doExport ? '/vulnerabilities/export' : '/vulnerabilities/search',
          {
            body: {
              page,
              sort: sort[0]?.id ?? 'createdAt',
              order: sort[0]?.desc ? 'DESC' : 'ASC',
              filters: tableFilters,
              pageSize,
              groupBy
            }
          }
        );
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [apiPost, currentOrganization, showAllOrganizations]
  );

  const fetchVulnerabilities = useCallback(
    async (query: Query<Vulnerability>) => {
      const resp = await vulnerabilitiesSearch({
        filters: query.filters,
        sort: query.sort,
        page: query.page,
        groupBy
      });
      if (!resp) return;
      const { result, count } = resp;
      setVulnerabilities(result);
      setTotalResults(count);
      setNoResults(count === 0);
    },
    [vulnerabilitiesSearch, groupBy]
  );

  const fetchVulnerabilitiesExport = async (): Promise<string> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    const { url } = (await vulnerabilitiesSearch({
      filters: filters!,
      sort: sortBy!,
      page: 1,
      pageSize: -1,
      doExport: true
    })) as ApiResponse;
    return url!;
  };

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator
      table={table}
      totalResults={totalResults}
      export={{
        name: 'vulnerabilities',
        getDataToExport: fetchVulnerabilitiesExport
      }}
    />
  );

  const initialFilterBy: Filters<Vulnerability> = [];
  let initialSortBy: SortingRule<Vulnerability>[] = [];
  const params = parse(window.location.search);
  if (!('state' in params)) params['state'] = 'open';
  for (const param of Object.keys(params)) {
    if (param === 'sort') {
      initialSortBy = [
        {
          id: params[param] as string,
          desc: 'desc' in params ? params['desc'] === 'true' : true
        }
      ];
    } else if (param !== 'desc') {
      initialFilterBy.push({
        id: param,
        value: params[param] as string
      });
    }
  }

  return (
    <div>
      <div className={listClasses.contentWrapper}>
        <Subnav
          items={[
            { title: 'Search Results', path: '/inventory', exact: true },
            { title: 'All Domains', path: '/inventory/domains' },
            { title: 'All Vulnerabilities', path: '/inventory/vulnerabilities' }
          ]}
        ></Subnav>
        <br></br>
        <div className={classes.root}>
          <Table<Vulnerability>
            renderPagination={renderPagination}
            columns={groupBy ? groupedColumns : columns}
            data={vulnerabilities}
            pageCount={Math.ceil(totalResults / PAGE_SIZE)}
            fetchData={fetchVulnerabilities}
            tableRef={tableRef}
            initialFilterBy={initialFilterBy}
            initialSortBy={initialSortBy}
            noResults={noResults}
            pageSize={PAGE_SIZE}
            noResultsMessage={
              "We don't see any vulnerabilities that match your criteria."
            }
          />
        </div>
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  contentWrapper: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden'
  }
}));

export default Vulnerabilities;
