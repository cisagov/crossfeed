import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import { Sidenav } from '../components/sidenav';
import SwaggerUI from 'swagger-ui-react';
import spec from '../generated/swagger.json';
import * as diagramHTML from './architecture-diagram.html';

/*
  This template is for a single page that does not have a date associated with it. For example, an about page.
*/

const DocumentationPage = ({ data, location }) => {
  const { markdownRemark } = data;
  const { frontmatter, html, fields, headings } = markdownRemark;
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="usa-layout-docs usa-section">
        <div className="grid-container">
          <div className="grid-row grid-gap">
            <Sidenav
              sidenav={frontmatter.sidenav}
              current={fields.slug}
              headings={headings}
            />
            <main
              id="main-content"
              className="usa-layout-docs__main desktop:grid-col-9 usa-prose"
            >
              <h2>{frontmatter.title}</h2>
              <div
                className="usa-prose"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {fields.slug === '/api-reference/' && (
                <div style={{ marginTop: 20 }}>
                  <SwaggerUI spec={spec} />
                </div>
              )}
              {fields.slug === '/dev/architecture/' && (
                <div style={{ marginTop: 20 }}>
                  <iframe
                    srcDoc={diagramHTML.default}
                    style={{ width: '100%', minHeight: 800, border: 0 }}
                  ></iframe>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query ($name: String!) {
    markdownRemark(
      fields: { sourceName: { eq: "documentation-pages" }, slug: { eq: $name } }
    ) {
      html
      frontmatter {
        title
        sidenav
      }
      fields {
        slug
      }
      headings {
        value
        depth
      }
    }
  }
`;

export default DocumentationPage;
