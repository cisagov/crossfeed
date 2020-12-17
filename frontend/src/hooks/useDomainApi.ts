import { Query, Domain } from 'types';
import { useAuthContext } from 'context';
import { useCallback } from 'react';

export interface DomainQuery extends Query<Domain> {
  showAll?: boolean;
}

interface ApiResponse {
  result: Domain[];
  count: number;
  url?: string;
}

const PAGE_SIZE = 25;

export const useDomainApi = (showAll?: boolean) => {
  const { currentOrganization, apiPost, apiGet } = useAuthContext();
  const orgId = currentOrganization?.id;

  const listDomains = useCallback(
    async (query: DomainQuery, doExport = false) => {
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

      const { result, count, url } = await apiPost<ApiResponse>(doExport ? '/domain/export': '/domain/search', {
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
        url,
        pageCount: Math.ceil(count / pageSize)
      };
    },
    [orgId, apiPost, showAll]
  );

  const getDomain = useCallback(
    async (domainId: string) => {
      const {result, webdirectories} = await apiGet<{
        result : Domain;
        webdirectories : string[]
      }>(`/domain/${domainId}`);
      return {
        result,
        webdirectories
      }
    },
    [apiGet]
  );

  return {
    listDomains,
    getDomain
  };
};
