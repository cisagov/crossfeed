import React from "react";
import { GovBanner } from "@trussworks/react-uswds";
import { Header, Footer } from "components";
import classes from "./styles.module.scss";

export const Layout: React.FC = ({ children }) => {
  return (
    <div className={classes.root}>
      <div className="usa-overlay " />
      <GovBanner />
      <Header />

      <div className={classes.content}>{children}</div>

      <Footer />
    </div>
  );
};
