import { styled } from '@mui/material/styles';
import { ContextType } from 'context/SearchProvider';
import { SavedSearch } from 'types';

const PREFIX = 'SortBar';

interface Props {
  sortField: ContextType['sortField'];
  sortDirection?: ContextType['sortDirection'];
  setSort: ContextType['setSort'];
  saveSearch?(): void;
  isFixed: boolean;
  existingSavedSearch?: SavedSearch;
  children?: React.ReactNode;
}

export const classes = {
  root: `${PREFIX}-root`,
  sortMenu: `${PREFIX}-sortMenu`,
  toggleDirection: `${PREFIX}-toggleDirection`,
  openFields: `${PREFIX}-openFields`,
  selectInp: `${PREFIX}-selectInp`,
  option: `${PREFIX}-option`
};

export const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
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

  [`& .${classes.sortMenu}`]: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    '& > span': {
      display: 'block'
    }
  },

  [`& .${classes.toggleDirection}`]: {
    '& > svg': {
      display: 'block',
      fontSize: '1rem',
      fontWeight: 600,
      color: '#71767A'
    }
  },

  [`& .${classes.openFields}`]: {
    minWidth: 120,
    marginLeft: '0.5rem',
    '& :focus': {
      background: 'none'
    }
  },

  [`& .${classes.selectInp}`]: {
    fontWeight: 600,
    fontSize: 14,
    padding: 0,
    color: '#71767A'
  },

  [`& .${classes.option}`]: {
    fontWeight: 600,
    fontSize: 14,
    color: '#71767A'
  }
}));
