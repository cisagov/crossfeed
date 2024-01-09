import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';
import { Result } from 'context/SearchProvider';

const PREFIX = 'ResultCard';
// Sync this with the backend client in es-client.ts.
export interface WebpageRecord {
  webpage_id: string;
  webpage_createdAt: Date;
  webpage_updatedAt: Date;
  webpage_syncedAt: Date;
  webpage_lastSeen: Date;
  webpage_s3Key: string;
  webpage_url: string;
  webpage_status: string | number;
  webpage_domainId: string;
  webpage_discoveredById: string;

  // Added before elasticsearch insertion (not present in the database):
  suggest?: { input: string | string[]; weight: number }[];
  parent_join?: {
    name: 'webpage';
    parent: string;
  };
  webpage_body?: string;
}

interface Highlight {
  webpage_body: string[];
}

interface Props extends Result {
  onDomainSelected(domainId: string): void;
  selected?: boolean;
  inner_hits?: {
    webpage?: {
      hits: {
        hits: { _source: WebpageRecord; highlight: Highlight }[];
        max_score: number;
        total: {
          value: number;
          relation: string;
        };
      };
    };
  };
}
export const classes = {
  root: `${PREFIX}-root`,
  inner: `${PREFIX}-inner`,
  domainRow: `${PREFIX}-domainRow`,
  ipRow: `${PREFIX}-ipRow`,
  row: `${PREFIX}-row`,
  label: `${PREFIX}-label`,
  count: `${PREFIX}-count`,
  data: `${PREFIX}-data`,
  lastSeen: `${PREFIX}-lastSeen`,
  expandMore: `${PREFIX}-expandMore`
};

export const StyledPaper = styled(Paper)(({ theme }) => ({
  [`& .${classes.root}`]: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: ({ selected }: Props) =>
      selected
        ? `2px solid ${theme.palette.primary.main}`
        : '2px solid #DCDEE0',
    boxShadow: ({ selected }: Props) =>
      selected ? '0px 1px 6px rgba(0, 0, 0, 0.25)' : 'none',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    }
  },

  [`& .${classes.inner}`]: {
    padding: '1.5rem',
    paddingTop: '0.875rem',
    cursor: 'pointer'
  },

  [`& .${classes.domainRow}`]: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#28A0CB',
    outline: 'none',
    background: 'none',
    border: 'none',
    padding: '0.5rem 0',

    '&:focus': {
      outline: 'none !important'
    },
    '& h4': {
      fontWeight: 400,
      cursor: 'pointer',
      display: 'block',
      fontSize: '1.9rem',
      color: '#07648D',
      margin: 0,
      textAlign: 'left',
      wordBreak: 'break-all',
      paddingRight: '1rem'
    }
  },

  [`& .${classes.ipRow}`]: {
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  [`& .${classes.row}`]: {
    padding: '0.5rem 0',
    margin: 0
  },

  [`& .${classes.label}`]: {
    fontSize: '0.8rem',
    color: '#71767A',
    display: 'block'
  },

  [`& .${classes.count}`]: {
    color: theme.palette.error.light
  },

  [`& .${classes.data}`]: {
    display: 'block',
    color: '#3D4551'
  },

  [`& .${classes.lastSeen}`]: {
    display: 'block',
    textAlign: 'right'
  },

  [`& .${classes.expandMore}`]: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  }
}));
