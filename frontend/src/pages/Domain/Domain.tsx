import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "context";
import classes from "./styles.module.scss";
import { FullDomain } from "types";
import noImage from "./no-image.png";
import { FaGlobe, FaNetworkWired, FaCloud } from "react-icons/fa";
import { ServicesTable, SSLInfo, WebInfo } from "components";

export const Domain: React.FC = () => {
  const { domainId } = useParams();
  const { apiGet } = useAuthContext();
  const [domain, setDomain] = useState<FullDomain>();

  const fetchDomain = useCallback(async () => {
    try {
      setDomain(undefined);
      const domain = await apiGet<FullDomain>(`/domain/${domainId}`);
      setDomain(domain);
    } catch (e) {
      console.error(e);
    }
  }, [domainId, apiGet, setDomain]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        {domain && (
          <>
            <div className={classes.header}>
              <div className={classes.headerDetails}>
                <h1>{domain.name}</h1>
                <div className={classes.headerRow}>
                  <label>
                    <FaNetworkWired />
                    IP
                  </label>
                  <span>{domain.ip}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaGlobe />
                    Location
                  </label>
                  <span>{domain.country}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaCloud />
                    Cloud Hosted
                  </label>
                  <span>{domain.cloudHosted ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className={classes.imgWrapper}>
                <img
                  src={domain.screenshot || noImage}
                  alt={
                    domain.screenshot ? domain.name : "no screenshot available"
                  }
                />
              </div>
            </div>
            {domain.services.length > 0 && (
              <div className={classes.section}>
                <h3>Ports and Services</h3>
                <ServicesTable services={domain.services} />
              </div>
            )}
            {domain.ssl && (
              <div className={classes.section}>
                <h3>SSL Certificate</h3>
                <SSLInfo {...domain.ssl} />
              </div>
            )}
            {domain.web && (
              <div className={classes.section}>
                <h3>Known Web Technologies</h3>
                <WebInfo {...domain.web} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
