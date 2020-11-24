import React from 'react';
import { Link } from 'gatsby';
import classNames from "classnames";

/*
  The sidenav is not loaded by default on the main pages. To include this navigation you can
  add "sidenav: contributing" or "sidenav: user-guide" in the front-matter of your markdown pages
*/

export const SidenavContributing = ({ name }) => (
  <aside className="usa-layout-docs-sidenav desktop:grid-col-3 padding-bottom-4">
    <nav>
      <ul className="usa-sidenav">
        <li className="usa-sidenav__item">
          <Link to="/contributing" className={classNames({"usa-current": name === "contributing"})}>Contribution Guidelines</Link>
        </li>
        <li className="usa-sidenav__item">
          <Link to="/setup" className={classNames({"usa-current": name === "setup"})}>Development Setup</Link>
        </li>
        <li className="usa-sidenav__item">
          <Link to="/architecture" className={classNames({"usa-current": name === "architecture"})}>Architecture</Link>
        </li>
        <li className="usa-sidenav__item">
          <Link to="/deployment" className={classNames({"usa-current": name === "deployment"})}>Deployment</Link>
        </li>
      </ul>
    </nav>
  </aside>
);

export const SidenavUserGuide = ({ name }) => (
  <aside className="usa-layout-docs-sidenav desktop:grid-col-3 padding-bottom-4">
    <nav>
      <ul className="usa-sidenav">
      <li className="usa-sidenav__item">
          <Link to="/usage" className={classNames({"usa-current": name === "usage"})}>Getting Started</Link>
        </li>
        <li className="usa-sidenav__item">
          <Link to="/administration" className={classNames({"usa-current": name === "administration"})}>Administration</Link>
        </li>
        <li className="usa-sidenav__item">
          <Link to="/customization" className={classNames({"usa-current": name === "customization"})}>Customization</Link>
        </li>
      </ul>
    </nav>
  </aside>
);
