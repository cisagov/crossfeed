import React, { useState } from "react";
import classNames from "classnames";
import { parseISO, format, formatDistanceToNow, isAfter } from "date-fns";
import classes from "./styles.module.scss";
import { FaPlus, FaMinus } from "react-icons/fa";
import { SSLInfo as SSLInfoType } from "types";

export const SSLInfo: React.FC<SSLInfoType> = ({
  protocol,
  validTo,
  validFrom,
  altNames = "",
  issuerOrg,
  issuerCN,
  bits,
  fingerprint,
}) => {
  const [altNamesExpanded, setAltNamesExpanded] = useState(false);
  let validFormatted = "";
  let expiresFormatted = "";
  if (validTo && validFrom) {
    const now = Date.now();
    const expiration = parseISO(validTo || "");
    const issued = format(parseISO(validFrom || ""), "MMM dd, yyyy");
    const expires = format(expiration, "MMM dd, yyyy");
    const distance = formatDistanceToNow(parseISO(validTo || ""));
    validFormatted = `${issued} - ${expires}`;
    expiresFormatted = isAfter(expiration, now)
      ? `in ${distance}`
      : `${distance} ago`;
  }
  const altNamesFormatted = altNames?.split(",") ?? [];

  return (
    <div className={classes.root}>
      <div className={classes.firsthalf}>
        {protocol && (
          <div className={classes.item}>
            <label>Version</label>
            <span>{protocol}</span>
          </div>
        )}
        {validFrom && validTo && (
          <div className={classes.item}>
            <label>Valid</label>
            <span>{validFormatted}</span>
          </div>
        )}
        {validTo && (
          <div className={classes.item}>
            <label>Expires</label>
            <span>{expiresFormatted}</span>
          </div>
        )}
        {issuerOrg && (
          <div className={classes.item}>
            <label>Issuer Organization</label>
            <span>{issuerOrg}</span>
          </div>
        )}
        {issuerCN && (
          <div className={classes.item}>
            <label>Issuer Common Name</label>
            <span>{issuerCN}</span>
          </div>
        )}
        {bits && (
          <div className={classes.item}>
            <label>Bits</label>
            <span>{bits}</span>
          </div>
        )}
        {fingerprint && (
          <div className={classes.item}>
            <label>Fingerprint</label>
            <span>{fingerprint}</span>
          </div>
        )}
      </div>

      <div className={classes.secondhalf}>
        <div className={classNames(classes.item, classes.altnames)}>
          <label>Alternate Names ({altNamesFormatted.length})</label>
          {altNamesFormatted.slice(0, 15).map((name) => (
            <div>{name}</div>
          ))}
          {altNamesFormatted.length > 15 && altNamesExpanded && (
            <>
              {altNamesFormatted.slice(15).map((name) => (
                <div>{name}</div>
              ))}
              <button
                className={classes.expandNames}
                onClick={() => setAltNamesExpanded(false)}
              >
                <FaMinus /> {altNamesFormatted.length - 15}
              </button>
            </>
          )}
          {altNamesFormatted.length > 15 && !altNamesExpanded && (
            <button
              className={classes.expandNames}
              onClick={() => setAltNamesExpanded(true)}
            >
              <FaPlus /> {altNamesFormatted.length - 15}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
