import React, { useCallback, useState } from 'react';
import { TableInstance, Column, CellProps, Row } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, ColumnFilter, selectFilter } from 'components';
import { ScanTask } from 'types';
import { useAuthContext } from 'context';
import { formatDistanceToNow, parseISO } from 'date-fns';
import classes from './Scans.module.scss';
import { FaMinus, FaPlus, FaSyncAlt } from 'react-icons/fa';
import { LazyLog } from 'react-lazylog';
import { Button } from '@trussworks/react-uswds';

interface ApiResponse {
  result: ScanTask[];
  count: number;
}

interface Errors {
  global?: string;
}

const dateAccessor = (date?: string) => {
  return !date || new Date(date).getTime() === new Date(0).getTime()
    ? 'None'
    : `${formatDistanceToNow(parseISO(date))} ago`;
};

const Log = ({ url, token }: { url: string; token: string }) => {
  const [logKey, setLogKey] = useState(0);
  return (
    <div className={classes.logContainer}>
      <LazyLog
        key={'lazylog-' + logKey}
        follow={true}
        extraLines={1}
        enableSearch
        url={url}
        caseInsensitive
        fetchOptions={{ headers: { Authorization: token } }}
        selectableLines={true}
      />
      <Button
        type="button"
        outline
        size="small"
        onClick={() => setLogKey(Math.random())}
      >
        <FaSyncAlt />
      </Button>
    </div>
  );
};

export const ScanTasksView: React.FC = () => {
  const { apiPost, token } = useAuthContext();
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  const killScanTask = async (index: number) => {
    try {
      const row = scanTasks[index];
      await apiPost(`/scan-tasks/${row.id}/kill`, { body: {} });
      setScanTasks(
        Object.assign([], scanTasks, {
          [index]: {
            ...row,
            status: 'failed'
          }
        })
      );
    } catch (e) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to kill scan' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const renderExpanded = (row: Row<ScanTask>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        {original.fargateTaskArn && (
          <>
            <h4>
              Logs
              {original.fargateTaskArn?.match('.*/(.*)') && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/${process
                    .env
                    .REACT_APP_FARGATE_LOG_GROUP!}/log-events/worker$252Fmain$252F${
                    (original.fargateTaskArn.match('.*/(.*)') || [])[1]
                  }`}
                >
                  {' '}
                  (View all on CloudWatch)
                </a>
              )}
            </h4>

            <Log
              token={token ?? ''}
              url={`${process.env.REACT_APP_API_URL}/scan-tasks/${original.id}/logs`}
            />
          </>
        )}

        <h4>Input</h4>
        <small>
          <pre>{JSON.stringify(JSON.parse(original.input), null, 2)}</pre>
        </small>
        <h4>Output</h4>
        <small>
          <pre>{original.output || 'None'}</pre>
        </small>

        {row.original.status !== 'finished' &&
          row.original.status !== 'failed' && (
            <>
              <h4>Actions</h4>
              <a
                href="# "
                onClick={(e) => {
                  e.preventDefault();
                  killScanTask(row.index);
                }}
              >
                Kill
              </a>
            </>
          )}
      </div>
    );
  };

  const columns: Column<ScanTask>[] = [
    {
      Header: 'ID',
      accessor: 'id',
      Filter: ColumnFilter,
      disableSortBy: true,
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: 'status',
      Filter: selectFilter([
        'created',
        'queued',
        'requested',
        'started',
        'finished',
        'failed'
      ]),
      disableSortBy: true
    },
    {
      Header: 'Name',
      id: 'name',
      accessor: ({ scan }) => scan?.name,
      Filter: selectFilter([
        // TODO: sync this with the SCAN_SCHEMA
        'censys',
        'amass',
        'findomain',
        'portscanner',
        'wappalyzer',
        'censysIpv4',
        'censysCertificates',
        'sslyze',
        'searchSync',
        'cve',
        'dotgov',
        'webscraper',
        'intrigueIdent',
        'shodan',
        'hibp',
        'lookingGlass',
        'dnstwist',
        'peCybersixgill',
        'peHibpSync',
        'peShodan',
        'peDomMasq',
        'rootDomainSync'
      ]),
      disableSortBy: true
    },
    {
      Header: 'Created At',
      id: 'createdAt',
      accessor: ({ createdAt }) => dateAccessor(createdAt),
      disableFilters: true
    },
    {
      Header: 'Finished At',
      id: 'finishedAt',
      accessor: ({ finishedAt }) => dateAccessor(finishedAt),
      disableFilters: true
    },
    {
      Header: 'Details',
      Cell: ({ row }: CellProps<ScanTask>) => (
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
  const PAGE_SIZE = 25;

  const fetchScanTasks = useCallback(
    async (query: Query<ScanTask>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>(
          '/scan-tasks/search',
          {
            body: {
              page,
              sort: sort[0]?.id ?? 'createdAt',
              order: sort[0]?.desc ? 'DESC' : 'ASC',
              filters: filters
                .filter((f) => Boolean(f.value))
                .reduce(
                  (accum, next) => ({
                    ...accum,
                    [next.id]: next.value
                  }),
                  {}
                )
            }
          }
        );
        setScanTasks(result);
        setTotalResults(count);
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<ScanTask>) => (
    <Paginator table={table} totalResults={totalResults} />
  );

  return (
    <>
      {errors.global && <p className={classes.error}>{errors.global}</p>}
      <Table<ScanTask>
        renderPagination={renderPagination}
        columns={columns}
        data={scanTasks}
        pageCount={Math.ceil(totalResults / PAGE_SIZE)}
        fetchData={fetchScanTasks}
        pageSize={PAGE_SIZE}
        initialSortBy={[
          {
            id: 'createdAt',
            desc: true
          }
        ]}
        renderExpanded={renderExpanded}
      />
    </>
  );
};

export default ScanTasksView;
