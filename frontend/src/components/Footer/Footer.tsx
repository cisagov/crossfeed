import React from 'react';
import { Box, Grid, Link } from '@mui/material';
import { useAuthContext } from 'context';
import logo from '../../assets/crossfeed.svg';
import * as FooterStyles from './styleFooter';

export const CrossfeedFooter: React.FC = (props) => {
  const { logout, user } = useAuthContext();
  const FooterRoot = FooterStyles.FooterRoot;
  const footerClasses = FooterStyles.footerClasses;
  return (
    <FooterRoot>
      <Box className={footerClasses.footerBox}>
        <Grid className={footerClasses.footerContainer} container>
          <Grid className={footerClasses.footerLogo} item xs={12} sm={2}>
            <Link href="/">
              <img src={logo} alt="Crossfeed Icon Navigate Home" />
            </Link>
          </Grid>
          {user && (
            <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
              <Link className={footerClasses.footerNavLink} href="/">
                Home
              </Link>
            </Grid>
          )}
          <Grid className={footerClasses.footerNavItem} item xs={12} sm={2}>
            <p>
              <Link
                className={footerClasses.footerNavLink}
                href="https://docs.crossfeed.cyber.dhs.gov/"
                target="_blank"
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
                target="_blank"
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
          {user && (
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
          )}
        </Grid>
      </Box>
    </FooterRoot>
  );
};
