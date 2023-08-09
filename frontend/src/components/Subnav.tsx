import { styled } from '@mui/material/styles';
import React from 'react';
import { NavLink } from 'react-router-dom';

interface Props {
  items: {
    title: string;
    path: string | { pathname: string };
    exact?: boolean;
    users?: number;
    externalLink?: boolean;
  }[];
  styles?: any;
  children?: React.ReactNode;
}

export const Subnav: React.FC<Props> = (props) => {
  const { items, children } = props;

  return (
    <StyledPaper>
      <div className={classes.root}>
        {items.map((item) =>
          item.externalLink ? (
            <NavLink
              key={item.title}
              to={item.path}
              className={classes.link}
              activeClassName={classes.active}
              target="_blank"
              rel="noreferrer"
            >
              {item.title}
            </NavLink>
          ) : (
            <NavLink
              key={item.title}
              to={item.path}
              className={classes.link}
              activeClassName={classes.active}
              exact={item.exact ?? false}
            >
              {item.title}
            </NavLink>
          )
        )}
        <div className={classes.flex} />
        {children}
      </div>
    </StyledPaper>
  );
};

//Styling
const PREFIX = 'Subnav';

const classes = {
  root: `${PREFIX}-root`,
  link: `${PREFIX}-link`,
  active: `${PREFIX}-active`,
  flex: `${PREFIX}-flex`,
  styles: `${PREFIX}-styles`
};

const StyledPaper = styled('div')(({ theme }) => ({
  [`.${classes.root}`]: {
    width: '100%',
    padding: '0 1rem',
    borderRadius: 0,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    paddingLeft: '15%'
  },
  [`.${classes.link}`]: {
    display: 'flex',
    padding: '0.75rem 1rem 0.5rem 1rem',
    borderBottom: '2px solid transparent',
    textDecoration: 'none',
    color: theme.palette.grey[400],
    fontWeight: 500
  },
  [`.${classes.active}`]: {
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main
  },
  [`.${classes.flex}`]: {
    flex: 1
  }
}));
