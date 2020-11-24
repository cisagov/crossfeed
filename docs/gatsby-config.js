module.exports = {
  siteMetadata: {
    author: 'Foo',
    title: `Crossfeed`,
    description: `Crossfeed is a tool that continuously enumerates and monitors an organization's public-facing attack surface in order to discover assets and flag potential security flaws.`,
    navigation: [
      {
        items: [{ text: 'Home', link: '/' }],
      },
      {
        items: [{ text: 'Blog', link: '/blog' }],
      },
      {
        items: [{ text: 'Document', link: '/document' }],
      },
      {
        items: [
          { text: 'Document with sidenav', link: '/document-with-sidenav' },
        ],
      },
      {
        title: 'Document submenu',
        items: [
          { text: 'Navigation link', link: '/' },
          { text: 'Navigation link', link: '/' },
          { text: 'Navigation link', link: '/' },
        ],
      },
    ],
    secondaryLinks: [
      { text: 'Secondary link', link: '/' },
      { text: 'Another secondary link', link: '/' },
    ],

    /**
     * Search.gov configuration
     * 
     * 1. Create an account with Search.gov https://search.usa.gov/signup
     * 2. Add a new site.
     * 3. Add your site/affiliate name here.
     */
    searchgov: {
      
      // You should not change this.
      endpoint: 'https://search.usa.gov',
      
      // replace this with your search.gov account
      affiliate: 'federalist-uswds-example',
      
      // replace with your access key
      access_key: '...',
      
      // this renders the results within the page instead of sending to user to search.gov
      inline: true, 
    },

    /**
     * Digital Analytics Program (DAP) configuration
     * 
     * USAID   - Agency for International Development
     * USDA    - Department of Agriculture
     * DOC     - Department of Commerce
     * DOD     - Department of Defense
     * ED      - Department of Education
     * DOE     - Department of Energy
     * HHS     - Department of Health and Human Services
     * DHS     - Department of Homeland Security
     * HUD     - Department of Housing and Urban Development
     * DOJ     - Department of Justice
     * DOL     - Department of Labor
     * DOS     - Department of State
     * DOI     - Department of the Interior
     * TREAS   - Department of the Treasury
     * DOT     - Department of Transportation
     * VA      - Department of Veterans Affairs
     * EPA     - Environmental Protection Agency
     * EOP     - Executive Office of the President
     * GSA     - General Services Administration
     * NASA    - National Aeronautics and Space Administration
     * NARA    - National Archives and Records Administration
     * NSF     - National Science Foundation
     * NRC     - Nuclear Regulatory Commission
     * OPM     - Office of Personnel Management
     * USPS    - Postal Service
     * SBA     - Small Business Administration
     * SSA     - Social Security Administration
     */
    dap: {
      // agency: 'your-agency',

      // Optional
      // subagency: 'your-subagency',
    },

    /**
     * Google Analytics configuration
     */
    ga: {
      // ua: 'your-ua',
    },
  },
  pathPrefix: process.env.BASEURL || '/',
  plugins: [
    `gatsby-plugin-sass`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog-posts`,
        path: `${__dirname}/src/blog-posts`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `documentation-pages`,
        path: `${__dirname}/src/documentation-pages`,
      },
    },
    `gatsby-transformer-remark`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/federalist-icon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-netlify-cms`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
};
