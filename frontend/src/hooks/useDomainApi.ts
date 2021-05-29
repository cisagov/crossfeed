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
  const listDomains = useCallback(
    async (query: DomainQuery, doExport = false) => {
      const { page, sort, filters, pageSize = PAGE_SIZE } = query;

      const tableFilters: any = filters
        .filter((f) => Boolean(f.value))
        .reduce(
          (accum, next) => ({
            ...accum,
            [next.id]: next.value
          }),
          {}
        );

      if (!showAll && currentOrganization) {
        if ('rootDomains' in currentOrganization)
          tableFilters['organization'] = currentOrganization.id;
        else tableFilters['tag'] = currentOrganization.id;
      }

      const { result, count, url } = await apiPost<ApiResponse>(
        doExport ? '/domain/export' : '/domain/search',
        {
          body: {
            pageSize,
            page,
            sort: sort[0]?.id ?? 'name',
            order: sort[0]?.desc ? 'DESC' : 'ASC',
            filters: tableFilters
          }
        }
      );

      return {
        domains: result,
        count,
        url,
        pageCount: Math.ceil(count / pageSize)
      };
    },
    [apiPost, showAll, currentOrganization]
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
