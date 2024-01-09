import { styled } from '@mui/material/styles';
import { Dialog } from '@mui/material';

const PREFIX = 'RegisterForm';

export const classes = {
  chip: `${PREFIX}-chip`,
  headerRow: `${PREFIX}-headerRow`
};

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  [`& .${classes.chip}`]: {
    backgroundColor: '#C4C4C4',
    color: 'white',
    marginRight: '10px'
  },

  [`& .${classes.headerRow}`]: {
    padding: '0.5rem 0',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    flexWrap: 'wrap',
    '& label': {
      flex: '1 0 100%',
      fontWeight: 'bolder',
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 0',
      '@media screen and (min-width: 640px)': {
        flex: '0 0 220px',
        padding: 0
      }
    },
    '& span': {
      display: 'block',
      flex: '1 1 auto',
      marginLeft: 'calc(1rem + 20px)',
      '@media screen and (min-width: 640px)': {
        marginLeft: 'calc(1rem + 20px)'
      },
      '@media screen and (min-width: 1024px)': {
        marginLeft: 0
      }
    }
  }
}));
