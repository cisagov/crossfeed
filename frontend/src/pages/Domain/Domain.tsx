import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Domain as DomainType, Vulnerability } from 'types';
import noImage from './no-image.png';
import {
  FaGlobe,
  FaNetworkWired,
  FaCloud,
  FaClock,
  FaBuilding,
  FaMinus,
  FaPlus
} from 'react-icons/fa';
import { ServicesTable, SSLInfo, WebInfo } from 'components';
import {
  Button,
  Overlay,
  ModalContainer,
  Modal
} from '@trussworks/react-uswds';
import { Table } from 'components';
import { Column, CellProps } from 'react-table';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { renderExpandedVulnerability } from '../Vulnerabilities/Vulnerabilities';

export const Domain: React.FC = () => {
  const { domainId } = useParams();
  const { apiGet } = useAuthContext();
  const [domain, setDomain] = useState<DomainType>();
  const [showReviewModal, setShowReviewModal] = useState<Boolean>(false);

  const fetchDomain = useCallback(async () => {
    try {
      setDomain(undefined);
      const domain = await apiGet<DomainType>(`/domain/${domainId}`);
      setDomain(domain);
    } catch (e) {
      console.error(e);
    }
  }, [domainId, apiGet, setDomain]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  const vulnerabilityColumns: Column<Vulnerability>[] = [
    {
      Header: 'Title',
      accessor: 'title',
      width: 800,
      disableFilters: true
    },
    {
      Header: 'Severity',
      id: 'severity',
      accessor: ({ severity }) => severity,
      width: 100,
      disableFilters: true
    },
    {
      Header: 'Created',
      id: 'created',
      accessor: ({ createdAt }) =>
        `${formatDistanceToNow(parseISO(createdAt))} ago`,
      width: 250,
      disableFilters: true
    },
    {
      Header: 'State',
      id: 'state',
      accessor: 'state',
      width: 100,
      disableFilters: true
    },
    {
      Header: 'Details',
      Cell: ({ row }: CellProps<Vulnerability>) => (
        <span
          {...row.getToggleRowExpandedProps()}
          className="text-center display-block"
        >
          {row.isExpanded ? <FaMinus /> : <FaPlus />}
        </span>
      ),
      disableFilters: true
    }
  ];

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        {domain && (
          <>
            <div className={classes.header}>
              <div className={classes.headerDetails}>
                <h1>{domain.name}</h1>
                <div className={classes.headerRow}>
                  <label>
                    <FaNetworkWired />
                    IP
                  </label>
                  <span>{domain.ip}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaGlobe />
                    Location
                  </label>
                  <span>{domain.country}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaCloud />
                    Cloud Hosted
                  </label>
                  <span>{domain.cloudHosted ? 'Yes' : 'No'}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaBuilding />
                    Organization
                  </label>
                  <span>{domain.organization?.name}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaClock />
                    Passive Mode
                  </label>
                  <span>{domain.organization?.isPassive ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className={classes.imgWrapper}>
                {/* <div style={{ float: 'right', marginBottom: '20px' }}>
                  <Button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Request Active Scan <FaBolt></FaBolt>
                  </Button>
                </div> */}
                <img
                  src={domain.screenshot || noImage}
                  alt={
                    domain.screenshot ? domain.name : 'no screenshot available'
                  }
                />
              </div>
            </div>
            {domain.services.length > 0 && (
              <div className={classes.section}>
                <h3>Ports and Services</h3>
                <ServicesTable services={domain.services} />
              </div>
            )}
            {domain.ssl && (
              <div className={classes.section}>
                <h3>SSL Certificate</h3>
                <SSLInfo {...domain.ssl} />
              </div>
            )}
            {domain.services && (
              <div className={classes.section}>
                <h3>Known Products</h3>
                <WebInfo domain={domain} />
              </div>
            )}
            {domain.vulnerabilities && (
              <div className={classes.section}>
                <h3>Vulnerabilities</h3>

                <Table<Vulnerability>
                  columns={vulnerabilityColumns}
                  data={domain.vulnerabilities}
                  renderExpanded={renderExpandedVulnerability}
                  initialSortBy={[
                    {
                      id: 'created',
                      desc: false
                    }
                  ]}
                />
              </div>
            )}
          </>
        )}
      </div>
      {showReviewModal && (
        <div>
          <Overlay />
          <ModalContainer>
            <Modal
              actions={
                <>
                  <Button
                    outline
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      // TODO: Implement backend logic for requesting review
                      setShowReviewModal(false);
                    }}
                  >
                    Request Active Scan
                  </Button>
                </>
              }
              title={<h2>Request active scan [DEMO]?</h2>}
            >
              <p>
                This will request an active scan of this asset. This is a demo
                customer-facing functionality and does not do anything.
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};
