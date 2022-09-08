import classes from './Reports.module.scss';
import React, { useCallback, useState, useEffect } from 'react';
import { useAuthContext } from 'context';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@material-ui/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton
} from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';

export const Reports: React.FC = () => {
  const {
    apiPost,
    currentOrganization,
    showAllOrganizations
  } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reports, setReports] = useState([]);

  const fetchPeReports = useCallback(async () => {
    try {
      if (!showAllOrganizations && currentOrganization) {
        console.log(currentOrganization);
        const result = await apiPost('/reports/pe-list/', {
          body: { currentOrganization }
        });
        const output = result.map((a: any) => {
          const organization = a.Key.split('/')[1];
          const name = a.Key.split('/')[2];
          return {
            key: a.Key,
            organization,
            name,
            lastModified: a.LastModified,
            size: a.Size,
            eTag: a.eTag
          };
        });
        setReports(output);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiPost, showAllOrganizations, currentOrganization]);

  const pdfExport = async (Key: string): Promise<string> => {
    if (!showAllOrganizations && currentOrganization) {
      try {
        const { url } = await apiPost('/reports/pe-export/', {
          body: { currentOrganization, Key }
        });
        window.open(url);
        return url;
      } catch (e) {
        setDialogOpen(true);
        return '';
      }
    } else {
      console.log('All organizations');
      return '';
    }
  };
  const handleClose = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    fetchPeReports();
  }, [fetchPeReports]);

  interface reportOutput {
    key: string;
    organization: string;
    name: string;
    lastModified: string;
    size: number;
    eTag: string;
  }

  return (
    <>
      <div className={classes.root}>
        <h1>P&E Reports</h1>
        {currentOrganization &&
        currentOrganization.tags.some((e) => e.name === 'P&E') ? (
          <>
            <h2>Download</h2>
            <div className={classes.section}>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Filename</TableCell>
                      <TableCell>Date Uploaded</TableCell>
                      <TableCell>Size (MB)</TableCell>
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((rep: reportOutput) => (
                      <TableRow key={rep['eTag']}>
                        <TableCell component="th" scope="row">
                          {rep['name']}
                        </TableCell>
                        <TableCell>{rep['lastModified']}</TableCell>
                        <TableCell>
                          {(rep['size'] / (1024 * 1024)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="fingerprint"
                            onClick={() => pdfExport(rep['key'])}
                          >
                            <GetAppIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <Dialog open={dialogOpen} onClose={handleClose}>
              <DialogTitle id="alert-dialog-title">{'Alert'}</DialogTitle>
              <DialogContent>
                P&E Report does not exist for this organization.
              </DialogContent>
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
              This organization is not registered to receive Posture and
              Exposure reports. For more information, please reach out to
              vulnerability@cisa.dhs.gov.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;
