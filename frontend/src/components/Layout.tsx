import React from 'react';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { Header, GovBanner } from 'components';

interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  return (
    <StyledScopedCssBaseline classes={{ root: classes.overrides }}>
      <div className={classes.root}>
        <GovBanner />
        <Header />

        {pathname === '/inventory' ? (
          children
        ) : (
          <div className={classes.content}>{children}</div>
        )}
      </div>
    </StyledScopedCssBaseline>
  );
};

//Styling
const PREFIX = 'Layout';

const classes = {
  root: `${PREFIX}-root`,
  overrides: `${PREFIX}-overrides`,
  content: `${PREFIX}-content`
};

const StyledScopedCssBaseline = styled(ScopedCssBaseline)(({ theme }) => ({
  [`& .${classes.root}`]: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflow: 'auto'
  },

  [`& .${classes.overrides}`]: {
    WebkitFontSmoothing: 'unset',
    MozOsxFontSmoothing: 'unset'
  },

  [`& .${classes.content}`]: {
    flex: '1',
    display: 'block',
    position: 'relative'
  }
}));