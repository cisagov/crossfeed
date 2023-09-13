import React from 'react';
import { Box, Grid, Link, useTheme } from '@mui/material';
import { useAuthContext } from 'context';
import logo from '../assets/crossfeed.svg';

export const CrossfeedFooter: React.FC = () => {
  const { logout } = useAuthContext();
  const theme = useTheme();
  return (
    <Box style={{ backgroundColor: theme.palette.primary.main }} width={'100%'}>
      <Grid
        container
        spacing={2}
        alignItems={'center'}
        justifyContent={'center'}
        style={{
          position: 'sticky',
          margin: '0 auto',
          marginTop: '1rem',
          maxWidth: '1444px'
        }}
      >
        <Grid
          item
          xs={12}
          sm={2}
          style={{
            display: 'flex',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <Link href="/">
            <img src={logo} alt="Crossfeed Icon Navigate Home" />
          </Link>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          style={{
            display: 'flex',
            justifyContent: 'center',
            borderRight: '1px solid white',
            borderLeft: '1px solid white'
          }}
        >
          <p>
            <Link href="/" underline="always" style={{ color: 'white' }}>
              Home
            </Link>
          </p>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          style={{
            display: 'flex',
            justifyContent: 'center',
            borderRight: '1px solid white'
          }}
        >
          <p>
            <Link
              href="https://docs.crossfeed.cyber.dhs.gov/"
              underline="always"
              style={{ color: 'white' }}
            >
              Documentation
            </Link>
          </p>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          style={{
            display: 'flex',
            justifyContent: 'center',
            borderRight: '1px solid white'
          }}
        >
          <p>
            <Link
              href="https://www.cisa.gov"
              underline="always"
              style={{ color: 'white' }}
            >
              CISA Homepage
            </Link>
          </p>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <p>
            <Link
              href="mailto:vulnerability@cisa.dhs.gov"
              underline="always"
              style={{ color: 'white' }}
            >
              Contact Us
            </Link>
          </p>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          style={{
            display: 'flex',
            justifyContent: 'center',
            borderLeft: '1px solid white'
          }}
        >
          <p>
            <Link
              href="/"
              underline="always"
              style={{ color: 'white' }}
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
