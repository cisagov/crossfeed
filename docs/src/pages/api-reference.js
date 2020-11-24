import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const IndexPage = () => (
  <Layout>
    <SEO title="API Reference" />
    <SwaggerUI url="https://petstore.swagger.io/v2/swagger.json" />
  </Layout>
);

export default IndexPage;
