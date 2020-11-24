import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import spec from "./swagger.json";

const IndexPage = () => (
  <Layout>
    <SEO title="API Reference" />
    <SwaggerUI spec={spec} />
  </Layout>
);

export default IndexPage;
