import { makeStyles, Paper } from '@material-ui/core';
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
}

export const Subnav: React.FC<Props> = (props) => {
  const { items, children, styles } = props;
  const classes = useStyles(styles)();

  return (
    <Paper classes={{ root: classes.root }}>
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
    </Paper>
  );
};

const useStyles = (styles: any) =>
  makeStyles((theme) => ({
    root: {
      width: '100%',
      padding: '0 1rem',
      borderRadius: 0,
      display: 'flex',
      flexFlow: 'row nowrap',
      alignItems: 'center',
      paddingLeft: '15%',
      ...styles
    },
    link: {
      display: 'block',
      padding: '0.75rem 1rem 0.5rem 1rem',
      borderBottom: '2px solid transparent',
      textDecoration: 'none',
      color: theme.palette.grey[400],
      fontWeight: 500
    },
    active: {
      borderBottom: `2px solid ${theme.palette.primary.main}`,
      color: theme.palette.primary.main
    },
    flex: {
      flex: 1
    }
  }));
