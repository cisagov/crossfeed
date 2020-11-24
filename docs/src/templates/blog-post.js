import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';

/*
  This is used in blog posts. The index page can be found at src/pages/blog.js
*/

const BlogPost = ({ data }) => {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="usa-layout-docs usa-section">
        <div className="grid-container">
          <div className="grid-row grid-gap">
            <div className="usa-layout-docs__main desktop:grid-col-9 usa-prose">
              <main id="main-content">
                <h1 className="title">{frontmatter.title}</h1>
                <div className="text-base margin-bottom-2">
                  <div className="margin-top-neg-105">
                    By <span className="text-bold">{frontmatter.author}</span> ·{' '}
                    {frontmatter.date}
                  </div>
                  <span dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query($name: String!) {
    markdownRemark(
      fields: {
        sourceName: { eq: "blog-posts" }
        name: { eq: $name }
      }
    ) {
      html
      frontmatter {
        author
        date
        title
      }
    }
  }
`;

export default BlogPost;
