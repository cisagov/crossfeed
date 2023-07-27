import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import clsx from 'classnames';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import flagIcon from '../assets/us_flag_small.png';
import govIcon from '../assets/icon-dot-gov.svg';
import httpsIcon from '../assets/icon-https.svg';

const PREFIX = 'GovBanner';

const classes = {
  root: `${PREFIX}-root`,
  inner: `${PREFIX}-inner`,
  flag: `${PREFIX}-flag`,
  textWrap: `${PREFIX}-textWrap`,
  text: `${PREFIX}-text`,
  btn: `${PREFIX}-btn`,
  btnExpand: `${PREFIX}-btnExpand`,
  infoInner: `${PREFIX}-infoInner`,
  info: `${PREFIX}-info`,
  infoIcon: `${PREFIX}-infoIcon`,
  infoText: `${PREFIX}-infoText`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f0f0f0',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center'
  },

  [`& .${classes.inner}`]: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    maxWidth: 1440,
    margin: '0 auto',
    padding: `2px 24px`,
    [theme.breakpoints.down('md')]: {
      padding: '2px 8px'
    }
  },

  [`& .${classes.flag}`]: {
    padding: `0 ${theme.spacing()}px`
  },

  [`& .${classes.textWrap}`]: {
    display: 'flex',
    flexFlow: 'row wrap',
    alignItems: 'center',
    flexGrow: 1,
    [theme.breakpoints.down('sm')]: {
      padding: `5px 0`
    }
  },

  [`& .${classes.text}`]: {
    flex: '0 1 auto',
    marginRight: theme.spacing(),
    [theme.breakpoints.down('sm')]: {
      flex: '0 0 100%'
    }
  },

  [`& .${classes.btn}`]: {
    border: 'none',
    background: 'none',
    padding: 0,
    outline: 'none'
  },

  [`& .${classes.btnExpand}`]: {
    display: 'flex',
    alignItems: 'center',
    color: '#005ea2',
    textDecoration: 'underline'
  },

  [`& .${classes.infoInner}`]: {
    maxWidth: 800,
    margin: '0 auto',
    lineHeight: 1.5,
    flexFlow: 'row wrap',
    padding: `${theme.spacing(3)} 16px`
  },

  [`& .${classes.info}`]: {
    display: 'flex',
    flex: '1 1 50%',
    padding: `${theme.spacing(2)} ${theme.spacing(2)}`,
    [theme.breakpoints.down('md')]: {
      flex: '0 0 100%',
      padding: `${theme.spacing(2)} 0`
    }
  },

  [`& .${classes.infoIcon}`]: {
    minWidth: 40
  },

  [`& .${classes.infoText}`]: {
    fontSize: '0.87rem',
    '& p': {
      margin: `0 ${theme.spacing(2)}`
    }
  }
}));

export const GovBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Root>
      <div className={classes.root}>
        <div className={classes.inner}>
          <img src={flagIcon} alt="usa flag" className={classes.flag} />
          <div className={classes.textWrap}>
            <div className={classes.text}>
              An official website of the United States government
            </div>
            <button
              className={clsx(classes.text, classes.btn, classes.btnExpand)}
              onClick={() => setExpanded((exp) => !exp)}
            >
              Here&apos;s how you know{' '}
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
                  Federal government websites often end in{' '}
                  <strong>.gov </strong>or <strong>.mil</strong>. Before sharing
                  sensitive information, make sure you’re on a federal
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
    </Root>
  );
};
