import { makeStyles } from '@mui/material';

export const useRiskStyles = makeStyles((theme) => ({
  cardRoot: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '2px solid #DCDEE0',
    boxShadow: 'none',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    }
  },
  cardSmall: {
    width: '100%',
    height: '355px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  cardTitle: {
    fontSize: '14px'
  },
  cardColumnHeadings: {
    display: 'flex',
    listStyle: 'none',
    justifyContent: 'space-between',
    margin: 0,
    paddingLeft: 16,
    paddingRight: 128,
    fontSize: 16,
    fontWeight: 'bold'
  },
  chartSmall: {
    height: '85%'
  },
  chartLarge: {
    height: '85.5%',
    width: '90%'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    '& h5': {
      paddingLeft: 190,
      color: '#71767A',
      margin: '10px 0 0 0',
      fontSize: 14
    }
  },
  cardBig: {
    width: '100%',
    height: '889px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  body: {
    padding: '20px 30px'
  },
  header: {
    height: '60px',
    backgroundColor: '#F8F9FA',
    top: 0,
    width: '100%',
    color: '#07648D',
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingTop: 1
  },
  footer: {
    height: '60px',
    backgroundColor: '#F8F9FA',
    width: '100%',
    color: '#3D4551',
    paddingLeft: 255,
    paddingTop: 20,
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  },
  seeAll: {
    float: 'right',
    marginTop: '5px',
    marginRight: '20px',
    '& h4 a': {
      color: '#71767A',
      fontSize: '12px',
      fontWeight: '400'
    }
  },
  root: {
    position: 'relative',
    flex: '1',
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0',
    overflowY: 'hidden'
  },
  contentWrapper: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden',
    marginTop: '1rem'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1'
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 50%'
  },
  miniCardRoot: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    },
    '&:hover': {
      background: '#FCFCFC',
      boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.15)',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    '&:last-child hr': {
      display: 'none'
    },
    height: 45,
    width: '100%',
    borderRadius: '4px'
  },
  cardInner: {
    paddingLeft: 30,
    paddingRight: 30,
    display: 'flex',
    alignItems: 'center',
    '& div': {
      display: 'inline',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    '& button': {
      justifyContent: 'flex-end'
    },
    height: 45
  },
  miniCardLeft: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-start',
    color: '#3D4551'
  },
  miniCardCenter: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center'
  },
  button: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: '#07648D',
    margin: '0 0.2rem',
    cursor: 'pointer',
    fontSize: '12px'
  },
  underlined: {
    width: '80px',
    fontWeight: 'normal'
  },
  vulnCount: {
    color: '#B51D09',
    flex: 0.5
  },
  chip: {
    color: '#3D4551',
    height: '26px',
    fontSize: '12px',
    textAlign: 'center',
    background: '#FFFFFF',
    border: '1px solid #DCDEE0',
    boxSizing: 'border-box',
    borderRadius: '22px',
    marginRight: '10px',
    '&:hover': {
      background: '#F8DFE2',
      border: '1px solid #D75B57'
    },
    '&:focus': {
      background: '#F8DFE2',
      border: '1px solid #D75B57',
      outline: 0
    },
    '&:default': {
      background: '#F8DFE2',
      border: '1px solid #D75B57',
      outline: 0
    }
  },
  chipWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '5px 10px',
    marginTop: '5px',
    marginLeft: '15px'
  },
  note: {
    font: '12px',
    fontFamily: 'Public Sans',
    margin: '10px 10px 10px 25px',
    fontStyle: 'italic',
    color: '#71767A'
  }
}));

export type RiskStyles = ReturnType<typeof useRiskStyles>;
