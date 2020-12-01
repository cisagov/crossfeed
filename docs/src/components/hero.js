import React from 'react';
import image from '../images/crossfeed-search-result.png';

/*
  This will be displayed on the homepage. Ideally, you want to highlight key goals of the website
*/

const Hero = () => (
  <section className="usa-hero" style={{ backgroundImage: `url(${image})` }}>
    <div className="grid-container">
      <div className="usa-hero__callout">
        <h2 className="usa-hero__heading">
          {/* <span className="usa-hero__heading--alt">Understand your infrastructure.</span> */}
          Understand your infrastructure.
        </h2>
        <p>
          Crossfeed lets you monitor and discover your public-facing
          infrastructure, as well as bring better visibility to vulnerabilities.
        </p>
        <a className="usa-button" href="#highlights">
          Learn more
        </a>
      </div>
    </div>
  </section>
);

export default Hero;
