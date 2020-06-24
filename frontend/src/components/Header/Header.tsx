import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Header as UsaHeader,
  NavMenuButton,
  Title,
  PrimaryNav,
} from "@trussworks/react-uswds";
import logo from "./dds.png";
import classes from "./styles.module.scss";
import { useAuthContext } from "context";

export const Header: React.FC = () => {
  const { user } = useAuthContext();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const onExpandMobile: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setMobileExpanded((expanded) => !expanded);
  };

  const authNavItems = [
    <NavLink
      activeClassName="usa-current"
      to="/"
      exact
      key="home"
      className="usa-nav__link"
    >
      <span>Dashboard</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/vulnerabilities"
      key="home"
      className="usa-nav__link"
    >
      <span>Vulnerabilities</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/risk"
      key="home"
      className="usa-nav__link"
    >
      <span>Risk Summary</span>
    </NavLink>,
    <NavLink
      activeClassName="usa-current"
      to="/settings"
      key="home"
      className="usa-nav__link"
    >
      <span>Settings</span>
    </NavLink>,
  ];

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
          items={user ? authNavItems : []}
        />
      </div>
    </UsaHeader>
  );
};
