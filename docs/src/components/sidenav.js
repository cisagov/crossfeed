import React from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';

/*
  The sidenav is not loaded by default on the main pages. To include this navigation you can
  add "sidenav: contributing" or "sidenav: user-guide" in the front-matter of your markdown pages
*/

const Sidenav = ({ current, items }) => {
  const SidenavItem = ({ link, children }) => {
    return (
      <li className="usa-sidenav__item">
        <Link
          to={link}
          className={classNames({ 'usa-current': '/' + current === link })}
        >
          {children}
        </Link>
      </li>
    );
  };
  return (
    <aside className="usa-layout-docs-sidenav desktop:grid-col-3 padding-bottom-4">
      <nav> 
        <ul className="usa-sidenav">
          {items.map((item) => (
            <SidenavItem link={item.link}>{item.text}</SidenavItem>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export const SidenavContributing = props => (
  <Sidenav
    items={[
      { text: 'Contribution Guidelines', link: '/contributing' },
      { text: 'Development Setup', link: '/setup' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Deployment', link: '/deployment' },
    ]}
    {...props}
  />
);

export const SidenavUserGuide = props => (
  <Sidenav
    items={[
      { text: 'Crossfeed Product Overview', link: '/product-overview' },
      { text: 'Getting Started', link: '/usage' },
      { text: 'Administration', link: '/administration' },
      { text: 'Customization', link: '/customization' },
    ]}
    {...props}
  />
);
