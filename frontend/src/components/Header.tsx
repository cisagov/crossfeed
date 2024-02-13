import React, { useCallback, useState, useContext, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { NavLink, Link, useHistory, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  ListItem,
  List,
  TextField,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as UserIcon,
  ArrowDropDown
} from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import { NavItem } from './NavItem';
import { useRouteMatch } from 'react-router-dom';
import { useAuthContext, CFThemeContext } from 'context';
import logo from '../assets/crossfeed.svg';
import { withSearch } from '@elastic/react-search-ui';
import { ContextType } from 'context/SearchProvider';
import { SearchBar } from 'components';
import { Autocomplete } from '@mui/material';
import { Organization, OrganizationTag } from 'types';

const PREFIX = 'Header';

const classes = {
  inner: `${PREFIX}-inner`,
  menuButton: `${PREFIX}-menuButton`,
  logo: `${PREFIX}-logo`,
  spacing: `${PREFIX}-spacing`,
  activeLink: `${PREFIX}-activeLink`,
  activeMobileLink: `${PREFIX}-activeMobileLink`,
  link: `${PREFIX}-link`,
  userLink: `${PREFIX}-userLink`,
  lgNav: `${PREFIX}-lgNav`,
  mobileNav: `${PREFIX}-mobileNav`,
  selectOrg: `${PREFIX}-selectOrg`,
  option: `${PREFIX}-option`
};

const Root = styled('div')(({ theme }) => ({
  [`.${classes.inner}`]: {
    maxWidth: 1440,
    width: '250%',
    margin: '0 auto'
  },

  [`.${classes.menuButton}`]: {
    marginLeft: theme.spacing(2),
    display: 'flex',
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
  },

  [`.${classes.logo}`]: {
    width: 150,
    padding: theme.spacing(),
    paddingLeft: 0,
    [theme.breakpoints.down('xl')]: {
      display: 'flex'
    }
  },

  [`.${classes.spacing}`]: {
    flexGrow: 1
  },

  [`.${classes.activeLink}`]: {
    ':after': {
      content: "''",
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      backgroundColor: 'white'
    }
  },

  [`.${classes.activeMobileLink}`]: {
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

  [`.${classes.link}`]: {
    position: 'relative',
    color: 'white',
    textDecoration: 'none',
    margin: `0 ${theme.spacing()}px`,
    padding: theme.spacing(),
    borderBottom: '2px solid transparent',
    fontWeight: 600
  },

  [`.${classes.userLink}`]: {
    [theme.breakpoints.down('md')]: {
      display: 'flex'
    },
    [theme.breakpoints.up('lg')]: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '1rem',
      '& svg': {
        marginRight: theme.spacing()
      },
      border: 'none',
      textDecoration: 'none'
    }
  },

  [`.${classes.lgNav}`]: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      display: 'flex'
    }
  },

  [`.${classes.mobileNav}`]: {
    padding: `${theme.spacing(2)} ${theme.spacing()}px`
  },

  [`.${classes.selectOrg}`]: {
    border: '1px solid #FFFFFF',
    borderRadius: '5px',
    width: '200px',
    padding: '3px',
    marginLeft: '20px',
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
    '& div div': {
      paddingTop: '0 !important'
    },
    '& div div div': {
      marginTop: '-3px !important'
    },
    height: '45px'
  },

  [` .${classes.option}`]: {
    fontSize: 15
  }
}));

const GLOBAL_ADMIN = 2;
const STANDARD_USER = 1;
const ALL_USERS = GLOBAL_ADMIN | STANDARD_USER;

interface NavItemType {
  title: string | JSX.Element;
  path: string;
  users?: number;
  nested?: NavItemType[];
  onClick?: any;
  exact: boolean;
}

