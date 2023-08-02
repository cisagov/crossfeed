import React from 'react';
import { Box, Grid, Link } from '@mui/material';
import { useAuthContext } from 'context';
import logo from '../../assets/crossfeed.svg';
import { useFooterStyles } from './style';

export const CrossfeedFooter: React.FC = (props) => {
  const { logout } = useAuthContext();
  const footerClasses = useFooterStyles(props);
  return (
    <Box className={footerClasses.footerBox}>
      <Grid className={footerClasses.footerContainer} container>
        <Grid className={footerClasses.footerLogo} item xs={12} sm={2}>
          <Link href="/">
            <img src={logo} alt="Crossfeed Icon Navigate Home" />
          </Link>
        </Grid>
        <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
          <p>
            <Link className={footerClasses.footerNavLink} href="/">
              Home
            </Link>
          </p>
        </Grid>
        <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
          <p>
            <Link
              className={footerClasses.footerNavLink}
              href="https://docs.crossfeed.cyber.dhs.gov/"
            >
              Documentation
            </Link>
          </p>
        </Grid>
        <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
          <p>
            <Link
              className={footerClasses.footerNavLink}
              href="https://www.cisa.gov"
            >
              CISA Homepage
            </Link>
          </p>
        </Grid>
        <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
          <p>
            <Link
              className={footerClasses.footerNavLink}
              href="mailto:vulnerability@cisa.dhs.gov"
            >
              Contact Us
            </Link>
          </p>
        </Grid>
        <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
          <p>
            <Link
              className={footerClasses.footerNavLink}
              href="/"
              onClick={logout}
            >
              Logout
            </Link>
          </p>
        </Grid>
      </Grid>
    </Box>
  );
};
