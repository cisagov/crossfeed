import { styled } from '@mui/material/styles';

const PREFIX = 'Feeds';

export const classes = {
  root: `${PREFIX}-root`,
  contentWrapper: `${PREFIX}-contentWrapper`,
  content: `${PREFIX}-content`,
  panel: `${PREFIX}-panel`,
  pagination: `${PREFIX}-pagination`,
  cardRoot: `${PREFIX}-cardRoot`,
  cardInner: `${PREFIX}-cardInner`,
  domainRow: `${PREFIX}-domainRow`,
  row: `${PREFIX}-row`,
  label: `${PREFIX}-label`,
  count: `${PREFIX}-count`,
  data: `${PREFIX}-data`,
  cardAlerts: `${PREFIX}-cardAlerts`,
  cardDetails: `${PREFIX}-cardDetails`,
  cardActions: `${PREFIX}-cardActions`,
  button: `${PREFIX}-button`,
  barWrapper: `${PREFIX}-barWrapper`,
  barInner: `${PREFIX}-barInner`
};

export const Root = styled('div')(({ theme }) => ({
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

  [`& .${classes.content}`]: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden',
    marginTop: '2em',
    lineHeight: 1
  },

  [`& .${classes.panel}`]: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 100%'
  },

  [`& .${classes.pagination}`]: {
    height: 'auto',
    flex: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  },

  [`& .${classes.cardRoot}`]: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '2px solid #DCDEE0',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    },
    height: 90,
    borderRadius: '5px'
  },

  [`& .${classes.cardInner}`]: {},

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
    cursor: 'pointer',
    padding: 0
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
    color: theme?.palette?.error?.light
  },

  [`& .${classes.data}`]: {
    display: 'block',
    color: '#3D4551'
  },

  [`& .${classes.cardAlerts}`]: {
    background: '#009BC2',
    boxSizing: 'border-box',
    borderRadius: '5px',
    width: 90,
    height: 86,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& h4': {
      color: 'white',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'break-all'
    }
  },

  [`& .${classes.cardDetails}`]: {
    display: 'block',
    textAlign: 'left',
    width: '50%',
    '& p': {
      color: '#A9AEB1',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'normal'
    }
  },

  [`& .${classes.cardActions}`]: {
    display: 'block',
    textAlign: 'right',
    marginRight: 100
  },

  [`& .${classes.button}`]: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme?.palette?.secondary?.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  },

  [`& .${classes.barWrapper}`]: {
    zIndex: 101,
    width: '100%',
    backgroundColor: theme?.palette?.background?.paper,
    height: '100px',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme?.shadows[4] : theme?.shadows[1],
    transition: 'box-shadow 0.3s linear',
    marginBottom: '40px'
  },

  [`& .${classes.barInner}`]: {
    flex: '1',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  }
}));

export type styles = ReturnType<typeof styled>;
