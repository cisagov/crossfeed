/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

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

  const slug = createFilePath({
    node,
    getNode,
    basePath: `src/documentation-pages`,
  });
  createNodeField({
    node,
    name: 'slug',
    value: slug,
  });
};

exports.createPages = async ({ actions, graphql }) => {
  const { createPage, createRedirect } = actions;

  createRedirect({
    fromPath: '/usage',
    toPath: '/user-guide/quickstart',
    isPermanent: false,
  });

  await createMarkdownPages(createPage, graphql);
};

async function createMarkdownPages(createPage, graphql) {
  const pageTemplate = path.resolve('./src/templates/documentation-page.js');
  const pages = await markdownQuery(graphql, 'documentation-pages');

  pages.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: pageTemplate,
      context: {
        name: node.fields.slug,
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
              slug
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

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            minimize: false,
          },
        },
      ],
    },
  });
};
