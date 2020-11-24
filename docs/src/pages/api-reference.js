import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import spec from '../generated/swagger.json';

const IndexPage = () => (
  <Layout>
    <SEO title="API Reference" />
    <div className="usa-layout-docs usa-section">
      <div className="grid-container">
        {/* <h1>Crossfeed API Reference</h1>
      <p>Below is the API Reference for the Crossfeed REST API.</p> */}
        <SwaggerUI spec={spec} />
      </div>
    </div>
  </Layout>
);

export default IndexPage;
