import { makeStyles } from '@mui/material';

export const useFooterStyles = makeStyles((theme) => ({
  footerBox: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.palette.primary.main
  },
  footerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    maxWidth: '1444px'
  },
  footerLogo: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%'
  },
  footerNavItem: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem',
    borderLeft: '1px solid white',
    gridColumn: 'span 2'
  },
  footerNavLink: {
    color: 'white',
    alwaysUnderline: 'true',
    alignItems: 'center'
  }
}));
