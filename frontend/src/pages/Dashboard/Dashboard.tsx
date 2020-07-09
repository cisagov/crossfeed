import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { Query } from 'types';
import { Table, Paginator } from 'components';
import { Domain } from 'types';
import { createColumns } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { useHistory } from 'react-router-dom';
import { parse } from 'query-string';

interface Errors extends Partial<FormData> {
  global?: string;
}

interface ApiResponse {
  result: Domain[];
  count: number;
}

export const Dashboard: React.FC = () => {
  const { user, login, apiPost } = useAuthContext();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const columns = useMemo(() => createColumns(), []);
  const PAGE_SIZE = 25;
  const history = useHistory();
  const [errors, setErrors] = useState<Errors>({});

  // Called to sign in the user
  const callback = async () => {
    const parsed = parse(window.location.search);
    if (!parsed.state || !parsed.code) {
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

      login(token, user);
      if (user.firstName !== '') {
        history.push('/');
      } else {
        history.push('/create-account');
      }
    } catch {
      history.push('/');
    }
  };

  React.useEffect(() => {
    if (user && user.firstName === '') {
      history.push('/create-account');
    }
    callback();
  }, []);

  const fetchDomains = useCallback(
    async (query: Query<Domain>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>('/domain/search', {
          body: {
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
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<Domain>) => (
    <Paginator table={table} />
  );

  return (
    <div className={classes.root}>
      <h1>Dashboard</h1>{' '}
      {errors.global && <p className="text-error">{errors.global}</p>}
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomains}
        count={count}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};
