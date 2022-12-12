import { Query, Domain, Organization } from 'types';
import { useAuthContext } from 'context';
import { useCallback } from 'react';

export interface OrganizationQuery extends Query<Organization> {
  showAll?: boolean;
}

interface ApiResponse {
  result: Organization[];
  count: number;
  url?: string;
}

const PAGE_SIZE = 25;

export const useOrganizationApi = () => {
  const { apiPost, apiGet } = useAuthContext();
  const listOrganizations = useCallback(
    async (query: OrganizationQuery, doExport = false) => {
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

      const { result, count, url } = await apiPost<ApiResponse>(
        '/organizations/search',
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
        organizations: result,
        count,
        url,
        pageCount: Math.ceil(count / pageSize)
      };
    },
    [apiPost]
  );

  const getOrganization = useCallback(
    async (organizationId: string) => {
      return await apiGet<Domain>(`/organizations/${organizationId}`);
    },
    [apiGet]
  );

  return {
    listOrganizations,
    getOrganization
  };
};
