import { Query, Domain } from 'types';
import { useAuthContext } from 'context';
import { useCallback } from 'react';

export interface DomainQuery extends Query<Domain> {
  showAll?: boolean;
}

interface ApiResponse {
  result: Domain[];
  count: number;
}

const PAGE_SIZE = 25;

export const useDomainApi = (showAll?: boolean) => {
  const { currentOrganization, apiPost, apiGet } = useAuthContext();
  const orgId = currentOrganization?.id;

  const listDomains = useCallback(
    async (query: DomainQuery) => {
      const { page, sort, filters, pageSize = PAGE_SIZE } = query;

      const tableFilters = filters
        .filter((f) => Boolean(f.value))
        .reduce(
          (accum, next) => ({
            ...accum,
            [next.id]: next.value
          }),
          {}
        );

      const { result, count } = await apiPost<ApiResponse>('/domain/search', {
        body: {
          pageSize,
          page,
          sort: sort[0]?.id ?? 'name',
          order: sort[0]?.desc ? 'DESC' : 'ASC',
          filters: {
            ...tableFilters,
            organization: showAll ? undefined : orgId
          }
        }
      });

      return {
        domains: result,
        count,
        pageCount: Math.ceil(count / pageSize)
      };
    },
    [orgId, apiPost, showAll]
  );

  const getDomain = useCallback(
    async (domainId: string) => {
      return await apiGet<Domain>(`/domain/${domainId}`);
    },
    [apiGet]
  );

  return {
    listDomains,
    getDomain
  };
};
