import React from 'react';
import { classes, Root } from './Styling/sortBarStyle';
import { Select, FormControl, MenuItem, SelectProps } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ContextType } from 'context/SearchProvider';
import { SavedSearch } from 'types';

interface Props {
  sortField: ContextType['sortField'];
  sortDirection?: ContextType['sortDirection'];
  setSort: ContextType['setSort'];
  saveSearch?(): void;
  isFixed: boolean;
  existingSavedSearch?: SavedSearch;
  children?: React.ReactNode;
}

export const SortBar: React.FC<Props> = (props) => {
  const {
    sortField,
    sortDirection,
    setSort,
    saveSearch,
    children,
    existingSavedSearch
  } = props;

  const toggleDirection = () => {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const onSetSortField: SelectProps['onChange'] = (e) => {
    setSort(e.target.value as string, 'asc');
  };

  return (
    <Root className={classes.root}>
      <div className={classes.sortMenu}>
        <button className={classes.toggleDirection} onClick={toggleDirection}>
          {!sortDirection || sortDirection === 'desc' ? (
            <ArrowDownward />
          ) : (
            <ArrowUpward />
          )}
        </button>
        <span id="sort-by-label">Sort by: </span>
        <FormControl className={classes.openFields}>
          <Select
            disableUnderline
            labelId="sort-by-label"
            value={sortField}
            onChange={onSetSortField}
            classes={{ select: classes.selectInp }}
          >
            <MenuItem classes={{ root: classes.option }} value="name">
              Domain Name
            </MenuItem>
            <MenuItem classes={{ root: classes.option }} value="ip">
              IP
            </MenuItem>
            <MenuItem classes={{ root: classes.option }} value="updatedAt">
              Last Seen
            </MenuItem>
            <MenuItem classes={{ root: classes.option }} value="createdAt">
              First Seen
            </MenuItem>
          </Select>
        </FormControl>
      </div>
      {children}
      <div>
        {saveSearch && (
          <button onClick={saveSearch}>
            {existingSavedSearch ? 'Update Saved Search' : 'Save Search'}
          </button>
        )}
      </div>
    </Root>
  );
};
