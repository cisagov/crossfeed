import React from 'react';
import { Column } from 'react-table';
import { ColumnFilter } from 'components';
import { Report } from 'types';
import { IconButton } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export const createColumns = (pdfExport: any) =>
  [
    {
      Header: 'Filename',
      accessor: 'reportName',
      id: 'filename',
      Filter: ColumnFilter
    },
    {
      Header: 'Team',
      accessor: 'team',
      id: 'team',
      Filter: ColumnFilter
    },
    {
      Header: 'Date Uploaded',
      accessor: 'lastModified',
      id: 'dateUploaded',
      Filter: ColumnFilter
    },
    {
      Header: 'Size (MB)',
      accessor: 'size',
      id: 'size',
      Filter: ColumnFilter
    },
    {
      Header: 'Download',
      accessor: ({ reportName }) => (
        <IconButton
          aria-label="fingerprint"
          onClick={() => pdfExport(reportName)}
          size="large"
        >
          <GetAppIcon />
        </IconButton>
      ),
      id: 'download',
      Filter: ColumnFilter
    }
  ] as Column<Report>[];
