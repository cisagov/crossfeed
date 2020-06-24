import React, { useMemo, useState, useCallback } from "react";
import { TableInstance, Row } from "react-table";
import { Query } from "types";
import { useAuthContext } from "context";
import { Table, Paginator } from "components";
import { createColumns } from "./columns";
import { Report } from "types";
import classes from "./styles.module.scss";

export interface ApiResponse {
  result: Report[];
  count: number;
}

export const Vulnerabilities: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [reports, setReports] = useState<Report[]>([]);
  const [pageCount, setPageCount] = useState(0);

  const columns = useMemo(() => createColumns(), []);

  const fetchDomains = useCallback(
    async (query: Query<Report>) => {
      const { page, sort, filters } = query;
      try {
        const { result, count } = await apiPost<ApiResponse>("/report/search", {
          body: {
            page,
            sort: sort[0]?.id ?? "created",
            order: sort[0]?.desc ? "DESC" : "ASC",
            filters: filters
              .filter((f) => Boolean(f.value))
              .reduce(
                (accum, next) => ({
                  ...accum,
                  [next.id]: next.value,
                }),
                {}
              ),
          },
        });
        setReports(result);
        setPageCount(Math.ceil(count / 25));
      } catch (e) {
        console.error(e);
      }
    },
    [apiPost]
  );

  const renderPagination = (table: TableInstance<Report>) => (
    <Paginator table={table} />
  );

  const renderExpanded = useCallback((row: Row<Report>) => {
    const { original } = row;
    return (
      <div className={classes.expandedRoot}>
        <h4>Description</h4>
        <div className={classes.desc}>
          {original.desc?.split(/(?:\\n|\\r)+/gm).map((d) => (
            <div>{d}</div>
          ))}
        </div>
      </div>
    );
  }, []);

  return (
    <div className={classes.root}>
      <h1>Vulnerabilities</h1>
      <Table<Report>
        renderPagination={renderPagination}
        columns={columns}
        data={reports}
        pageCount={pageCount}
        fetchData={fetchDomains}
        renderExpanded={renderExpanded}
      />
    </div>
  );
};

export default Vulnerabilities;
