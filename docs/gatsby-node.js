/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const { paginate } = require('gatsby-awesome-pagination');

// Adds the source "name" from the filesystem plugin to the markdown remark nodes
// so we can filter by it.
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  // We only care about MarkdownRemark content.
  if (node.internal.type !== 'MarkdownRemark') {
    return;
  }

  const fileNode = getNode(node.parent);

  createNodeField({
    node,
    name: 'sourceName',
    value: fileNode.sourceInstanceName,
  });
  
  createNodeField({
    node,
    name: 'name',
    value: fileNode.name,
  });
};

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions;

  await createBlogPages(createPage, graphql);
  await createMarkdownPages(createPage, graphql);
};

async function createBlogPages(createPage, graphql) {
  const blogTemplate = path.resolve('./src/templates/blog.js');
  const postTemplate = path.resolve('./src/templates/blog-post.js');
  const posts = await markdownQuery(graphql, 'blog-posts');

  // Create pagination index page
  paginate({
    createPage,
    items: posts,
    itemsPerPage: 3,
    pathPrefix: '/blog',
    component: blogTemplate,
  });

  // Create individual pages
  posts.forEach(({ node }) => {
    createPage({
      path: 'blog/' + node.fields.name,
      component: postTemplate,
      context: {
        name: node.fields.name
      },
    });
  });
}

async function createMarkdownPages(createPage, graphql) {
  const pageTemplate = path.resolve('./src/templates/documentation-page.js');
  const pages = await markdownQuery(graphql, 'documentation-pages');

  pages.forEach(({ node }) => {
    createPage({
      path: node.fields.name,
      component: pageTemplate,
      context: {
        name: node.fields.name
      },
    });
  });
}

async function markdownQuery(graphql, source) {
  const result = await graphql(`
    {
      allMarkdownRemark(filter: { fields: { sourceName: { eq: "${source}" } } }) {
        edges {
          node {
            fields {
              name
            }
          }
        }
      }
    }
  `);

  if (result.errors) {
    console.error(result.errors);
  }

  return result.data.allMarkdownRemark.edges;
}
