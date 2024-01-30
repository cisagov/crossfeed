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

export function Head() {
  return (
    <>
      <meta
        httpEquiv={'Content-Security-Policy'}
        content={"object-src 'none'; script-src 'self'; base-uri 'none'"}
      />
      <meta httpEquiv={'X-Frame-Options'} content={'DENY'} />
      <meta
        httpEquiv={'Access-Control-Allow-Origin'}
        content={'https://docs.crossfeed.cyber.dhs.gov'}
      />
    </>
  );
}

export default IndexPage;
