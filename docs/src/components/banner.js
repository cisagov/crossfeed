import React from 'react';
import flag from '../../node_modules/uswds/dist/img/us_flag_small.png';
import dotGov from '../../node_modules/uswds/dist/img/icon-dot-gov.svg';
import https from '../../node_modules/uswds/dist/img/icon-https.svg';

const Banner = () => (
  <div className="usa-banner">
    <div className="usa-accordion">
      <header className="usa-banner__header">
        <div className="usa-banner__inner">
          <div className="grid-col-auto">
            <img
              className="usa-banner__header-flag"
              src={flag}
              alt="U.S. flag"
            />
          </div>
          <div className="grid-col-fill tablet:grid-col-auto">
            <p className="usa-banner__header-text">
              An official website of the United States government
            </p>
            <p className="usa-banner__header-action" aria-hidden="true">
              Here’s how you know
            </p>
          </div>
          <button
            aria-controls="gov-banner"
            aria-expanded={false}
            className="usa-accordion__button usa-banner__button"
          >
            <span className="usa-banner__button-text">Here's how you know</span>
          </button>
        </div>
      </header>
      <div
        id="gov-banner"
        className="usa-accordion__content usa-banner__content"
        hidden
      >
        <div className="grid-row grid-gap-lg">
          <div className="usa-banner__guidance-gov tablet:grid-col-6">
            <img
              className="usa-banner__icon usa-media-block__img"
              src={dotGov}
              alt="Dot gov"
            />
            <div className="usa-media-block__body">
              <p>
                <strong>The .gov means it’s official.</strong>
                <br />
                Federal government websites often end in .gov or .mil. Before
                sharing sensitive information, make sure you’re on a federal
                government site.
              </p>
            </div>
          </div>
          <div className="usa-banner__guidance-ssl tablet:grid-col-6">
            <img
              className="usa-banner__icon usa-media-block__img"
              src={https}
              alt="Https"
            />
            <div className="usa-media-block__body">
              <p>
                <strong>The site is secure.</strong>
                <br />
                The <strong>https://</strong> ensures that you are connecting to
                the official website and that any information you provide is
                encrypted and transmitted securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Banner;
