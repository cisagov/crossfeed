import React, { useState, useCallback, useRef } from 'react';
import {
  TableInstance,
  Row,
  Filters,
  SortingRule,
  CellProps,
  Column
} from 'react-table';
import { Query } from 'types';
import { useAuthContext } from 'context';
import {
  Table,
  Paginator,
  Export,
  ColumnFilter,
  selectFilter
} from 'components';
import { Vulnerability } from 'types';
import classes from './styles.module.scss';
import { Grid, Checkbox, Dropdown } from '@trussworks/react-uswds';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
}

const formatDate = (date: string) => {
  return format(parseISO(date), 'MM-dd-yyyy');
};

const stateMap: { [key: string]: string } = {
  unconfirmed: 'Unconfirmed',
  exploitable: 'Exploitable',
  'false-positive': 'False Positive',
  'accepted-risk': 'Accepted Risk',
  remediated: 'Remediated'
};

export const renderExpandedVulnerability = (row: Row<Vulnerability>) => {
  const { original } = row;
  return (
    <div className={classes.expandedRoot}>
      <h4>Details</h4>
      <div className={classes.desc}>
        {original.cve && (
          <a
            href={`https://nvd.nist.gov/vuln/detail/${original.cve}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View vulnerability description
          </a>
        )}
        <h3>Vulnerability history</h3>
        {original.actions.map((action, num) => {
          const val = action.automatic ? (
            <>Vulnerability automatically marked as remediated</>
          ) : (
            <>
              State changed to {action.state} (
              {stateMap[action.substate].toLowerCase()}) by {action.userName}
            </>
          );
          return (
            <p key={num}>
              {val} on {formatDate(action.date)}
            </p>
          );
        })}
        <p>Vulnerability opened on {formatDate(original.createdAt)}</p>
      </div>
    </div>
  );
};

export const Vulnerabilities: React.FC = () => {
  const { user, currentOrganization, apiPost, apiPut } = useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const tableRef = useRef<TableInstance<Vulnerability>>(null);
  const [showAll, setShowAll] = useState<boolean>(
    JSON.parse(localStorage.getItem('showGlobal') ?? 'false')
  );

  const columns: Column<Vulnerability>[] = [
    {
      Header: 'Title',
      accessor: 'title',
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Domain',
      id: 'domain',
      accessor: ({ domain }) => (
        <Link to={`/domain/${domain.id}`}>{domain?.name}</Link>
      ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Severity',
      id: 'severity',
      accessor: ({ severity }) => severity,
      width: 100,
      Filter: selectFilter(['Low', 'Medium', 'High', 'Critical', 'None'])
    },
    {
      Header: 'Created',
      id: 'createdAt',
      accessor: ({ createdAt }) =>
        `${formatDistanceToNow(parseISO(createdAt))} ago`,
      width: 250,
      disableFilters: true
    },
    {
      Header: 'State',
      id: 'state',
      width: 100,
      maxWidth: 200,
      accessor: 'state',
      Filter: selectFilter(['open', 'closed']),
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <Dropdown
          id="state-dropdown"
          name="state-dropdown"
          onChange={(e) => {
            setVulnerabilityState(row.index, e.target.value);
          }}
          value={row.original.substate}
          style={{ display: 'inline-block', width: '200px' }}
        >
          <option value="unconfirmed">Open (Unconfirmed)</option>
          <option value="exploitable">Open (Exploitable)</option>
          <option value="false-positive">Closed (False Positive)</option>
          <option value="accepted-risk">Closed (Accepted Risk)</option>
          <option value="remediated">Closed (Remediated)</option>
        </Dropdown>
      )
    },
    {
      Header: 'Details',
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <span
          {...row.getToggleRowExpandedProps()}
          className="text-center display-block"
        >
          {row.isExpanded ? <FaMinus /> : <FaPlus />}
        </span>
      ),
      disableFilters: true
    }
  ];

  const setVulnerabilityState = async (index: number, state: string) => {
    try {
      const res = await apiPut<Vulnerability>(
        '/vulnerabilities/' + vulnerabilities[index].id,
        {
          body: {
            substate: state
          }
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
  };

  const updateShowAll = (state: boolean) => {
    setShowAll(state);
    localStorage.setItem('showGlobal', JSON.stringify(state));
  };

  const vulnerabilitiesSearch = useCallback(
    async (
      filters: Filters<Vulnerability>,
      sort: SortingRule<Vulnerability>[],
      page: number,
      pageSize: number = 25
    ): Promise<ApiResponse | undefined> => {
      try {
        const tableFilters = filters
          .filter((f) => Boolean(f.value))
          .reduce(
            (accum, next) => ({
              ...accum,
              [next.id]: next.value
            }),
            {}
          );
        console.log(filters);
        return await apiPost<ApiResponse>('/vulnerabilities/search', {
          body: {
            page,
            sort: sort[0]?.id ?? 'createdAt',
            order: sort[0]?.desc ? 'DESC' : 'ASC',
            filters: {
              ...tableFilters,
              organization: showAll ? undefined : currentOrganization?.id
            },
            pageSize
          }
        });
      } catch (e) {
        console.error(e);
        return;
      }
    },
    [apiPost, currentOrganization, showAll]
  );

  const fetchVulnerabilities = useCallback(
    async (query: Query<Vulnerability>) => {
      const resp = await vulnerabilitiesSearch(
        query.filters,
        query.sort,
        query.page
      );
      if (!resp) return;
      const { result, count } = resp;
      setVulnerabilities(result);
      setPageCount(Math.ceil(count / 25));
    },
    [vulnerabilitiesSearch]
  );

  const fetchVulnerabilitiesExport = async (): Promise<any[]> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    if (!sortBy || !filters) return [];

    let allVulns: Vulnerability[] = [];
    let page = 0;
    while (true) {
      page += 1;
      const { count, result } = await vulnerabilitiesSearch(filters, sortBy, page, 100) as ApiResponse;
      allVulns = allVulns.concat(result || []);
      if (count <= page * 100) break;
    }
    return allVulns.map((vuln) => ({
      ...vuln,
      domain: vuln.domain.name
    }));
  };

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator table={table} />
  );

  return (
    <div className={classes.root}>
      <Grid row>
        <Grid tablet={{ col: true }}>
          <h1>
            Vulnerabilities
            {showAll
              ? ' - Global'
              : currentOrganization
              ? ' - ' + currentOrganization.name
              : ''}
          </h1>
        </Grid>
        <Grid style={{ float: 'right' }}>
          {((user?.roles && user.roles.length > 1) ||
            user?.userType === 'globalView' ||
            user?.userType === 'globalAdmin') && (
            <Checkbox
              id="showAll"
              name="showAll"
              label="Show all organizations"
              checked={showAll}
              onChange={(e) => updateShowAll(e.target.checked)}
              className={classes.showAll}
            />
          )}
        </Grid>
      </Grid>
      <Table<Vulnerability>
        renderPagination={renderPagination}
        columns={columns}
        data={vulnerabilities}
        pageCount={pageCount}
        fetchData={fetchVulnerabilities}
        renderExpanded={renderExpandedVulnerability}
        tableRef={tableRef}
        initialFilterBy={[{ id: 'state', value: 'open' }]}
      />
      <Export<Vulnerability>
        name="vulnerabilities"
        fieldsToExport={[
          'domain',
          'title',
          'cve',
          'cwe',
          'cpe',
          'description',
          'cvss',
          'severity',
          'state',
          'lastSeen',
          'createdAt',
          'id'
        ]}
        getDataToExport={fetchVulnerabilitiesExport}
      />
    </div>
  );
};

export default Vulnerabilities;
