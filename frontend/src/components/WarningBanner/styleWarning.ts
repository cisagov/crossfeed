import { styled } from '@mui/material/styles';

const PREFIX = 'Warning';

export const warningClasses = {
  warningBox: `${PREFIX}-warningBox`,
  warningContainer: `${PREFIX}-footerContainer`,
  warning_logo: `${PREFIX}-warning_logo`
};
export const WarningRoot = styled('div')(({ theme }) => ({
  [`& .${warningClasses.warningBox}`]: {
    position: 'relative',
    top: '20px',
    bottom: 0,
    width: '100%'
  },
  [`& .${warningClasses.warningContainer}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    maxWidth: '1444px'
  },
  [`& .${warningClasses.warning_logo}`]: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%'
  }
}));
