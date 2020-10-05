import React, { useState } from 'react';
import clsx from 'classnames';
import { NavLink, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  ListItem,
  List,
  Menu,
  MenuItem
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  AccountCircle as UserIcon
} from '@material-ui/icons';
import { useAuthContext } from 'context';
import logo from '../assets/cisa_logo.png';

const GLOBAL_ADMIN = 4;
const ORG_ADMIN = 2;
const ORG_USER = 1;
const ALL_USERS = GLOBAL_ADMIN | ORG_ADMIN | ORG_USER;

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
  logo: {
    display: 'none',
    height: 60,
    padding: theme.spacing(),
    paddingLeft: 0,
    [theme.breakpoints.up('sm')]: {
      display: 'block'
    }
  },
  spacing: {
    flexGrow: 1
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
  nestedLink: {
    position: 'relative',
    color: 'black',
    textDecoration: 'none',
    fontWeight: 400,
    fontSize: '14px'
  },
  userLink: {
    display: 'flex',
    alignItems: 'center',

    '& svg': {
      marginRight: theme.spacing()
    }
  },
  mdNav: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block'
    }
  },
  lgNav: {
    display: 'none',
    [theme.breakpoints.up('lg')]: {
      display: 'block'
    }
  },
  mobileNav: {
    padding: `${theme.spacing(2)}px ${theme.spacing()}px`
  }
}));

interface NavItem {
  title: string;
  path: string;
  users: number;
  parent?: string;
  onClick?: any;
}

export const Header: React.FC = () => {
  const classes = useStyles();
  const { currentOrganization, user, logout } = useAuthContext();
  const [navOpen, setNavOpen] = useState(false);

  let userLevel = 0;
  if (user && user.isRegistered) {
    if (user.userType === 'standard') {
      if (currentOrganization?.userIsAdmin) {
        userLevel = ORG_ADMIN;
      } else {
        userLevel = ORG_USER;
      }
    } else {
      userLevel = GLOBAL_ADMIN;
    }
  }
  userLevel = ORG_ADMIN;

  const navItems: NavItem[] = [
    { title: 'Overview', path: '/risk', users: ALL_USERS },
    { title: 'Inventory', path: '/', users: ALL_USERS },
    { title: 'Search', path: '/search', users: GLOBAL_ADMIN },
    { title: 'Vulnerabilities', path: '/vulnerabilities', users: ALL_USERS },

    { title: 'Scans', path: '/scans', users: GLOBAL_ADMIN },
    {
      title: 'Manage Users',
      path: '/users',
      users: GLOBAL_ADMIN,
      parent: 'Account'
    },
    {
      title: 'Organization Settings',
      path: '/organization',
      users: ORG_ADMIN | GLOBAL_ADMIN,
      parent: 'Account'
    },
    {
      title: 'My Organizations',
      path: '/organizations',
      users: ORG_USER | ORG_ADMIN,
      parent: 'Account'
    },
    {
      title: 'Manage Organizations',
      path: '/organizations',
      users: GLOBAL_ADMIN,
      parent: 'Account'
    },
    {
      title: 'Account Settings',
      path: '/settings',
      users: ALL_USERS,
      parent: 'Account'
    },
    {
      title: 'Log Out',
      path: '/settings',
      users: ALL_USERS,
      parent: 'Account',
      onClick: logout
    }
  ].filter(({ users }) => (users & userLevel) > 0);

  const desktopNavItems: JSX.Element[] = navItems
    .filter((nav) => !nav.parent)
    .map(({ title, path }) => (
      <NavLink
        to={path}
        key={title}
        activeClassName={classes.activeLink}
        className={classes.link}
        exact={true}
      >
        {title}
      </NavLink>
    ));

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AppBar position="static">
        <div className={classes.inner}>
          <Toolbar>
            <IconButton
              edge="start"
              className={classes.menuButton}
              aria-label="toggle mobile menu"
              color="inherit"
              onClick={() => setNavOpen((open) => !open)}
            >
              <MenuIcon />
            </IconButton>
            <Link to="/">
              <img
                src={logo}
                className={classes.logo}
                alt="Crossfeed Icon Navigate Home"
              />
            </Link>
            <div className={classes.mdNav}>{desktopNavItems.slice(0, 3)}</div>
            <div className={classes.lgNav}>
              {desktopNavItems.slice(3, navItems.length)}
            </div>

            <div className={classes.spacing} />
            {userLevel > 0 && (
              <>
                <NavLink
                  to="/settings"
                  activeClassName={classes.activeLink}
                  className={clsx(classes.link, classes.userLink)}
                  exact={true}
                  onMouseOver={handleClick}
                  onClick={handleClick}
                >
                  <UserIcon /> My Account
                </NavLink>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                  }}
                  getContentAnchorEl={null}
                >
                  {navItems
                    .filter((nav) => nav.parent === 'Account')
                    .map(({ title, path, onClick }) => (
                      <MenuItem>
                        <NavLink
                          to={onClick ? '#' : path}
                          key={title}
                          className={classes.nestedLink}
                          exact={true}
                          onClick={onClick ? onClick : handleClose}
                        >
                          {title}
                        </NavLink>
                      </MenuItem>
                    ))}
                </Menu>
              </>
            )}
          </Toolbar>
        </div>
      </AppBar>
      <Drawer
        anchor="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        data-testid="mobilenav"
      >
        <List className={classes.mobileNav}>
          {navItems.map(({ title, path }) => (
            <ListItem
              button
              key={title}
              component={NavLink}
              to={path}
              activeClassName={classes.activeMobileLink}
              exact={true}
            >
              {title}
            </ListItem>
          ))}
        </List>
      </Drawer>
    </div>
  );
};
