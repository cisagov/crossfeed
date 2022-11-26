module.exports = {
  siteMetadata: {
    author: 'CISA',
    title: `Crossfeed`,
    description: `Crossfeed is a tool that continuously enumerates and monitors an organization's public-facing attack surface in order to discover assets and flag potential security flaws.`,
    navigation: [
      {
        items: [{ text: 'Home', link: '/' }],
      },
      {
        items: [
          {
            text: 'User Guide',
            link: '/user-guide/quickstart/',
            // If rootLink is specified, this navigation item will be
            // highlighted as current when the user navigates to sub-pages whose
            // paths start with the given rootLink.
            rootLink: '/user-guide/',
          },
        ],
      },
      {
        items: [
          { text: 'Development', link: '/dev/quickstart/', rootLink: '/dev/' },
        ],
      },
      {
        items: [{ text: 'Scanning FAQ', link: '/scans/' }],
      },
      {
        title: '',
        items: [{ text: 'API Reference', link: '/api-reference/' }],
      },
    ],
    secondaryLinks: [
      {
        text: 'Find Crossfeed on GitHub',
        link: 'https://github.com/cisagov/crossfeed',
      },
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
    `gatsby-plugin-sharp`,
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
        name: `documentation-pages`,
        path: `${__dirname}/src/documentation-pages`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-autolink-headers`,
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              prompt: {
                user: 'root',
                host: 'localhost',
              },
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Crossfeed Documentation`,
        short_name: `Crossfeed`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/logo.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-meta-redirect`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
};
