import React from 'react';
import {
  makeStyles,
  Select,
  FormControl,
  MenuItem,
  SelectProps
} from '@material-ui/core';
import { ArrowUpward, ArrowDownward } from '@material-ui/icons';
import { ContextType } from '../../context/SearchProvider';

interface Props {
  sortField: ContextType['sortField'];
  sortDirection?: ContextType['sortDirection'];
  setSort: ContextType['setSort'];
  clearFilters?(): void;
  isFixed: boolean;
}

export const SortBar: React.FC<Props> = (props) => {
  const { sortField, sortDirection, setSort, clearFilters, children } = props;
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
            classes={{ root: classes.selectInp }}
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
        {clearFilters && (
          <button onClick={clearFilters}>Clear All Filters</button>
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
      cursor: 'pointer'
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
