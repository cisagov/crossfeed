import React from 'react';
import image from "../images/crossfeed-search-result.png";

/*
  This will be displayed on the homepage. Ideally, you want to highlight key goals of the website
*/

const Hero = () => (
  <section className="usa-hero" style={{backgroundImage: `url(${image})`}}>
    <div className="grid-container">
      <div className="usa-hero__callout">
        <h2 className="usa-hero__heading">
          <span className="usa-hero__heading--alt">Crossfeed:</span>Bring visibility to public vulnerabilities
        </h2>
        <p>
          Support the callout with some short explanatory text. You don’t need
          more than a couple of sentences.
        </p>
        <a className="usa-button" href="/">
          Learn more
        </a>
      </div>
    </div>
  </section>
);

export default Hero;
