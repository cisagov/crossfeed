import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';

const Wrapper = Paper;
const PREFIX = 'FilterDrawer';

export const classes = {
  root: `${PREFIX}-root`,
  disabled: `${PREFIX}-disabled`,
  expanded: `${PREFIX}-expanded`,
  root2: `${PREFIX}-root2`,
  content: `${PREFIX}-content`,
  disabled2: `${PREFIX}-disabled2`,
  expanded2: `${PREFIX}-expanded2`,
  root3: `${PREFIX}-root3`,
  header: `${PREFIX}-header`,
  details: `${PREFIX}-details`,
  applied: `${PREFIX}-applied`,
  filter: `${PREFIX}-filter`
};

export const StyledWrapper = styled(Wrapper)(({ theme }) => ({
  [`& .${classes.header}`]: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    padding: '0 1rem',
    minHeight: 60,
    justifyContent: 'space-between',
    '& h3': {
      fontSize: '1.3rem',
      fontWeight: 400,
      margin: 0,
      marginLeft: '1rem'
    },
    '& button': {
      outline: 'none',
      border: 'none',
      color: '#71767A',
      background: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  },
  [`& .${classes.details}`]: {
    paddingTop: 0
    // maxHeight: 250,
    // overflowY: 'auto'
  },
  [`& .${classes.applied}`]: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: theme.palette.grey['500'],
    '& svg': {
      fontSize: '0.7rem',
      color: theme.palette.primary.main,
      marginRight: 3
    }
  },
  [`& .${classes.filter}`]: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    '& > span': {
      display: 'block'
    }
  }
}));
