import { Link } from 'gatsby';
import React from 'react';
import { Location } from '@reach/router';

import close from '../../node_modules/uswds/dist/img/close.svg';
import SearchForm from './search-form';

const Nav = ({ navigation, secondaryLinks }) => (
  <nav role="navigation" className="usa-nav">
    <div className="usa-nav__inner">
      <button className="usa-nav__close">
        <img src={close} alt="close" />
      </button>
      <ul className="usa-accordion usa-nav__primary">
        {navigation.map((navGroup, idx) => (
          <li key={idx} className="usa-nav__primary-item">
            {navGroup.items.length > 1 ? (
              <>
                <button
                  className={`usa-accordion__button usa-nav__link ${
                    idx === 0 ? 'usa-current' : ''
                  }`}
                  aria-controls={`extended-nav-section-${idx}`}
                  aria-expanded={false}
                >
                  <span>{navGroup.title}</span>
                </button>
                <ul
                  id={`extended-nav-section-${idx}`}
                  className="usa-accordion__content usa-nav__submenu"
                  hidden
                >
                  {navGroup.items.map((navItem, idx) => (
                    <li key={idx} className="usa-nav__submenu-item">
                      <Link to={navItem.link}>{navItem.text}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Location>
                {({ location }) => (
                  <Link
                    className={
                      `usa-nav__link ` +
                      (location.pathname.startsWith(navGroup.items[0].rootLink)
                        ? 'usa-current'
                        : '')
                    }
                    activeClassName="usa-current"
                    to={navGroup.items[0].link}
                  >
                    <span>{navGroup.items[0].text}</span>
                  </Link>
                )}
              </Location>
            )}
          </li>
        ))}
      </ul>
      <div className="usa-nav__secondary">
        <ul className="usa-nav__secondary-links">
          {secondaryLinks.map((secondaryLink, idx) => (
            <li key={idx} className="usa-nav__secondary-item">
              {secondaryLink.link.startsWith('http') ? (
                <a target="_blank" href={secondaryLink.link}>
                  {secondaryLink.text}
                </a>
              ) : (
                <Link to={secondaryLink.link}>{secondaryLink.text}</Link>
              )}
            </li>
          ))}
        </ul>
        {/* <SearchForm /> */}
      </div>
    </div>
  </nav>
);

export default Nav;
