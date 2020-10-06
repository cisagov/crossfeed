import React, { useState } from 'react';
import { makeStyles, Menu, MenuItem } from '@material-ui/core';
import { ArrowUpward, ArrowDownward, ArrowDropDown } from '@material-ui/icons';
import { ContextType } from './SearchProvider';

const fieldToLabel: Record<string, string> = {
  createdAt: 'First Seen',
  updatedAt: 'Last Seen',
  ip: 'IP',
  name: 'Domain Name'
};

interface Props {
  sortField: ContextType['sortField'];
  sortDirection?: ContextType['sortDirection'];
  setSort: ContextType['setSort'];
  clearFilters?(): void;
  isFixed: boolean;
}

export const SortBar: React.FC<Props> = (props) => {
  const { sortField, sortDirection, setSort, clearFilters } = props;
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const classes = useStyles(props);

  const toggleDirection = () => {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(event?.currentTarget);
  };

  const closeMenu = () => {
    setAnchor(null);
  };

  const onSetSortField = (field: string) => () => {
    setSort(field, 'desc');
    closeMenu();
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
        <button
          aria-controls="fieldchoices"
          onClick={openMenu}
          className={classes.openFields}
        >
          <span>Sort by: </span>
          {sortField && (
            <span className={classes.field}>{fieldToLabel[sortField]}</span>
          )}
          <ArrowDropDown />
        </button>
        <Menu
          id="fieldchoices"
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={closeMenu}
        >
          <MenuItem onClick={onSetSortField('name')}>Domain Name</MenuItem>
          <MenuItem onClick={onSetSortField('ip')}>IP</MenuItem>
          <MenuItem onClick={onSetSortField('updatedAt')}>Last Seen</MenuItem>
          <MenuItem onClick={onSetSortField('createdAt')}>First Seen</MenuItem>
        </Menu>
      </div>
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
    padding: '0.5rem 1rem',
    color: '#71767A',
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
    }
  },
  sortMenu: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    '& > span': {
      display: 'block'
    }
  },
  field: {
    fontWeight: 600,
    marginLeft: '0.2rem'
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
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  }
}));
