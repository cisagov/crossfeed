/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useStaticQuery, graphql } from 'gatsby';

import Banner from './banner';
import Footer from './footer';
import Header from './header';
import Nav from './nav';

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          navigation {
            title
            items {
              text
              link
              rootLink
            }
          }
          secondaryLinks {
            text
            link
          }
        }
      }
    }
  `);

  const { title, navigation, secondaryLinks } = data.site.siteMetadata;

  return (
    <>
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>
      <Banner />
      <div className="usa-overlay" />
      <Header siteTitle={title}>
        <Nav {...{ navigation, secondaryLinks }} />
      </Header>
      {children}
      <Footer />
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
