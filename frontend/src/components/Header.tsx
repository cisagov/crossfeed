import React, { useState } from 'react';
import { NavLink, Link, useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  ListItem,
  List
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  AccountCircle as UserIcon
} from '@material-ui/icons';
import { NavItem } from './NavItem';
import { useAuthContext } from 'context';
import logo from '../assets/cisa_logo.png';
import { withSearch } from '@elastic/react-search-ui';
import { ContextType } from 'context/SearchProvider';
import { SearchBar } from 'components';

const GLOBAL_ADMIN = 4;
const ORG_ADMIN = 2;
const ORG_USER = 1;
const ALL_USERS = GLOBAL_ADMIN | ORG_ADMIN | ORG_USER;

interface NavItem {
  title: string | JSX.Element;
  path: string;
  users?: number;
  nested?: NavItem[];
}

const HeaderNoCtx: React.FC<ContextType> = (props) => {
  const { searchTerm, setSearchTerm } = props;
  const classes = useStyles();
  const history = useHistory();
  const { currentOrganization, user } = useAuthContext();
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

  const navItems: NavItem[] = [
    {
      title: 'Inventory',
      path: '/inventory',
      users: ALL_USERS,
      exact: false,
      nested: [
        { title: 'Search', path: '/inventory/search', users: ALL_USERS },
        {
          title: 'Vulnerabilities',
          path: '/inventory/vulnerabilities',
          users: ALL_USERS
        },
        { title: 'Risk Summary', path: '/inventory/risk', users: ALL_USERS }
      ]
    },
    {
      title: 'Scans',
      path: '/scans',
      users: GLOBAL_ADMIN
    }
  ]
    .filter(({ users }) => (users & userLevel) > 0)
    .map((item) => ({
      ...item,
      nested: item.nested?.filter((nested) => (nested.users & userLevel) > 0)
    }));

  const userMenu: NavItem = {
    title: (
      <div className={classes.userLink}>
        <UserIcon /> My Account
      </div>
    ),
    path: '/settings',
    nested: [
      {
        title: 'Organization Settings',
        path: '/organization',
        users: ORG_ADMIN | GLOBAL_ADMIN
      },
      {
        title: 'My Organizations',
        path: '/organizations',
        users: ORG_USER | ORG_ADMIN
      },
      {
        title: 'Manage Organizations',
        path: '/organizations',
        users: GLOBAL_ADMIN
      },

      { title: 'Scans', path: '/scans', users: GLOBAL_ADMIN },
      { title: 'Manage Users', path: '/users', users: GLOBAL_ADMIN }
    ]
  };

  const desktopNavItems: JSX.Element[] = navItems.map((item) => (
    <NavItem key={item.title.toString()} {...item} />
  ));

  return (
    <div>
      <AppBar position="static" elevation={0}>
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

            <SearchBar
              value={searchTerm}
              onChange={(value) => {
                history.push('/inventory/search');
                setSearchTerm(value, {
                  shouldClearFilters: false,
                  autocompleteResults: false
                });
              }}
            />
            {userLevel > 0 && <NavItem {...userMenu} />}
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
          {navItems.map(({ title, path, nested }) => (
            <React.Fragment key={title.toString()}>
              {path && (
                <ListItem
                  button
                  component={NavLink}
                  to={path}
                  activeClassName={classes.activeMobileLink}
                >
                  {title}
                </ListItem>
              )}
              {nested?.map((nested) => (
                <ListItem
                  button
                  key={nested.title.toString()}
                  component={NavLink}
                  to={nested.path}
                  activeClassName={classes.activeMobileLink}
                >
                  {nested.title}
                </ListItem>
              ))}
            </React.Fragment>
          ))}
        </List>
      </Drawer>
    </div>
  );
};

export const Header = withSearch(
  ({ searchTerm, setSearchTerm }: ContextType) => ({
    searchTerm,
    setSearchTerm
  })
)(HeaderNoCtx);

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
  userLink: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '1rem',

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
