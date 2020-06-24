import React from "react";
import classes from "./styles.module.scss";
import { WebInfo as WebInfoType } from "types";
import { Item } from "./Item";

export const WebInfo: React.FC<WebInfoType> = (props) => {
  return (
    <div className={classes.root}>
      <Item title="Frameworks" value={props.frameworks} />
      <Item title="Analytics" value={props.analytics} />
      <Item title="GA Keys" value={props.gaKeys} />
      <Item title="Operating Systems" value={props.operatingSystems} />
      <Item title="Web Servers" value={props.webServers} />
      <Item title="CMS" value={props.cms} />
      <Item title="Fonts" value={props.fonts} />
      <Item title="Social Links" value={props.socialUrls} />
    </div>
  );
};
