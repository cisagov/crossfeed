import React from 'react';

/*
  This tagline will appear in your homepage
*/

const Tagline = () => (
  <section className="grid-container usa-section usa-prose">
    <div className="grid-row grid-gap">
      <div className="tablet:grid-col-4">
        <h2 className="font-heading-xl margin-top-0 tablet:margin-bottom-0">
          About Crossfeed
        </h2>
      </div>
      <div className="tablet:grid-col-8 usa-prose">
        <p>
          Crossfeed is a tool that continuously enumerates and monitors an
          organization’s public-facing attack surface in order to discover
          assets and flag potential security flaws. By operating in either
          passive or active scanning modes, Crossfeed collects data from a
          variety of open source tools and data feeds to provide actionable
          information about organization assets. Crossfeed is offered as a
          self-service portal and allows customers to view reports and customize
          scans performed.
        </p>
        <p>
          Crossfeed is a collaboration between the{' '}
          <a target="_blank" href="https://www.cisa.gov/">
            Cybersecurity and Infrastructure Security Agency
          </a>{' '}
          and the{' '}
          <a target="_blank" href="https://dds.mil/">
            Defense Digital Service
          </a>
          .
        </p>
      </div>
    </div>
  </section>
);

export default Tagline;
