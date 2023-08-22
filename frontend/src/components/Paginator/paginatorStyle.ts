import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const PREFIX = 'Paginator';

export const classes = {
  pagination: `${PREFIX}-pagination`,
  exportButton: `${PREFIX}-exportButton`
};

export const StyledPaper = styled(Paper)(({ theme }) => ({
  [`& .${classes.pagination}`]: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    },
    width: '100%',
    justifyContent: 'flex-start'
  },

  [`& .${classes.exportButton}`]: {
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  }
}));
