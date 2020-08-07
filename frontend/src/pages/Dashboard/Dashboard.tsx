import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator, Export } from 'components';
import { Domain } from 'types';
import { createColumns, getServiceNames } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { useHistory } from 'react-router-dom';
import { parse } from 'query-string';

interface ApiResponse {
  result: Domain[];
  count: number;
}

export const Dashboard: React.FC = () => {
  const {
    user,
    refreshUser,
    currentOrganization,
    login,
    apiPost
  } = useAuthContext();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [query, setQuery] = useState<Query<Domain>>({
    page: 1,
    sort: [{ id: 'name', desc: true }],
    filters: []
  });

  const columns = useMemo(() => createColumns(), []);
  const PAGE_SIZE = 25;
  const history = useHistory();

  const queryDomains = useCallback(
    async ({
      q,
      pageSize = PAGE_SIZE
    }: {
      q: Query<Domain>;
      pageSize?: number;
    }) => {
      const { page, sort, filters } = q;
      return apiPost<ApiResponse>('/domain/search', {
        body: {
          pageSize,
          page,
          sort: sort[0]?.id ?? 'name',
          order: sort[0]?.desc ? 'DESC' : 'ASC',
          filters: filters
            .filter(f => Boolean(f.value))
            .reduce(
              (accum, next) => ({
                ...accum,
                [next.id]: next.value
              }),
              {}
            )
        }
      });
    },
    [apiPost]
  );

  const fetchDomainTable = useCallback(
    async (q: Query<Domain>) => {
      if (!user) {
        return;
      }
      try {
        const { result, count } = await queryDomains({ q });
        setQuery(q);
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [queryDomains, user]
  );

  // Called to sign in the user
  const callback = useCallback(async () => {
    const parsed = parse(window.location.search);
    if ((user && user.firstName !== '') || !parsed.state || !parsed.code) {
      return;
    }
    try {
      const { token, user } = await apiPost('/auth/callback', {
        body: {
          state: parsed.state,
          code: parsed.code,
          nonce: localStorage.getItem('nonce'),
          origState: localStorage.getItem('state')
        }
      });

      await login(token, user);

      localStorage.removeItem('nonce');
      localStorage.removeItem('state');

      await refreshUser();

      if (user.firstName !== '') {
        history.push('/');
        fetchDomainTable({
          page: 0,
          sort: [],
          filters: []
        });
      } else {
        history.push('/create-account');
      }
    } catch {
      history.push('/');
    }
  }, [apiPost, history, login, user, refreshUser, fetchDomainTable]);

  React.useEffect(() => {
    if (user && user.firstName === '') {
      history.push('/create-account');
    }
    callback();
    // eslint-disable-next-line
  }, []);

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator table={table} />
  );

  return (
    <div className={classes.root}>
      <h1>
        Dashboard{currentOrganization ? ' - ' + currentOrganization.name : ''}
      </h1>{' '}
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomainTable}
        count={count}
        pageSize={PAGE_SIZE}
      />
      <Export<
        | Domain
        | {
            services: string;
          }
      >
        name="domains"
        fieldsToExport={['name', 'ip', 'id', 'ports', 'services', 'updatedAt']}
        getDataToExport={async () => {
          const { result } = await queryDomains({ q: query, pageSize: -1 });
          return result.map(domain => ({
            ...domain,
            ports: domain.services.map(service => service.port).join(','),
            services: getServiceNames(domain)
          }));
        }}
      />
    </div>
  );
};
