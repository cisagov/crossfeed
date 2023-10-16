import { styled } from '@mui/material/styles';

const PREFIX = 'Footer';

export const footerClasses = {
  footerBox: `${PREFIX}-footerBox`,
  footerContainer: `${PREFIX}-footerContainer`,
  footerLogo: `${PREFIX}-footerLogo`,
  footerNavItem: `${PREFIX}-footerNavItem`,
  footerNavLink: `${PREFIX}-footerNavLink`
};
export const FooterRoot = styled('div')(({ theme }) => ({
  [`& .${footerClasses.footerBox}`]: {
    position: 'relative',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.palette.primary.main
  },
  [`& .${footerClasses.footerContainer}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    maxWidth: '1444px'
  },
  [`& .${footerClasses.footerLogo}`]: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%'
  },
  [`& .${footerClasses.footerNavItem}`]: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem',
    borderLeft: '1px solid white',
    gridColumn: 'span 2'
  },
  [`& .${footerClasses.footerNavLink}`]: {
    color: 'white',
    alwaysUnderline: 'true',
    alignItems: 'center'
  }
}));
