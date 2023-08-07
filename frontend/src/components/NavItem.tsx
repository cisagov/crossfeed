import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import classes from 'classnames';
import { NavLink, useRouteMatch, useHistory } from 'react-router-dom';
import { Menu, MenuItem, Button } from '@mui/material';

interface LinkConfig {
  title: string | JSX.Element;
  path: string;
  onClick?: any;
}

interface Props {
  nested?: LinkConfig[];
  path?: string;
  title: string | JSX.Element;
  exact?: boolean;
  onClick?: any;
}

export const NavItem: React.FC<Props> = (props) => {
  const { title, path, nested, exact, onClick } = props;
  const match = useRouteMatch(path ?? '');
  const history = useHistory();
  const [anchor, setAnchor] = useState<any>(null);
  const [mouseInButton, setMouseInButton] = useState(false);
  const [mouseInMenu, setMouseInMenu] = useState(false);

  const onClickButton = (e: any) => {
    setAnchor(e.currentTarget);
    setMouseInButton(true);
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
    <Root>
      {path ? (
        <NavLink
          to={path}
          activeClassName={
            path !== '#' ? classesNav.activeLink : classesNav.link
          }
          className={classesNav.link}
          onClick={onClick ? onClick : onClickButton}
          exact={exact}
          style={{ outline: 'none' }}
        >
          {title}
        </NavLink>
      ) : (
        <Button
          className={classes(classesNav.link, {
            [classesNav.activeLink]: !!match
          })}
          onClick={onClick ? onClick : onClickButton}
          style={{ outline: 'none' }}
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
          keepMounted
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'center'
          }}
        >
          {nested.map((item) => (
            <MenuItem
              key={item.title.toString()}
              onClick={
                item.onClick ? item.onClick : () => navigateTo(item.path)
              }
              style={{ outline: 'none' }}
            >
              {item.title}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Root>
  );
};

//Styling
const PREFIX = 'NavItem';

const classesNav = {
  inner: `${PREFIX}-inner`,
  menuButton: `${PREFIX}-menuButton`,
  activeLink: `${PREFIX}-activeLink`,
  activeMobileLink: `${PREFIX}-activeMobileLink`,
  link: `${PREFIX}-link`,
  userLink: `${PREFIX}-userLink`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classesNav.inner}`]: {
    maxWidth: 1440,
    width: '100%',
    margin: '0 auto'
  },

  [`& .${classesNav.menuButton}`]: {
    marginRight: theme.spacing(2),
    display: 'block',
    [theme.breakpoints.up('lg')]: {
      display: 'none'
    }
  },

  [`& .${classesNav.activeLink}`]: {
    '&:after': {
      content: "''",
      position: 'absolute',
      bottom: 0,
      left: 6,
      width: '100%',
      height: 2,
      backgroundColor: 'white'
    }
  },

  [`& .${classesNav.activeMobileLink}`]: {
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

  [`& .${classesNav.link}`]: {
    position: 'relative',
    color: 'white',
    textDecoration: 'none',
    margin: `0 ${theme.spacing()}px`,
    padding: theme.spacing(),
    borderBottom: '2px solid transparent',
    fontWeight: 600
  },

  [`& .${classesNav.userLink}`]: {
    display: 'flex',
    alignItems: 'center',

    '& svg': {
      marginRight: theme.spacing()
    }
  }
}));
