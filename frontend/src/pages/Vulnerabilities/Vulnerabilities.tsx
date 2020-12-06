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
import { Dropdown, Button } from '@trussworks/react-uswds';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { FaExternalLinkAlt } from 'react-icons/fa';
import {
  TextareaAutosize,
  List,
  ListItem,
  ListItemText,
  makeStyles
} from '@material-ui/core';
import ReactMarkdown from 'react-markdown';
import { Subnav } from 'components';
import { parse } from 'query-string';
import { getSeverityColor } from 'pages/Risk/Risk';

export interface ApiResponse {
  result: Vulnerability[];
  count: number;
  url?: string;
}

const formatDate = (date: string) => {
  return format(parseISO(date), 'MM-dd-yyyy');
};

const extLink = <FaExternalLinkAlt style={{ width: 12 }}></FaExternalLinkAlt>;

const PAGE_SIZE = 15;

export const stateMap: { [key: string]: string } = {
  unconfirmed: 'Unconfirmed',
  exploitable: 'Exploitable',
  'false-positive': 'False Positive',
  'accepted-risk': 'Accepted Risk',
  remediated: 'Remediated'
};

export const Vulnerabilities: React.FC = () => {
  const {
    currentOrganization,
    apiPost,
    apiPut,
    showAllOrganizations
  } = useAuthContext();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const tableRef = useRef<TableInstance<Vulnerability>>(null);
  const listClasses = useStyles();
  const [noResults, setNoResults] = useState(false);

  const columns: Column<Vulnerability>[] = [
    {
      Header: 'Vulnerability',
      accessor: 'title',
      Cell: ({ value, row }: CellProps<Vulnerability>) =>
        row.original.cve ? (
          <a
            href={`https://nvd.nist.gov/vuln/detail/${row.original.cve}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value} {extLink}
          </a>
        ) : (
          <p>{row.original.title}</p>
        ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Severity',
      id: 'severity',
      accessor: ({ severity, substate }) => (
        <span
          style={{
            borderBottom: `6px solid ${getSeverityColor({
              id: severity ?? ''
            })}`,
            width: '80px'
          }}
          className={substate === 'unconfirmed' ? classes.severity : undefined}
        >
          {severity}
        </span>
      ),
      width: 100,
      Filter: selectFilter(['Low', 'Medium', 'High', 'Critical', 'None'])
    },
    {
      Header: 'Domain',
      id: 'domain',
      accessor: ({ domain }) => (
        <Link to={`/inventory/domain/${domain.id}`}>{domain?.name}</Link>
      ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Product',
      id: 'cpe',
      accessor: ({ cpe, service }) => {
        const product =
          service &&
          service.products.find(
            (product) => cpe && product.cpe && cpe.includes(product.cpe)
          );
        if (product)
          return product.name + (product.version ? ' ' + product.version : '');
        else return cpe;
      },
      width: 100,
      Filter: ColumnFilter
    },
    {
      Header: 'Days Open',
      id: 'createdAt',
      accessor: ({ createdAt, actions }) => {
        // Calculates the total number of days a vulnerability has been open
        let daysOpen = 0;
        let lastOpenDate = createdAt;
        let lastState = 'open';
        actions.reverse();
        for (const action of actions) {
          if (action.state === 'closed' && lastState === 'open') {
            daysOpen += differenceInCalendarDays(
              parseISO(action.date),
              parseISO(lastOpenDate)
            );
            lastState = 'closed';
          } else if (action.state === 'open' && lastState === 'closed') {
            lastOpenDate = action.date;
            lastState = 'open';
          }
        }
        if (lastState === 'open') {
          daysOpen += differenceInCalendarDays(
            new Date(),
            parseISO(lastOpenDate)
          );
        }
        return daysOpen;
      },
      disableFilters: true
    },
    {
      Header: 'Status',
      id: 'state',
      width: 100,
      maxWidth: 200,
      accessor: 'state',
      Filter: selectFilter([
        'open',
        'open (unconfirmed)',
        'open (exploitable)',
        'closed',
        'closed (false positive)',
        'closed (accepted risk)',
        'closed (remediated)'
      ]),
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <Dropdown
          id="state-dropdown"
          name="state-dropdown"
          onChange={(e) => {
            updateVulnerability(row.index, {
              substate: e.target.value
            });
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
          style={{
            fontSize: '14px',
            cursor: 'pointer',
            color: '#484D51'
          }}
        >
          {row.isExpanded ? 'HIDE DETAILS' : 'DETAILS'}
        </span>
      ),
      disableFilters: true
    }
  ];

  const updateVulnerability = async (
    index: number,
    body: { [key: string]: string }
  ) => {
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
  };

  const comments: { [key: string]: string } = {};

  const renderExpandedVulnerability = (row: Row<Vulnerability>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        <h3>Details</h3>
        <div className={classes.desc}>
          <p>{original.description}</p>
          <h4>References</h4>
          {original.references &&
            original.references.map((ref, index) => (
              <p key={index}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                  {ref.url} {extLink}
                </a>
                {ref.tags.length > 0 ? ' - ' + ref.tags.join(',') : ''}
              </p>
            ))}
          <h4>Vulnerability history</h4>
          <List className={`${listClasses.listRoot}`}>
            {original.actions &&
              original.actions.map((action, index) => {
                let primary: JSX.Element = <></>;
                let secondary: JSX.Element = <></>;
                if (action.type === 'state-change' && action.substate) {
                  const val = action.automatic ? (
                    <>
                      State automatically changed to{' '}
                      {stateMap[action.substate].toLowerCase()}
                    </>
                  ) : (
                    <>
                      State changed to {action.state} (
                      {stateMap[action.substate].toLowerCase()}) by{' '}
                      {action.userName}
                    </>
                  );
                  primary = (
                    <>
                      {val} on {formatDate(action.date)}
                    </>
                  );
                } else if (action.type === 'comment' && action.value) {
                  primary = (
                    <ReactMarkdown source={action.value} linkTarget="_blank" />
                  );
                  secondary = <>{action.userName}</>;
                }
                return (
                  <ListItem button divider={true} key={index}>
                    <ListItemText
                      primary={primary}
                      secondary={secondary}
                    ></ListItemText>
                  </ListItem>
                );
              })}
            <ListItem button divider={true} key="initial">
              <ListItemText
                primary={'Opened on ' + formatDate(original.createdAt)}
              ></ListItemText>
            </ListItem>
          </List>

          <TextareaAutosize
            style={{ width: 300, padding: 10 }}
            rowsMin={2}
            placeholder="Leave a Comment"
            onChange={(e) => (comments[original.id] = e.target.value)}
          />
          <br></br>
          <Button
            type="button"
            style={{ width: 150 }}
            outline
            onClick={() => {
              updateVulnerability(row.index, {
                comment: comments[original.id]
              });
            }}
          >
            Comment
          </Button>
        </div>
      </div>
    );
  };

  const vulnerabilitiesSearch = useCallback(
    async (
      filters: Filters<Vulnerability>,
      sort: SortingRule<Vulnerability>[],
      page: number,
      pageSize: number = PAGE_SIZE,
      doExport = false
    ): Promise<ApiResponse | undefined> => {
      try {
        const tableFilters: {
          [key: string]: string | undefined;
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
          !['open', 'closed'].includes(tableFilters['state'])
        ) {
          const substate = tableFilters['state']!.match(/\((.*)\)/)?.pop();
          if (substate)
            tableFilters['substate'] = substate.toLowerCase().replace(' ', '-');
          delete tableFilters['state'];
        }
        return await apiPost<ApiResponse>(
          doExport ? '/vulnerabilities/export' : '/vulnerabilities/search',
          {
            body: {
              page,
              sort: sort[0]?.id ?? 'createdAt',
              order: sort[0]?.desc ? 'DESC' : 'ASC',
              filters: {
                ...tableFilters,
                organization: showAllOrganizations
                  ? undefined
                  : currentOrganization?.id
              },
              pageSize
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
      const resp = await vulnerabilitiesSearch(
        query.filters,
        query.sort,
        query.page
      );
      if (!resp) return;
      const { result, count } = resp;
      setVulnerabilities(result);
      setTotalResults(count);
      setNoResults(count === 0);
    },
    [vulnerabilitiesSearch]
  );

  const fetchVulnerabilitiesExport = async (): Promise<string> => {
    const { sortBy, filters } = tableRef.current?.state ?? {};
    const { url } = (await vulnerabilitiesSearch(
      filters!,
      sortBy!,
      1,
      -1,
      true
    )) as ApiResponse;
    return url!;
  };

  const renderPagination = (table: TableInstance<Vulnerability>) => (
    <Paginator table={table} totalResults={totalResults} />
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
            { title: 'Assets', path: '/inventory', exact: true },
            { title: 'Domains', path: '/inventory/domains' },
            { title: 'Vulnerabilities', path: '/inventory/vulnerabilities' }
          ]}
        ></Subnav>
        <div className={classes.root}>
          <Table<Vulnerability>
            renderPagination={renderPagination}
            columns={columns}
            data={vulnerabilities}
            pageCount={Math.ceil(totalResults / PAGE_SIZE)}
            fetchData={fetchVulnerabilities}
            renderExpanded={renderExpandedVulnerability}
            tableRef={tableRef}
            initialFilterBy={initialFilterBy}
            initialSortBy={initialSortBy}
            noResults={noResults}
            pageSize={PAGE_SIZE}
            noResultsMessage={
              "We don't see any vulnerabilities that match these criteria."
            }
          />
          {/* <Export<Vulnerability>
            name="vulnerabilities"
            getDataToExport={fetchVulnerabilitiesExport}
          /> */}
        </div>
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  listRoot: {
    width: '100%',
    backgroundColor: theme.palette.background.paper
  },
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
