export interface ContextType {
  addFilter(
    name: string,
    value: string,
    filterType: 'all' | 'any' | 'none'
  ): void;
  clearFilters: any;
  saveSearch: any;
  removeFilter(
    name: string,
    value: string,
    filterType: 'all' | 'any' | 'none'
  ): void;
  setSearchTerm(s: string, opts?: any): void;
  autocompletedResults: any[];
  autocompletedResultsRequestId: string;
  autocompletedSuggestions: any;
  current: number;
  error: string;
  facets: any;
  filters: any[];
  isLoading: boolean;
  pagingEnd: number;
  pagingStart: number;
  requestId: string;
  reset(): void;
  resultSearchTerm: string;
  results: Result[];
  resultsPerPage: number;
  searchTerm: string;
  setCurrent(current: number): void;
  setFilter(): void;
  setResultsPerPage(): void;
  setSort(field: string, direction: 'asc' | 'desc'): void;
  sortDirection: '' | 'asc' | 'desc';
  setResultsPerPage(count: number): void;
  sortField: string;
  totalPages: number;
  totalResults: number;
  wasSearched: boolean;
  noResults: boolean;
}

export interface Result {
  asn: { raw: any };
  cloudHosted: { raw?: boolean };
  country: { raw: any };
  createdAt: { raw: string };
  fromRootDomain: { raw: string };
  id: { raw: string };
  ip: { raw: string };
  name: { raw: string };
  organization: {
    raw: {
      createdAt: string;
      id: string;
      ipBlocks: any[];
      isPassive: boolean;
      name: string;
      rootDomains: string[];
      updatedAt: string;
    };
  };
  reverseName: { raw: string };
  screenshot: { raw: string };
  services: { raw: any[] };
  ssl: { raw: any };
  suggest: { raw: any[] };
  syncedAt: { raw: string };
  updatedAt: { raw: string };
  vulnerabilities: { raw: any[] };
}
