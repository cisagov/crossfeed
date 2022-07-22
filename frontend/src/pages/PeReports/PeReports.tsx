import classes from './PeReports.module.scss';
import { FileInput } from 'components';
import { PeReport } from 'types';
import React, { useCallback, useState, useEffect } from 'react';
import { useAuthContext } from 'context';
import {
  Label,
  FormGroup,
  Button as USWDSButton
} from '@trussworks/react-uswds';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Switch,
  Button,
  FormControlLabel
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
import { GetAppOutlined } from '@material-ui/icons';

const axios = require('axios');

export const PeReports: React.FC = () => {
  const {
    apiGet,
    apiPost,
    apiDelete,
    setLoading,
    currentOrganization,
    showAllOrganizations
  } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reports, setReports] = useState([]);

  const uploadPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Uploading report');

    if (!event.target.files || !event.target.files.length) {
      return;
    }
    console.log(event.target.files);
    console.log(event.target.files[0].name);
    const file = event.target.files[0];
    const filename = file.name;

    if (!showAllOrganizations && currentOrganization) {
      let presignedUrl;
      try {
        const result = await apiPost('/pe-reports/upload/', {
          body: { filename, currentOrganization }
        });
        console.log(result);
        presignedUrl = result.url;
      } catch (e) {
        console.log('Error while generating presigned url', e);
      }

      try {
        const options = {
          headers: {
            'Content-Type': file.type
          }
        };
        const result = await axios.put(presignedUrl, file, options);
        fetchReports();
        return result;
      } catch (e) {
        console.log('Error while uploading object to S3:', e);
      }
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      if (!showAllOrganizations && currentOrganization) {
        const result = await apiPost('/pe-reports/list/', {
          body: { currentOrganization }
        });
        console.log('RESULTSSSS');
        console.log(result);
        const output = result.map((a: any) => {
          const [folder, organization, name] = a.Key.split('/');
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
  }, [apiPost]);

  const pdfExport = async (Key: string): Promise<string> => {
    console.log('Fetching pdf report');
    console.log(currentOrganization);
    if (!showAllOrganizations && currentOrganization) {
      try {
        const { url } = await apiPost('/pe-reports/export/', {
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
    fetchReports();
  }, [fetchReports]);

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
        {/* <Table<PeReport> columns={columns} data={users} fetchData={fetchReports} /> */}
        <form className={classes.form}>
          <h2>Upload</h2>
          <FormGroup>
            <Label htmlFor="import">File must be in a PDF format.</Label>
            <FileInput
              id="import"
              accept=".pdf"
              onChange={(e) => uploadPDF(e)}
            />
          </FormGroup>
        </form>
        {/* <USWDSButton
          className={classes.exportButton}
          outline
          type="button"
          onClick={() => pdfExport()}
        >
          Export Results
        </USWDSButton> */}
        <h2>Download</h2>
        {/* {reports && <p>{reports[0].Key}</p>} */}
        <div className={classes.section}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Date Uploaded</TableCell>
                  <TableCell>Size (bytes)</TableCell>
                  <TableCell>Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((rep: reportOutput) => (
                  <TableRow key={rep['eTag']}>
                    <TableCell component="th" scope="row">
                      {rep['name']}
                    </TableCell>
                    <TableCell>{rep['organization']}</TableCell>
                    <TableCell>{rep['lastModified']}</TableCell>
                    <TableCell>{rep['size']}</TableCell>
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
      </div>
    </>
  );
};

export default PeReports;
