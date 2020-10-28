import React from 'react';
import {
  Paper,
  FormControl,
  Typography,
  Select,
  MenuItem,
  makeStyles
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';

const Feeds = () => {
  const classes = useStyles();

  let results: any = [{}, {}, {}, {}];
  let totalResults = 10;
  let current = 1;
  let resultsPerPage = 20;
  let totalPages = 10;

  return (
    <div className={classes.root}>
      <div className={classes.contentWrapper}>
        <div className={classes.barWrapper}>
          <div className={classes.barInner}>
            <h2>Feeds</h2>
            <h3>Saved Searches</h3>
          </div>
        </div>
        <div className={classes.content}>
          <div className={classes.panel}>
            {results.map((result: any) => (
              <Paper
                elevation={0}
                classes={{ root: classes.cardRoot }}
                aria-label="view domain details"
              >
                <div className={classes.cardInner}>
                  <button className={classes.domainRow}>
                    <div className={classes.cardAlerts}>
                      <h4>22 new</h4>
                    </div>
                    <div className={classes.cardDetails}>
                      <p>Test</p>
                      <p>Hello</p>
                    </div>
                    <div className={classes.cardActions}>
                      <button className={classes.button}>EDIT</button>
                      <button className={classes.button}>DELETE</button>
                    </div>
                  </button>
                </div>
              </Paper>
            ))}
          </div>
        </div>

        <Paper classes={{ root: classes.pagination }}>
          <span>
            <strong>
              {totalResults === 0 ? 0 : (current - 1) * resultsPerPage + 1} -{' '}
              {Math.min(
                (current - 1) * resultsPerPage + resultsPerPage,
                totalResults
              )}
            </strong>{' '}
            of <strong>{totalResults}</strong>
          </span>
          <Pagination
            count={totalPages}
            page={current}
            // onChange={(_, page) => setCurrent(page)}
            color="primary"
            size="small"
          />
        </Paper>
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
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
    overflowY: 'hidden'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'hidden'
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 100%'
  },
  pagination: {
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
  cardRoot: {
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
  cardInner: {},
  domainRow: {
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
  row: {
    padding: '0.5rem 0',
    margin: 0
  },
  label: {
    fontSize: '0.8rem',
    color: '#71767A',
    display: 'block'
  },
  count: {
    color: theme.palette.error.light
  },
  data: {
    display: 'block',
    color: '#3D4551'
  },
  cardAlerts: {
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
  cardDetails: {
    display: 'block',
    textAlign: 'left',
    width: '50%',
    '& p': {
      color: '#A9AEB1',
      fontWeight: 400,
      fontSize: '1rem',
      wordBreak: 'break-all'
    }
  },
  cardActions: {
    display: 'block',
    textAlign: 'right'
  },
  button: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  },
  barWrapper: {
    zIndex: 101,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '100px',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    boxShadow: ({ inpFocused }: any) =>
      inpFocused ? theme.shadows[4] : theme.shadows[1],
    transition: 'box-shadow 0.3s linear',
    marginBottom: '40px'
  },
  barInner: {
    flex: '1',
    maxWidth: 1400,
    margin: '0 auto',
    background: 'none',
    position: 'relative'
  }
}));

export default Feeds;
