import React, { useState } from 'react';
import { NavLink, Link, useHistory, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  ListItem,
  List,
  Select,
  MenuItem,
  FormControl,
  TextField
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  AccountCircle as UserIcon,
  ArrowDropDown
} from '@material-ui/icons';
import { NavItem } from './NavItem';
import { useAuthContext } from 'context';
import logo from '../assets/cisa_logo.png';
import { withSearch } from '@elastic/react-search-ui';
import { ContextType } from 'context/SearchProvider';
import { SearchBar } from 'components';
import { Autocomplete } from '@material-ui/lab';
import { Organization } from 'types';

const GLOBAL_ADMIN = 4;
const ORG_ADMIN = 2;
const ORG_USER = 1;
const ALL_USERS = GLOBAL_ADMIN | ORG_ADMIN | ORG_USER;

interface NavItemType {
  title: string | JSX.Element;
  path: string;
  users?: number;
  nested?: NavItemType[];
  onClick?: any;
  exact: boolean;
}

interface ShowAllOrganizations {
  name: string;
}

const HeaderNoCtx: React.FC<ContextType> = (props) => {
  const { searchTerm, setSearchTerm } = props;
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const {
    currentOrganization,
    setOrganization,
    setShowAllOrganizations,
    user,
    logout,
    apiGet
  } = useAuthContext();
  const [navOpen, setNavOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const fetchOrganizations = async () => {
    try {
      let rows = await apiGet<Organization[]>('/organizations/');
      setOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchOrganizations();
  }, []);

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

  const navItems: NavItemType[] = [
    {
      title: 'Overview',
      path: '/',
      users: ALL_USERS,
      exact: true
    },
    {
      title: 'Inventory',
      path: '/inventory',
      users: ALL_USERS,
      exact: false
    },
    { title: 'Feeds', path: '/feeds', users: ALL_USERS, exact: false },
    {
      title: 'Scans',
      path: '/scans',
      users: GLOBAL_ADMIN,
      exact: true
    }
  ].filter(({ users }) => (users & userLevel) > 0);

  const userMenu: NavItemType = {
    title: (
      <div className={classes.userLink}>
        <UserIcon /> My Account <ArrowDropDown />
      </div>
    ),
    path: '#',
    exact: false,
    nested: [
      {
        title: 'Manage Users',
        path: '/users',
        users: GLOBAL_ADMIN,
        exact: true
      },
      {
        title: 'Manage Organizations',
        path: '/organizations',
        users: GLOBAL_ADMIN,
        exact: true
      },
      {
        title: 'Organization Settings',
        path: '/organization',
        users: ORG_ADMIN | GLOBAL_ADMIN,
        exact: true
      },
      {
        title: 'My Organizations',
        path: '/organizations',
        users: ORG_USER | ORG_ADMIN,
        exact: true
      },
      {
        title: 'My Settings',
        path: '/settings',
        users: ALL_USERS,
        exact: true
      },
      {
        title: 'Logout',
        path: '/settings',
        users: ALL_USERS,
        onClick: logout,
        exact: true
      }
    ].filter(({ users }) => (users & userLevel) > 0)
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

            {userLevel > 0 && (
              <>
                <SearchBar
                  initialValue={searchTerm}
                  value={searchTerm}
                  onChange={(value) => {
                    if (location.pathname !== '/inventory')
                      history.push('/inventory?q=' + value);
                    setSearchTerm(value, {
                      shouldClearFilters: false,
                      autocompleteResults: false
                    });
                  }}
                />
                <div className={classes.spacing} />
                <Autocomplete
                  options={[{ name: 'All Organizations' }].concat(
                    organizations
                  )}
                  className={classes.selectOrg}
                  classes={{
                    option: classes.option
                  }}
                  value={currentOrganization ?? undefined}
                  disableClearable
                  blurOnSelect
                  selectOnFocus
                  getOptionLabel={(option) => option.name}
                  renderOption={(option) => (
                    <React.Fragment>{option.name}</React.Fragment>
                  )}
                  onChange={(
                    event: any,
                    value: Organization | ShowAllOrganizations | undefined
                  ) => {
                    if (value && 'id' in value) {
                      setOrganization(value);
                      setShowAllOrganizations(false);
                    } else {
                      setShowAllOrganizations(true);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password' // disable autocomplete and autofill
                      }}
                    />
                  )}
                />
                <NavItem {...userMenu} />
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
          {navItems.map(({ title, path, nested, onClick }) => (
            <React.Fragment key={title.toString()}>
              {path && (
                <ListItem
                  button
                  component={NavLink}
                  to={path}
                  activeClassName={classes.activeMobileLink}
                  onClick={onClick ? onClick : undefined}
                >
                  {title}
                </ListItem>
              )}
              {nested?.map((nested) => (
                <ListItem
                  button
                  key={nested.title.toString()}
                  component={NavLink}
                  to={nested.onClick ? '#' : nested.path}
                  activeClassName={classes.activeMobileLink}
                  onClick={nested.onClick ? nested.onClick : undefined}
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
    },
    border: 'none',
    textDecoration: 'none'
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
  },
  selectOrg: {
    border: '1px solid #FFFFFF',
    borderRadius: '5px',
    width: '200px',
    padding: '3px',
    '& svg': {
      color: 'white'
    },
    '& input': {
      color: 'white',
      width: '100%'
    },
    '& input:focus': {
      outlineWidth: 0
    },
    '& fieldset': {
      borderStyle: 'none'
    },
    height: '45px'
  },
  option: {
    fontSize: 15
  }
}));
