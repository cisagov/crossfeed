import React from 'react';
import { Box, Grid, Link } from '@material-ui/core';

export const CrossfeedFooter: React.FC = () => {
  return (
    <Box style={{ backgroundColor: '#005288' }}>
      <Grid
        container
        spacing={2}
        alignItems={'center'}
        style={{
          margin: '0 auto',
          marginTop: '1rem',
          maxWidth: '1000px'
        }}
      >
        <Grid item xs={12} md={1}>
          <a
            title="Department of Homeland Security - Cybersecurity and Infrastructure Security Agency, Public domain, via Wikimedia Commons"
            href="https://www.cisa.gov"
          >
            <img
              width="512"
              alt="CISA Logo"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/CISA_Logo.png/512px-CISA_Logo.png"
            />
          </a>
        </Grid>
        <Grid item md={1}></Grid>
        <Grid item sm={12} md={4}>
          <p>
            <Link
              href="https://www.cisa.gov"
              underline="always"
              style={{ color: 'white' }}
            >
              CISA Homepage
            </Link>
          </p>
          <p>
            <Link
              href="https://www.dhs.gov/foia"
              underline="always"
              style={{ color: 'white' }}
            >
              FOIA Requests
            </Link>
          </p>
          <p>
            <Link
              href="https://www.whitehouse.gov/"
              underline="always"
              style={{ color: 'white' }}
            >
              The White House
            </Link>
          </p>
        </Grid>
        <Grid item sm={12} md={4}>
          <p>
            <Link
              href="https://www.cisa.gov"
              underline="always"
              style={{ color: 'white' }}
            >
              Privacy
            </Link>
          </p>
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
        <Grid item xs={2}>
          <iframe
            src="https://www.dhs.gov/ntas/"
            name="National Terrorism Advisory System"
            title="National Terrorism Advisory System"
            width="170"
            height="180"
            scrolling="no"
            frameBorder="0"
            seamless
          ></iframe>
        </Grid>
      </Grid>
    </Box>
  );
};
