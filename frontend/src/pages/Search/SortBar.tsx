import React from 'react';
import { Select, FormControl, MenuItem, SelectProps } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ContextType } from '../../context/SearchProvider';
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

  const classes = useStyles(props);

  const toggleDirection = () => {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const onSetSortField: SelectProps['onChange'] = (e) => {
    setSort(e.target.value as string, 'asc');
  };

  return (
    <div className={classes.root}>
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
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    zIndex: 100,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.2rem 1rem 0.5rem 1rem',
    color: '#71767A',
    margin: '0.5rem 0',
    boxShadow: ({ isFixed }: Props) =>
      isFixed ? '0px 1px 2px rgba(0, 0, 0, 0.15)' : 'none',
    transition: 'box-shadow 0.3s linear',
    '& button': {
      outline: 'none',
      border: 'none',
      color: '#71767A',
      background: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    '& *:focus': {
      outline: 'none !important'
    },
    fontSize: 14
  },
  sortMenu: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    '& > span': {
      display: 'block'
    }
  },
  toggleDirection: {
    '& > svg': {
      display: 'block',
      fontSize: '1rem',
      fontWeight: 600,
      color: '#71767A'
    }
  },
  openFields: {
    minWidth: 120,
    marginLeft: '0.5rem',
    '& :focus': {
      background: 'none'
    }
  },
  selectInp: {
    fontWeight: 600,
    fontSize: 14,
    padding: 0,
    color: '#71767A'
  },
  option: {
    fontWeight: 600,
    fontSize: 14,
    color: '#71767A'
  }
}));
