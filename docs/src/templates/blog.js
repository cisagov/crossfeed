import React from 'react';
import { graphql, Link } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';

const Blog = ({ data, pageContext }) => {
  const posts = data.allMarkdownRemark.edges.map(({ node }) => ({
    html: node.html,
    ...node.frontmatter,
    path: '/blog/' + node.fields.name,
  }));
  return (
    <Layout>
      <SEO title="Blog" />
      <div
        id="blog"
        className="bg-primary-darker usa-content font-serif-lg padding-y-6"
      >
        <div className="grid-container">
          <h1 className="text-normal text-white margin-0">Blog</h1>
          <span className="text-base-lighter display-block padding-top-1 text-light">
            This is a description of the page.
          </span>
        </div>
      </div>
      <div className="grid-container">
        <div className="grid-row">
          <div className="desktop:grid-col-8 usa-prose padding-right-4">
            <main id="main-content">
              {/* This loops through the paginated posts */}
              {posts.map(post => (
                <div
                  key={post.title}
                  className="padding-bottom-5 margin-top-4 usa-prose border-bottom-05 border-base-lightest"
                >
                  <h3 className="title">
                    <Link className="usa-link text-no-underline" to={post.path}>
                      {post.title}
                    </Link>
                  </h3>
                  <div className="text-base margin-bottom-2">
                    <div className="margin-top-neg-105">
                      By <span className="text-bold">{post.author}</span> ·{' '}
                      {post.date}
                    </div>
                  </div>
                  {/*
                    We default to using post.html, but you can also use post.excerpt.
                    If you use excerpt then you have to make sure the content is on each
                    post header
                  */}
                  <div dangerouslySetInnerHTML={{ __html: post.html }} />
                </div>
              ))}

              {/* Pagination links */}
              <div className="grid-row padding-top-2">
                <div className="tablet:grid-col-4 text-center tablet:order-2 font-body-xs text-base">
                  Page {pageContext.humanPageNumber} of{' '}
                  {pageContext.numberOfPages}
                </div>
                <div className="tablet:grid-col-4 text-right tablet:order-3">
                  {pageContext.nextPagePath && (
                    <>
                      <Link
                        to={pageContext.nextPagePath}
                        className="paginate-link usa-link text-no-underline text-bold tablet:margin-top-0"
                      >
                        Next {pageContext.limit} Posts &rsaquo;
                      </Link>
                      <Link
                        to={pageContext.nextPagePath}
                        className="paginate-button usa-button margin-top-3"
                      >
                        Next {pageContext.limit} Posts &rsaquo;
                      </Link>
                    </>
                  )}
                </div>
                <div className="tablet:grid-col-4 text-left tablet:order-1">
                  {pageContext.previousPagePath && (
                    <>
                      <Link
                        to={pageContext.previousPagePath}
                        className="paginate-link usa-link text-no-underline text-bold tablet:margin-top-0"
                      >
                        &lsaquo; Previous {pageContext.limit} Posts
                      </Link>
                      <Link
                        to={pageContext.previousPagePath}
                        className="paginate-button usa-button margin-top-2"
                      >
                        &lsaquo; Previous {pageContext.limit} Posts
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
          <aside className="desktop:grid-col-fill margin-top-4 padding-right-4">
            <div className="border-top-1 border-accent-cool-darker padding-top-2 margin-bottom-4 usa-prose">
              <h4 className="">Most Recent Posts</h4>
              <ul className="usa-list usa-list--unstyled padding-top-2">
                {posts.map(post => (
                  <li key={post.title} className="padding-bottom-1">
                    <Link className="usa-link" to={post.path}>
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-top-1 border-accent-cool-darker padding-top-2 margin-bottom-4 usa-prose">
              <h4>Another list of links</h4>
              <ul className=" usa-list usa-list--unstyled padding-top-2">
                <li className="padding-bottom-1">
                  <Link className="usa-link" to="/blog">
                    Most popular
                  </Link>
                </li>
                <li className="padding-bottom-1">
                  <Link className="usa-link" to="/blog">
                    Another popular post
                  </Link>
                </li>
                <li className="padding-bottom-1">
                  <Link className="usa-link" to="/blog">
                    This is popular
                  </Link>
                </li>
                <li className="padding-bottom-1">
                  <Link className="usa-link" to="/blog">
                    A very long blog header that is popular
                  </Link>
                </li>
                <li className="padding-bottom-1">
                  <Link className="usa-link" to="/blog">
                    A popular post on a blog
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border-top-1 border-accent-cool-darker padding-top-2 margin-bottom-4 usa-prose">
              <h4>Social links</h4>
              <ul className="usa-list usa-list--unstyled padding-top-2">
                <li className="padding-bottom-1">
                  <svg
                    style={{ verticalAlign: 'middle' }}
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="twitter"
                    className="svg-inline--fa fa-twitter fa-w-16 text-primary width-2 margin-right-2"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"
                    ></path>
                  </svg>
                  <a className="usa-link" href="/blog">
                    @18F on Twitter
                  </a>
                </li>
                <li className="padding-bottom-1">
                  <svg
                    style={{ verticalAlign: 'middle' }}
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="github"
                    className="svg-inline--fa fa-github fa-w-16 text-primary width-2 margin-right-2"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 496 512"
                  >
                    <path
                      fill="currentColor"
                      d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                    ></path>
                  </svg>
                  <a className="usa-link" href="/blog">
                    Github
                  </a>
                </li>
                <li className="padding-bottom-1">
                  <svg
                    style={{ verticalAlign: 'middle' }}
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="rss"
                    className="svg-inline--fa fa-rss fa-w-14 text-primary width-2 margin-right-2"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M128.081 415.959c0 35.369-28.672 64.041-64.041 64.041S0 451.328 0 415.959s28.672-64.041 64.041-64.041 64.04 28.673 64.04 64.041zm175.66 47.25c-8.354-154.6-132.185-278.587-286.95-286.95C7.656 175.765 0 183.105 0 192.253v48.069c0 8.415 6.49 15.472 14.887 16.018 111.832 7.284 201.473 96.702 208.772 208.772.547 8.397 7.604 14.887 16.018 14.887h48.069c9.149.001 16.489-7.655 15.995-16.79zm144.249.288C439.596 229.677 251.465 40.445 16.503 32.01 7.473 31.686 0 38.981 0 48.016v48.068c0 8.625 6.835 15.645 15.453 15.999 191.179 7.839 344.627 161.316 352.465 352.465.353 8.618 7.373 15.453 15.999 15.453h48.068c9.034-.001 16.329-7.474 16.005-16.504z"
                    ></path>
                  </svg>
                  <a className="usa-link" href="/blog">
                    RSS Feed
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
        <div className="grid-row padding-top-4 tablet:padding-x-4 margin-bottom-4">
          <a className="usa-link" href="#blog">
            Return to top
          </a>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      filter: { fields: { sourceName: { eq: "blog-posts" } } }
      sort: { fields: frontmatter___date, order: DESC }
      skip: $skip
      limit: $limit
    ) {
      edges {
        node {
          html
          frontmatter {
            author
            date
            title
          }
          fields {
            name
          }
        }
      }
    }
  }
`;

export default Blog;
