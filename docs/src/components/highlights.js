import React from 'react';
import circle from '../../node_modules/uswds/dist/img/circle-124.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes,
  faExclamationTriangle,
  faTasks,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';

/*
  Use this section to highlight key elements of your site. Some sites will only have two while others may have six to eight. 
*/

const Highlights = () => (
  <section
    className="usa-graphic-list usa-section usa-section--dark"
    id="highlights"
  >
    <div className="grid-container">
      <div className="usa-graphic-list__row grid-row grid-gap">
        <div className="usa-media-block tablet:grid-col">
          <div className="icon-circle-container">
            <img className="usa-media-block__img" src={circle} alt="Alt text" />
            <FontAwesomeIcon icon={faBoxes} size={'4x'} />
          </div>

          <div className="usa-media-block__body">
            <h3 className="usa-graphic-list__heading">
              Analyze your entire inventory of public-facing sites.
            </h3>
            <p>
              Users only have to give Crossfeed a root domain, and it will
              discover related assets that they may not have been aware of
              before. Crossfeed can discover all related subdomains and help
              users understand when certain websites or webpages were
              unintentionally exposed.
            </p>
          </div>
        </div>
        <div className="usa-media-block tablet:grid-col">
          <div className="icon-circle-container">
            <img className="usa-media-block__img" src={circle} alt="Alt text" />
            <FontAwesomeIcon icon={faExclamationTriangle} size={'4x'} />
          </div>
          <div className="usa-media-block__body">
            <h3 className="usa-graphic-list__heading">
              Manage and triage your vulnerabilities.
            </h3>
            <p>
              Users can view detailed information about CVEs on the
              Vulnerabilities page, as well as mark vulnerabilities identified
              by Crossfeed with different statuses, such as “False Positive” or
              “Remediated.”
            </p>
          </div>
        </div>
      </div>
      <div className="usa-graphic-list__row grid-row grid-gap">
        <div className="usa-media-block tablet:grid-col">
          <div className="icon-circle-container">
            <img className="usa-media-block__img" src={circle} alt="Alt text" />
            <FontAwesomeIcon icon={faTasks} size={'4x'} />
          </div>
          <div className="usa-media-block__body">
            <h3 className="usa-graphic-list__heading">
              Control automated scans on your assets.
            </h3>
            <p>
              Users can view a list of which scans were performed on their
              assets and enable or disable certain scans at any time.
              Additionally, all Internet traffic from Crossfeed to customers’
              assets are clearly marked and identifiable as so.
            </p>
          </div>
        </div>
        <div className="usa-media-block tablet:grid-col">
          <div className="icon-circle-container">
            <img className="usa-media-block__img" src={circle} alt="Alt text" />
            <FontAwesomeIcon icon={faChartLine} size={'4x'} />
          </div>
          <div className="usa-media-block__body">
            <h3 className="usa-graphic-list__heading">
              View an “at-a-glance” dashboard for a risk summary overview.
            </h3>
            <p>
              Users have access to a “Risk Summary” dashboard that has graphs /
              charts to highlight the most important vulnerabilities and assets
              to focus on.
            </p>
          </div>
        </div>
      </div>

      <div className="usa-graphic-list__row grid-row grid-gap">
        <div className="usa-media-block tablet:grid-col">
          <a
            className="usa-button usa-button--big usa-button--accent-cool"
            href="/user-guide/quickstart/"
            style={{ margin: 'auto', display: 'block' }}
          >
            Get started
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default Highlights;
