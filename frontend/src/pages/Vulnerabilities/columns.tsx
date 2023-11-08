import React from 'react';
import { Dropdown } from '@trussworks/react-uswds';
import { ColumnFilter, selectFilter } from 'components';
import { getSeverityColor } from 'pages/Risk/utils';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Column, CellProps } from 'react-table';
import { Vulnerability } from 'types';
// @ts-ignore:next-line
import { differenceInCalendarDays, parseISO } from 'date-fns';

const extLink = <FaExternalLinkAlt style={{ width: 12 }}></FaExternalLinkAlt>;

export const createColumns = (updateVulnerability: any) =>
  [
    {
      Header: 'Vulnerability',
      accessor: 'title',
      Cell: ({ value, row }: CellProps<Vulnerability>) =>
        row.original.cve ? (
          <a
            href={`https://nvd.nist.gov/vuln/detail/${row.original.cve}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value} {extLink}
          </a>
        ) : (
          <p>{row.original.title}</p>
        ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Severity',
      id: 'severity',
      accessor: ({ severity, substate }) => (
        <span
          style={{
            borderBottom: `6px solid ${getSeverityColor({
              id: severity ?? ''
            })}`,
            width: '80px'
          }}
          // className={substate === 'unconfirmed' ? classes.severity : undefined}
        >
          {severity}
        </span>
      ),
      width: 100,
      Filter: selectFilter(['Low', 'Medium', 'High', 'Critical', 'None'])
    },
    {
      Header: 'KEV',
      accessor: 'isKev',
      Cell: ({ value, row }: CellProps<Vulnerability>) =>
        value ? (
          <a
            href={`https://www.cisa.gov/known-exploited-vulnerabilities-catalog`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Yes {extLink}
          </a>
        ) : (
          <p>No</p>
        ),
      width: 50,
      Filter: selectFilter([
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ])
    },
    {
      Header: 'Domain',
      id: 'domain',
      accessor: ({ domain }) => (
        <Link to={`/inventory/domain/${domain?.id}`}>{domain?.name}</Link>
      ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Product',
      id: 'cpe',
      accessor: ({ cpe, service }) => {
        const product =
          service &&
          service.products.find(
            (product) => cpe && product.cpe && cpe.includes(product.cpe)
          );
        if (product)
          return product.name + (product.version ? ' ' + product.version : '');
        else return cpe;
      },
      width: 100,
      Filter: ColumnFilter
    },
    {
      Header: 'Days Open',
      id: 'createdAt',
      accessor: ({ createdAt, actions = [] }) => {
        // Calculates the total number of days a vulnerability has been open
        let daysOpen = 0;
        let lastOpenDate = createdAt;
        let lastState = 'open';
        actions.reverse();
        for (const action of actions) {
          if (action.state === 'closed' && lastState === 'open') {
            daysOpen += differenceInCalendarDays(
              parseISO(action.date),
              parseISO(lastOpenDate)
            );
            lastState = 'closed';
          } else if (action.state === 'open' && lastState === 'closed') {
            lastOpenDate = action.date;
            lastState = 'open';
          }
        }
        if (lastState === 'open') {
          daysOpen += differenceInCalendarDays(
            new Date(),
            parseISO(lastOpenDate)
          );
        }
        return daysOpen;
      },
      disableFilters: true
    },
    {
      Header: 'Status',
      id: 'state',
      width: 100,
      maxWidth: 200,
      accessor: 'state',
      Filter: selectFilter([
        'open',
        'open (unconfirmed)',
        'open (exploitable)',
        'closed',
        'closed (false positive)',
        'closed (accepted risk)',
        'closed (remediated)'
      ]),
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <Dropdown
          id="state-dropdown"
          name="state-dropdown"
          onChange={(e) => {
            updateVulnerability(row.index, {
              substate: e.target.value
            });
          }}
          value={row.original.substate}
          style={{ display: 'inline-block', width: '200px' }}
        >
          <option value="unconfirmed">Open (Unconfirmed)</option>
          <option value="exploitable">Open (Exploitable)</option>
          <option value="false-positive">Closed (False Positive)</option>
          <option value="accepted-risk">Closed (Accepted Risk)</option>
          <option value="remediated">Closed (Remediated)</option>
        </Dropdown>
      )
    },
    {
      Header: 'Details',
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <Link
          to={`/inventory/vulnerability/${row.original.id}`}
          style={{
            fontSize: '14px',
            cursor: 'pointer',
            color: '#484D51',
            textDecoration: 'none'
          }}
        >
          DETAILS
        </Link>
      ),
      disableFilters: true
    }
  ] as Column<Vulnerability>[];

export const createGroupedColumns = () =>
  [
    {
      Header: 'Vulnerability',
      accessor: 'title',
      Cell: ({ value, row }: CellProps<Vulnerability>) =>
        row.original.cve ? (
          <a
            href={`https://nvd.nist.gov/vuln/detail/${row.original.cve}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value} {extLink}
          </a>
        ) : (
          <p>{row.original.title}</p>
        ),
      width: 800,
      Filter: ColumnFilter
    },
    {
      Header: 'Severity',
      id: 'severity',
      accessor: ({ severity }) => (
        <span
          style={{
            borderBottom: `6px solid ${getSeverityColor({
              id: severity ?? ''
            })}`,
            width: '80px'
          }}
        >
          {severity}
        </span>
      ),
      width: 100,
      Filter: selectFilter(['Low', 'Medium', 'High', 'Critical', 'None'])
    },
    {
      Header: 'Count',
      accessor: 'cnt',
      disableFilters: true
    },
    {
      Header: 'Description',
      accessor: 'description',
      disableFilters: true
    }
  ] as Column<Vulnerability>[];
