import { styled } from '@mui/material/styles';

const PREFIX = 'DashboardUI';

export const classes = {
  tableRoot: `${PREFIX}-tableRoot`,
  root: `${PREFIX}-root`,
  contentWrapper: `${PREFIX}-contentWrapper`,
  status: `${PREFIX}-status`,
  content: `${PREFIX}-content`,
  panel: `${PREFIX}-panel`,
  pagination: `${PREFIX}-pagination`,
  exportButton: `${PREFIX}-exportButton`,
  pageSize: `${PREFIX}-pageSize`,
  addButton: `${PREFIX}-addButton`
};

export const Root = styled('div')(() => ({
  [`& .${classes.tableRoot}`]: {
    marginTop: '0'
  },

  [`&.${classes.root}`]: {
    position: 'relative',
    flex: '1',
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0',
    overflowY: 'hidden'
  },

  [`& .${classes.contentWrapper}`]: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden'
  },

  [`& .${classes.status}`]: {
    display: 'flex',
    margin: '1rem 0 1rem 1rem',
    fontSize: '1.2rem',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  [`& .${classes.content}`]: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden'
  },

  [`& .${classes.panel}`]: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 50%'
  },

  [`& .${classes.pagination}`]: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    boxShadow: '0px -1px 2px rgba(0, 0, 0, 0.15)',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    },
    borderRadius: 0,
    zIndex: 9
  },

  [`& .${classes.exportButton}`]: {
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  },

  [`& .${classes.pageSize}`]: {
    '& > p': {
      margin: '0 1rem 0 2rem'
    },
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center'
  },

  [`& .${classes.addButton}`]: {
    outline: 'none',
    border: 'none',
    color: '#71767A',
    background: 'none',
    cursor: 'pointer'
  }
}));
