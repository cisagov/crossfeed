import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import cisa_logo from '../../pages/AuthLogin/img/CISA_LOGO.png';

export const CrossfeedWarning: React.FC = (props) => {
  const BackgroundPaper = styled(Paper)(({ theme }) => ({
    width: 900,
    borderColor: '#047d95',
    borderWidth: 2,
    padding: theme.spacing(1),
    backgroundColor: 'inherit'
  }));
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5, px: 1 }}>
      <BackgroundPaper variant="outlined">
        <Grid container spacing={1}>
          <Grid item xs={12} sm={3} display="flex" justifyContent="end">
            <Box m="auto">
              <img alt="CISA LOGO" src={cisa_logo} width="140px" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="h6" textAlign="center">
              WARNING
            </Typography>
            <Typography
              variant="caption"
              component="div"
              fontSize={11}
              lineHeight={1}
            >
              Crossfeed is hosted by Department of Homeland Security (DHS)
              Cybersecurity and Infrastructure Security Agency (CISA)
              Cybersecurity Division (CSD) Vulnerability Management (VM) Attack
              Surface Management (ASM) Automation is computer systems systems
              may systems may be monitored for all unlawful unlawful purposes,
              including to ensure their use is authorized, for management of the
              system, to protection against security procedures, survivability,
              and operational operational operational operational security. All
              information, information, including information, placed or sent
              this system may be monitored. Monitoring includes actives attacks
              by authorized US Government entities to test or verify the
              security of this system.
              <br />
              <br />
              Use of the computer system, authorized or unauthorized,
              constitutes consent to monitoring of this system. Unauthorized
              subject you to criminal prosecution. Evidence of unauthorized
              collected during monitoring may be used for administrivia,
              criminal, or other adverse action. Use of this system constitutes
              to monitoring for these purposes. Use of this system implies
              understanding of these items and conditions.
            </Typography>
          </Grid>
        </Grid>
      </BackgroundPaper>
    </Box>
  );
};
