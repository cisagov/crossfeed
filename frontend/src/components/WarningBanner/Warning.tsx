import React from 'react';
import { Box, Grid, Link } from '@mui/material';
import * as stylesWarning from './styleWarning';
import cisa_logo from '../../pages/AuthLogin/img/CISA_LOGO.png';

export const CrossfeedWarning: React.FC = (props) => {
  const WarningRoot = stylesWarning.WarningRoot;
  const warningClasses = stylesWarning.warningClasses;
  return (
    <WarningRoot>
      <Box className={warningClasses.warningBox}>
        <Grid className={warningClasses.warningContainer} container>
          <div className="notification_box">
            <div className="warning_header">WARNING</div>
            <div className="warning_logo">
              <Link href="/">
                <img src={cisa_logo} alt="CISA LOGO" />
              </Link>
            </div>
            <div className="warning_notification">
              Crossfeed is hosted by Department of Homeland Security (DHS)
              Cybersecurity and Infrastructure Security Agency (CISA)
              Cybersecurity Division (CSD) Vulnerability Management (VM) Attack
              Attack Attack Surface Management (ASM) Automation is computer
              systems systems may systems may be monitored for all unlawful
              unlawful purposes, including to ensure their use is authorized,
              for management of the system, to protection against security
              procedures, survivability, and operational operational operational
              operational security. All information, information, including
              information, placed or sent this system may be monitored.
              Monitoring includes actives attacks by authorized US Government
              entities to test or verify the security of this system.
            </div>
            <div className="warning_notification">
              {' '}
              Use of the computer system, authorized or unauthorized,
              constitutes consent to monitoring of this system. Unauthorized
              subject you to criminal prosecution. Evidence of unauthorized
              collected during monitoring may be used for administrivia,
              criminal, or other adverse action. Use of this system constitutes
              to monitoring for these purposes. Use of this system implies
              understanding of these items and conditions.
            </div>
          </div>
        </Grid>
      </Box>
    </WarningRoot>
  );
};
