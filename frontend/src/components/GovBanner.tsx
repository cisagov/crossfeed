import React, { useState } from 'react';
import clsx from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import flagIcon from '../assets/us_flag_small.png';
import govIcon from '../assets/icon-dot-gov.svg';
import httpsIcon from '../assets/icon-https.svg';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f0f0f0',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center'
  },
  inner: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    maxWidth: 1440,
    margin: '0 auto',
    padding: `2px 24px`,
    [theme.breakpoints.down('sm')]: {
      padding: '2px 8px'
    }
  },
  flag: {
    padding: `0 ${theme.spacing()}px`
  },
  textWrap: {
    display: 'flex',
    flexFlow: 'row wrap',
    alignItems: 'center',
    flexGrow: 1,
    [theme.breakpoints.down('xs')]: {
      padding: `5px 0`
    }
  },
  text: {
    flex: '0 1 auto',
    marginRight: theme.spacing(),
    [theme.breakpoints.down('xs')]: {
      flex: '0 0 100%'
    }
  },
  btn: {
    border: 'none',
    background: 'none',
    padding: 0,
    outline: 'none'
  },
  btnExpand: {
    display: 'flex',
    alignItems: 'center',
    color: '#005ea2',
    textDecoration: 'underline'
  },
  infoInner: {
    maxWidth: 800,
    margin: '0 auto',
    lineHeight: 1.5,
    flexFlow: 'row wrap',
    padding: `${theme.spacing(3)}px 16px`
  },
  info: {
    display: 'flex',
    flex: '1 1 50%',
    padding: `${theme.spacing(2)}px ${theme.spacing(2)}px`,
    [theme.breakpoints.down('sm')]: {
      flex: '0 0 100%',
      padding: `${theme.spacing(2)}px 0`
    }
  },
  infoIcon: {
    minWidth: 40
  },
  infoText: {
    fontSize: '0.87rem',
    '& p': {
      margin: `0 ${theme.spacing(2)}px`
    }
  }
}));

export const GovBanner: React.FC = () => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.inner}>
          <img src={flagIcon} alt="usa flag" className={classes.flag} />
          <div className={classes.textWrap}>
            <div className={classes.text}>
              An official website of the United States government
            </div>
            <button
              className={clsx(classes.text, classes.btn, classes.btnExpand)}
              onClick={() => setExpanded(exp => !exp)}
            >
              Here's how you know{' '}
              {expanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className={classes.root}>
          <div className={clsx(classes.inner, classes.infoInner)}>
            <div className={classes.info}>
              <div className={classes.infoIcon}>
                <img src={govIcon} alt="Dot Gov" />
              </div>
              <div className={classes.infoText}>
                <p>
                  <strong>The .gov means it’s official.</strong>
                  <br />
                  Federal government websites often end in .gov or .mil. Before
                  sharing sensitive information, make sure you’re on a federal
                  government site.
                </p>
              </div>
            </div>
            <div className={classes.info}>
              <div className={classes.infoIcon}>
                <img src={httpsIcon} alt="HTTPS" />
              </div>
              <div className={classes.infoText}>
                <p>
                  <strong>This site is secure.</strong>
                  <br />
                  The <strong>https://</strong> ensures that you are connecting
                  to the official website and that any information you provide
                  is encrypted and transmitted securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
