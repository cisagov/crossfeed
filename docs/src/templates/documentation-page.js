import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Sidenav, {
  SidenavContributing,
  SidenavUserGuide,
} from '../components/sidenav';

/*
  This template is for a single page that does not have a date associated with it. For example, an about page.
*/

const DocumentationPage = ({ data }) => {
  const { markdownRemark } = data;
  const { frontmatter, html, fields } = markdownRemark;

  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="usa-layout-docs usa-section">
        <div className="grid-container">
          <div className="grid-row grid-gap">
            {frontmatter.sidenav === 'contributing' && (
              <SidenavContributing name={fields.name} />
            )}
            {frontmatter.sidenav === 'user-guide' && (
              <SidenavUserGuide name={fields.name} />
            )}

            <main
              id="main-content"
              className="usa-layout-docs__main desktop:grid-col-9 usa-prose"
            >
              <h2>{frontmatter.title}</h2>
              <div
                className="usa-prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query($name: String!) {
    markdownRemark(
      fields: { sourceName: { eq: "documentation-pages" }, name: { eq: $name } }
    ) {
      html
      frontmatter {
        title
        sidenav
      }
      fields {
        name
      }
    }
  }
`;

export default DocumentationPage;
