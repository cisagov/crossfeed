import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Header as UsaHeader,
  NavMenuButton,
  Title,
  PrimaryNav
} from '@trussworks/react-uswds';
import logo from './cisa_logo.png';
import classes from './styles.module.scss';
import { useAuthContext } from 'context';

export const Header: React.FC = () => {
  const { user } = useAuthContext();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const onExpandMobile: React.MouseEventHandler<HTMLButtonElement> = e => {
    setMobileExpanded(expanded => !expanded);
  };

  const userNav = [
    <NavLink
      activeClassName="usa-current"
      to="/"
      exact
      key="dashboard"
      className="usa-nav__link"
    >
      <span>Dashboard</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/risk"
      key="risk"
      className="usa-nav__link"
    >
      <span>Risk Summary</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/organizations"
      key="organizations"
      className="usa-nav__link"
    >
      <span>My Organizations</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/settings"
      key="settings"
      className="usa-nav__link"
    >
      <span>My Account</span>
    </NavLink>
  ];

  const adminNav = [
    <NavLink
      activeClassName="usa-current"
      to="/"
      exact
      key="dashboard"
      className="usa-nav__link"
    >
      <span>Dashboard</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/risk"
      key="risk"
      className="usa-nav__link"
    >
      <span>Risk Summary</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/scans"
      key="scans"
      className="usa-nav__link"
    >
      <span>Scans</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/organizations"
      key="organizations"
      className="usa-nav__link"
    >
      <span>Organizations</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/users"
      key="users"
      className="usa-nav__link"
    >
      <span>Users</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/settings"
      key="settings"
      className="usa-nav__link"
    >
      <span>My Account</span>
    </NavLink>
  ];

  let nav: JSX.Element[] = [];
  if (user && user.isRegistered) {
    if (user.userType === 'standard') nav = userNav;
    else nav = adminNav;
  }

  return (
    <UsaHeader basic className={classes.root}>
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <Link to="/">
            <Title>
              <img src={logo} alt="Crossfeed logo" />
            </Title>
          </Link>
          <NavMenuButton label="Menu" onClick={onExpandMobile} />
        </div>

        <PrimaryNav
          mobileExpanded={mobileExpanded}
          onToggleMobileNav={onExpandMobile}
          items={nav}
        />
      </div>
    </UsaHeader>
  );
};
