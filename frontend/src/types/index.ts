import { SortingRule, Filters } from 'react-table';
export * from './domain';
export * from './vulnerability';
export * from './scan';
export * from './organization';
export * from './user';
export * from './role';
export * from './scan-task';
export * from './saved-search';
export * from './report';

export interface Query<T extends object> {
  sort: SortingRule<T>[];
  page: number;
  filters: Filters<T>;
  pageSize?: number;
}
