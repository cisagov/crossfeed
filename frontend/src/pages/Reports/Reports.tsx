import classes from './Reports.module.scss';
import { TableInstance } from 'react-table';
import { createColumns } from './columns';
import { Report } from 'types';
import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo
} from 'react';
import { useAuthContext } from 'context';
import { Table, Paginator } from 'components';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

import { OrganizationTag, Organization as OrganizationType } from 'types';

const PAGE_SIZE = 15;

export const Reports: React.FC = () => {
  const { apiPost, apiGet, currentOrganization, showAllOrganizations } =
    useAuthContext();
  const tableRef = useRef<TableInstance<Report>>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tags, setTags] = useState<OrganizationTag[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [noResults, setNoResults] = useState(false);

  const pdfExport = useCallback(
    async (reportName: string): Promise<string> => {
      if (!showAllOrganizations && currentOrganization) {
        try {
          const { url } = await apiPost('/reports/export/', {
            body: { currentOrganization, reportName }
          });
          window.open(url);
          return url;
        } catch (e) {
          setDialogOpen(true);
          return '';
        }
      } else {
        return '';
      }
    },
    [apiPost, currentOrganization, showAllOrganizations]
  );

  const columns = useMemo(() => createColumns(pdfExport), [pdfExport]);

  const fetchReports = useCallback(async () => {
    try {
      const organization = await apiGet<OrganizationType>(
        `/organizations/${currentOrganization?.id}`
      );
      setTags(organization.tags);
      if (!showAllOrganizations && currentOrganization) {
        const result = await apiPost('/reports/list/', {
          body: { currentOrganization }
        });

        const output = result.map((a: any) => {
          const size_in_mb = (a.Size / (1024 * 1024)).toFixed(2) + ' MB';
          const name = a.Key.split('/')[1];
          let team;
          if (name.startsWith('Posture')) {
            team = 'Posture and Exposure (P&E)';
          } else if (name.startsWith('Vulnerability')) {
            team = 'Vulnerability Scanning (VS)';
          } else if (name.startsWith('Web')) {
            team = 'Web Application Scanning (WAS)';
          } else {
            team = '';
          }
          const date = new Date(a.LastModified).toDateString();
          return {
            reportName: name,
            team: team,
            lastModified: date,
            size: size_in_mb,
            eTag: a.eTag
          };
        });
        setReports(output);
        setTotalResults(output.length);
        setNoResults(output.length === 0);
      }
    } catch (e) {
      setNoResults(true);
      console.error(e);
      return;
    }
  }, [apiPost, apiGet, showAllOrganizations, currentOrganization]);

  const renderPagination = (table: TableInstance<Report>) => (
    <Paginator table={table} totalResults={totalResults} />
  );

  const handleClose = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <>
      <div className={classes.root}>
        <h1>Reports</h1>
        {currentOrganization && tags && tags.some((e) => e.name === 'P&E') ? (
          <>
            <Table<Report>
              renderPagination={renderPagination}
              tableRef={tableRef}
              columns={columns}
              data={reports}
              pageCount={Math.ceil(totalResults / PAGE_SIZE)}
              pageSize={PAGE_SIZE}
              noResults={noResults}
              noResultsMessage={
                "We don't see any reports for this organization."
              }
            />
            <Dialog open={dialogOpen} onClose={handleClose}>
              <DialogTitle id="alert-dialog-title">{'Alert'}</DialogTitle>
              <DialogContent>Error. File does not exist.</DialogContent>
              <DialogActions>
                <Button onClick={handleClose} autoFocus>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          <div>
            <p>
              This organization is not registered to receive Cyber Hygiene
              reports. For more information, please reach out to
              vulnerability@cisa.dhs.gov.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;
