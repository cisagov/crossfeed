import React, { useState } from 'react';
import clsx from 'classnames';
import { NavLink, useRouteMatch, useHistory } from 'react-router-dom';
import { Menu, MenuItem, Button, makeStyles } from '@material-ui/core';

interface LinkConfig {
  title: string | JSX.Element;
  path: string;
}

interface Props {
  nested?: LinkConfig[];
  path?: string;
  title: string | JSX.Element;
  exact?: boolean;
}

export const NavItem: React.FC<Props> = (props) => {
  const { title, path, nested, exact } = props;
  const match = useRouteMatch(path ?? '');
  const history = useHistory();
  const [anchor, setAnchor] = useState<any>(null);
  const [mouseInButton, setMouseInButton] = useState(false);
  const [mouseInMenu, setMouseInMenu] = useState(false);
  const classes = useStyles();

  const onHoverButton = (e: any) => {
    setAnchor(e.currentTarget);
    setMouseInButton(true);
  };

  const onLeaveButton = (e: any) => {
    setTimeout(() => {
      setMouseInButton(false);
    }, 400);
  };

  const onHoverMenu = (e: any) => {
    setMouseInMenu(true);
  };

  const onLeaveMenu = (e: any) => {
    setTimeout(() => {
      setMouseInMenu(false);
    }, 400);
  };

  const onCloseMenu = () => {
    setMouseInMenu(false);
    setMouseInButton(false);
    setAnchor(null);
  };

  const navigateTo = (to: string) => {
    setMouseInMenu(false);
    setMouseInButton(false);
    setAnchor(null);
    history.push(to);
  };

  return (
    <>
      {path ? (
        <NavLink
          to={path ?? '#'}
          activeClassName={classes.activeLink}
          className={classes.link}
          onMouseEnter={onHoverButton}
          onClick={onHoverButton}
          onMouseLeave={onLeaveButton}
          exact={exact}
        >
          {title}
        </NavLink>
      ) : (
        <Button
          className={clsx(classes.link, {
            [classes.activeLink]: !!match
          })}
          onMouseOver={onHoverButton}
          onClick={onHoverButton}
        >
          {title}
        </Button>
      )}
      {nested && (
        <Menu
          id={`menu-${title}`}
          open={(mouseInButton || mouseInMenu) && !!anchor}
          anchorEl={anchor}
          onClose={onCloseMenu}
          getContentAnchorEl={null}
          keepMounted
          // anchorOrigin={{
          //   vertical: 'bottom',
          //   horizontal: 'center'
          // }}
          // transformOrigin={{
          //   vertical: 'top',
          //   horizontal: 'center'
          // }}
          MenuListProps={{
            onMouseEnter: onHoverMenu,
            onMouseLeave: onLeaveMenu
          }}
        >
          {nested.map((item) => (
            <MenuItem
              key={item.title.toString()}
              onClick={() => navigateTo(item.path)}
            >
              {item.title}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  inner: {
    maxWidth: 1440,
    width: '100%',
    margin: '0 auto'
  },
  menuButton: {
    marginRight: theme.spacing(2),
    display: 'block',
    [theme.breakpoints.up('lg')]: {
      display: 'none'
    }
  },
  activeLink: {
    '&:after': {
      content: "''",
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      backgroundColor: 'white'
    }
  },
  activeMobileLink: {
    fontWeight: 700,
    '&:after': {
      content: "''",
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      height: '100%',
      width: 2,
      backgroundColor: theme.palette.primary.main
    }
  },
  link: {
    position: 'relative',
    color: 'white',
    textDecoration: 'none',
    margin: `0 ${theme.spacing()}px`,
    padding: theme.spacing(),
    borderBottom: '2px solid transparent',
    fontWeight: 600
  },
  userLink: {
    display: 'flex',
    alignItems: 'center',

    '& svg': {
      marginRight: theme.spacing()
    }
  }
}));
