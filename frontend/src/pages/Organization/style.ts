import { styled } from '@mui/material/styles';

const PREFIX = 'Organization';

export const organizationClasses = {
  header: `${PREFIX}-header`,
  headerLabel: `${PREFIX}-headerLabel`,
  chip: `${PREFIX}-chip`,
  settingsWrapper: `${PREFIX}-settingsWrapper`,
  buttons: `${PREFIX}-buttons`,
  orgName: `${PREFIX}-orgName`,
  textField: `${PREFIX}-textField`,
  root: `${PREFIX}-root`,
  headerRow: `${PREFIX}-headerRow`
};

export const OrganizationRoot = styled('div')(({ theme }) => ({
  [`& .${organizationClasses.header}`]: {
    background: '#F9F9F9'
  },

  [`& .${organizationClasses.headerLabel}`]: {
    margin: 0,
    paddingTop: '1.5rem',
    paddingBottom: '0.5rem',
    marginLeft: '15%',
    color: '#C9C9C9',
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '24px',
    '& a': {
      textDecoration: 'none',
      color: '#C9C9C9'
    },
    '& svg': {
      verticalAlign: 'middle',
      lineHeight: '100%',
      fontSize: '26px'
    }
  },

  [`& .${organizationClasses.chip}`]: {
    color: 'white',
    marginRight: '10px',
    marginTop: '10px'
  },

  [`& .${organizationClasses.settingsWrapper}`]: {
    boxSizing: 'border-box',
    border: '0px',
    boxShadow: 'none',
    borderRadius: '0px',
    padding: '25px',
    maxWidth: '900px',
    margin: '0 auto'
  },

  [`& .${organizationClasses.buttons}`]: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  [`& .${organizationClasses.orgName}`]: {
    background: '#F5F5F5 !important',
    paddingBottom: '10px'
  },

  [`& .${organizationClasses.textField}`]: {
    background: '#F5F5F5 !important'
  },

  [`& .${organizationClasses.root}`]: {
    maxWidth: '1400px',
    margin: '0 auto',
    '@media screen and (min-width: 480px)': {
      padding: '1rem 1rem'
    },
    '@media screen and (min-width: 640px)': {
      padding: '1rem 1.5rem'
    },
    '@media screen and (min-width: 1024px)': {
      padding: '1rem 2rem'
    }
  },

  [`& .${organizationClasses.headerRow}`]: {
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
