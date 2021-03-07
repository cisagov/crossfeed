import React from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';

/*
  The sidenav is not loaded by default on the main pages. To include this navigation you can
  add "sidenav: contributing" or "sidenav: user-guide" in the front-matter of your markdown pages
*/

const Sidenav = ({ current, headings, items }) => {
  const SidenavItem = ({ link, children }) => {
    const isSelected = current === link;

    return (
      <>
        <li className="usa-sidenav__item">
          <Link to={link} className={classNames({ 'usa-current': isSelected })}>
            {children}
          </Link>
          {isSelected && (
            <ul class="usa-sidenav__sublist">
              {headings.map(({ value, depth }) => (
                <li className="usa-sidenav__item">
                  <a href={`#${value.replace(/\s/g, '-').toLowerCase()}`}>
                    <span
                      style={{
                        display: 'block',
                        paddingLeft: `${depth - 3}em`,
                      }}
                    >
                      {value}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      </>
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

export const SidenavContributing = (props) => (
  <Sidenav
    items={[
      { text: 'Contribution Guidelines', link: '/contributing/' },
      { text: 'Development Setup', link: '/contributing/setup/' },
      { text: 'Architecture', link: '/contributing/architecture/' },
      { text: 'Deployment', link: '/contributing/deployment/' },
    ]}
    {...props}
  />
);

export const SidenavUserGuide = (props) => (
  <Sidenav
    items={[
      { text: 'Crossfeed Product Overview', link: '/usage/product-overview/' },
      { text: 'Getting Started', link: '/usage/' },
      { text: 'Administration', link: '/usage/administration/' },
      { text: 'Customization', link: '/usage/customization/' },
    ]}
    {...props}
  />
);
