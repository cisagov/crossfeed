import React from "react";
import { Dropdown } from "@trussworks/react-uswds";
import { ColumnInstance } from "react-table";
import classes from "./styles.module.scss";

interface Props {
  column: ColumnInstance;
}

export const selectFilter = (opts: string[]) => {
  const SelectFilter: React.FC<Props> = ({
    column: { filterValue, setFilter, id },
  }) => {
    return (
      <div className={classes.root}>
        <Dropdown
          id={id}
          name={id}
          value={filterValue}
          onChange={(e) => {
            setFilter(e.target.value);
          }}
        >
          <option value=""></option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Dropdown>
      </div>
    );
  };

  return SelectFilter;
};
