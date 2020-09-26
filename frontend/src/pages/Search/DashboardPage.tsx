import React from 'react';
import { SearchProvider } from './SearchProvider';
import { Dashboard } from './Dashboard';

export const SearchPage: React.FC = () => {
  return (
    <SearchProvider>
      <Dashboard />
    </SearchProvider>
  );
};