const HeaderNoCtx: React.FC<ContextType> = (props) => {
  const { searchTerm, setSearchTerm } = props;

  const history = useHistory();
  const location = useLocation();
  const {
    currentOrganization,
    setOrganization,
    showAllOrganizations,
    setShowAllOrganizations,
    setShowMaps,
    user,
    logout,
    apiGet
  } = useAuthContext();
  const [navOpen, setNavOpen] = useState(false);
  const [organizations, setOrganizations] = useState<
    (Organization | OrganizationTag)[]
  >([]);
  const [tags, setTags] = useState<OrganizationTag[]>([]);
  const theme = useTheme();
  const { switchDarkMode } = useContext(CFThemeContext);
  const activateDarkMode = useMemo(
    () => (theme.palette.mode === 'dark' ? 'light' : 'dark'),
    [theme.palette.mode]
  );
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  let userLevel = 0;
  if (user && user.isRegistered) {
    if (user.userType === 'standard') {
      userLevel = STANDARD_USER;
    } else {
      userLevel = GLOBAL_ADMIN;
    }
  }

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<Organization[]>('/organizations/');
      let tags: (OrganizationTag | Organization)[] = [];
      if (userLevel === GLOBAL_ADMIN) {
        tags = await apiGet<OrganizationTag[]>('/organizations/tags');
        await setTags(tags as OrganizationTag[]);
      }
      await setOrganizations(tags.concat(rows));
    } catch (e) {
      console.log(e);
    }
  }, [apiGet, setOrganizations, userLevel]);

  React.useEffect(() => {
    if (userLevel > 0) {
      fetchOrganizations();
    }
  }, [fetchOrganizations, userLevel]);

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

    /* 
    Hiding Feeds page until finished
    { title: 'Feeds', 
      path: '/feeds', 
      users: ALL_USERS, 
      exact: false 
    },*/

    /* 
    Hiding Reports page until finished 
    {
      title: 'Reports',
      path: '/reports',
      users: ALL_USERS,
      exact: true
    },*/

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
        title: 'Manage Organizations',
        path: '/organizations',
        users: GLOBAL_ADMIN,
        exact: true
      },
      {
        title: 'My Organizations',
        path: '/organizations',
        users: STANDARD_USER,
        exact: true
      },
      {
        title: 'Manage Users',
        path: '/users',
        users: GLOBAL_ADMIN,
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

  const userItemsSmall: NavItemType[] = [
    {
      title: 'My Account',
      path: '#',
      users: ALL_USERS,
      exact: true
    },
    {
      title: 'Manage Organizations',
      path: '/organizations',
      users: GLOBAL_ADMIN,
      exact: true
    },
    {
      title: 'My Organizations',
      path: '/organizations',
      users: STANDARD_USER,
      exact: true
    },
    {
      title: 'Manage Users',
      path: '/users',
      users: GLOBAL_ADMIN,
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
      path: '/',
      users: ALL_USERS,
      onClick: logout,
      exact: true
    }
  ].filter(({ users }) => (users & userLevel) > 0);

  const orgPageMatch = useRouteMatch('/organizations/:id');

  const desktopNavItems: JSX.Element[] = navItems.map((item) => (
    <NavItem key={item.title.toString()} {...item} />
  ));

  const navItemsToUse = () => {
    if (isSmall) {
      return userItemsSmall;
    } else {
      return navItems;
    }
  };

  return (
    <Root>
      <AppBar position="static" elevation={0}>
        <div className={classes.inner}>
          <Toolbar>
            <Link to="/">
              <img
                src={logo}
                className={classes.logo}
                alt="Crossfeed Icon Navigate Home"
              />
            </Link>
            <div className={classes.lgNav}>{desktopNavItems.slice()}</div>

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
                {organizations.length > 1 && (
                  <>
                    <div className={classes.spacing} />
                    <Autocomplete
                      isOptionEqualToValue={(option, value) =>
                        option?.name === value?.name
                      }
                      options={[{ name: 'All Organizations' }].concat(
                        organizations
                      )}
                      autoComplete={false}
                      className={classes.selectOrg}
                      classes={{
                        option: classes.option
                      }}
                      value={
                        showAllOrganizations
                          ? { name: 'All Organizations' }
                          : currentOrganization ?? undefined
                      }
                      filterOptions={(options, state) => {
                        // If already selected, show all
                        if (
                          options.find(
                            (option) =>
                              option?.name.toLowerCase() ===
                              state.inputValue.toLowerCase()
                          )
                        ) {
                          return options;
                        }
                        return options.filter(
                          (option) =>
                            option?.name
                              .toLowerCase()
                              .includes(state.inputValue.toLowerCase())
                        );
                      }}
                      disableClearable
                      blurOnSelect
                      selectOnFocus
                      getOptionLabel={(option) => option!.name}
                      renderOption={(props, option) => (
                        <li {...props}>{option!.name}</li>
                      )}
                      onChange={(
                        event: any,
                        value: Organization | { name: string } | undefined
                      ) => {
                        if (value && 'id' in value) {
                          setOrganization(value);
                          setShowAllOrganizations(false);
                          if (value.name === 'Election') {
                            setShowMaps(true);
                          } else {
                            setShowMaps(false);
                          }

                          // Check if we're on an organization page and, if so, update it to the new organization
                          if (orgPageMatch !== null) {
                            if (!tags.find((e) => e.id === value.id)) {
                              history.push(`/organizations/${value.id}`);
                            }
                          }
                        } else {
                          setShowAllOrganizations(true);
                          setShowMaps(false);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          inputProps={{
                            ...params.inputProps,
                            id: 'autocomplete-input',
                            autoComplete: 'new-password' // disable autocomplete and autofill
                          }}
                        />
                      )}
                    />
                  </>
                )}
                {isSmall ? null : <NavItem {...userMenu} />}
              </>
            )}
            <IconButton
              edge="start"
              className={classes.menuButton}
              aria-label="toggle mobile menu"
              color="inherit"
              onClick={() => setNavOpen((open) => !open)}
            >
              <MenuIcon />
            </IconButton>
            <Tooltip title={`Switch to ${activateDarkMode} mode`}>
              <span onClick={switchDarkMode} style={{ cursor: 'pointer' }}>
                <Switch
                  checked={theme.palette.mode === 'dark'}
                  color="default"
                  inputProps={{ 'aria-label': 'toggle darkMode' }}
                />
              </span>
            </Tooltip>
          </Toolbar>
        </div>
      </AppBar>

      <Drawer
        anchor="right"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        data-testid="mobilenav"
      >
        <List className={classes.mobileNav}>
          {navItemsToUse().map(({ title, path, nested, onClick }) => (
            <React.Fragment key={title.toString()}>
              {path && (
                <ListItem
                  button
                  exact
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
                  exact
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
    </Root>
  );
};

export const Header = withSearch(
  ({ searchTerm, setSearchTerm }: ContextType) => ({
    searchTerm,
    setSearchTerm
  })
)(HeaderNoCtx);
