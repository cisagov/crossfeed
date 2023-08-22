import { styled } from '@mui/material/styles';

const PREFIX = 'Vulnerabilities';

export const classesVulns = {
  contentWrapper: `${PREFIX}-contentWrapper`
};

export const Root = styled('div')(({ theme }) => ({
  [`& .${classesVulns.contentWrapper}`]: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden'
  }
}));
