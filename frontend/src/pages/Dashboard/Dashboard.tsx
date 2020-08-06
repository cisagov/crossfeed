import React, { useCallback, useState, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { Query, Organization } from 'types';
import { Table, Paginator, Export } from 'components';
import { Domain } from 'types';
import { createColumns } from './columns';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { useHistory } from 'react-router-dom';
import { parse } from 'query-string';
import { Dropdown } from '@trussworks/react-uswds';

interface ApiResponse {
  result: Domain[];
  count: number;
}

export const Dashboard: React.FC = () => {
  const {
    user,
    refreshUser,
    setOrganization,
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
  const [filteredOrganizationId, setFilteredOrganizationId] = useState<string>(currentOrganization?.id || "All");
  const columns = useMemo(() => createColumns(), []);
  const PAGE_SIZE = 25;
  const history = useHistory();

  const doDomainQuery = useCallback(async ({
    q,
    pageSize = PAGE_SIZE,
  }: {
    q: Query<Domain>;
    pageSize?: number;
  }) => {
    const { page, sort, filters } = q;
    const tableFilters = filters
    .filter(f => Boolean(f.value))
    .reduce(
      (accum, next) => ({
        ...accum,
        [next.id]: next.value
      }),
      {}
    );
    return apiPost<ApiResponse>('/domain/search', {
      body: {
        pageSize,
        page,
        sort: sort[0]?.id ?? 'name',
        order: sort[0]?.desc ? 'DESC' : 'ASC',
        filters: {
          ...tableFilters,
          organization: (filteredOrganizationId === "All" ? undefined : filteredOrganizationId)
        }
      }
    });
  }, [filteredOrganizationId]);

  const fetchDomains = useCallback(
    async (q: Query<Domain>) => {
      if (!user) {
        return;
      }
      try {
        const { result, count } = await doDomainQuery({ q });
        setQuery(q);
        setDomains(result);
        setCount(count);
        setPageCount(Math.ceil(count / PAGE_SIZE));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost, user]
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
        fetchDomains({
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
  }, [apiPost, history, login, user, fetchDomains, refreshUser]);

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
      {user?.roles && user.roles.length > 0 && <Dropdown
          id="organization"
          name="organization"
          className={classes.textField}
          onChange={e => {
            setFilteredOrganizationId(e.target.value);
          }}
          value={filteredOrganizationId}
        >
          <option key={"All"} value={"All"}>
            All
          </option>
          {user?.roles.map(role => {
            return (
              <option key={role.organization?.id} value={role.organization?.id}>
                {role.organization?.name}
              </option>
            );
          })}
        </Dropdown>}
      <Table<Domain>
        renderPagination={renderPagination}
        columns={columns}
        data={domains}
        pageCount={pageCount}
        fetchData={fetchDomains}
        count={count}
        pageSize={PAGE_SIZE}
        key={"domain-table-org-" + filteredOrganizationId}
      />
      <Export<Domain>
        name="domains"
        fieldsToExport={[
          'name',
          'id',
          'services',
          'country',
          'asn',
          'cloudHosted',
          'updatedAt'
        ]}
        getDataToExport={async () => {
          // TODO: export the user's actual filtered data.
          const { result } = await doDomainQuery({ q: query, pageSize: -1 });
          return result.map(domain => ({
            ...domain,
            services: domain.services.map(service => service.service) as any
          }));
        }}
      />
    </div>
  );
};
