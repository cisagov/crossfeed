import React from 'react';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Hero from '../components/hero';
import Tagline from '../components/tagline';
import Highlights from '../components/highlights';

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <Hero />
    <Tagline />
    <Highlights />
  </Layout>
);

export default IndexPage;
