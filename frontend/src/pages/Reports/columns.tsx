import React from 'react';
import { Column } from 'react-table';
import { ColumnFilter } from 'components';
import { Report } from 'types';
import { IconButton } from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';

export const createColumns = (pdfExport: any) =>
  [
    {
      Header: 'Filename',
      accessor: 'name',
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
      accessor: ({ key }) => (
        <IconButton aria-label="fingerprint" onClick={() => pdfExport(key)}>
          <GetAppIcon />
        </IconButton>
      ),
      id: 'download',
      Filter: ColumnFilter
    }
  ] as Column<Report>[];
