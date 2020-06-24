import React, { useCallback } from "react";
import { Row } from "react-table";
import { Service } from "types";
import { Table } from "components";
import { columns } from "./columns";
import classes from "./styles.module.scss";

interface Props {
  services: Service[];
}

export const ServicesTable: React.FC<Props> = ({ services }) => {
  const renderExpanded = useCallback((row: Row<Service>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        <h4>Banner</h4>
        <div className={classes.banner}>
          {original.banner?.split(/(?:\\n|\\r)+/gm).map((banner) => (
            <div>{banner}</div>
          ))}
        </div>
      </div>
    );
  }, []);

  return (
    <Table<Service>
      columns={columns}
      data={services}
      pageSize={500}
      renderExpanded={renderExpanded}
      disableFilters
    />
  );
};
