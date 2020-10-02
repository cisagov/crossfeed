import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import {
  Organization as OrganizationType,
  Scan} from 'types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Header} from '@trussworks/react-uswds';
import { OrganizationOption } from 'pages/Scans/ScansView';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

const ScanComponent: React.FC = () => {
  const { scanId } = useParams();
  const { apiGet, apiPut } = useAuthContext();
  const [scan, setScan] = useState<Scan>();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');
  const [] = useState<{
    name: string;
    organizations: OrganizationOption[];
    arguments: string;
    frequency: number;
    frequencyUnit: string;
    isGranular: boolean;
  }>({
    name: 'censys',
    arguments: '{}',
    organizations: [],
    frequency: 0,
    frequencyUnit: 'minute',
    isGranular: false
  });


  const fetchScan = useCallback(async () => {
    try {
      const scan = await apiGet<Scan>(
        `/scans/${scanId}`
      );
      setScan(scan);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, setScan, scanId]);

  const updateScan = async (body: any) => {
    try {
      const scan = await apiPut( `/scans/${scanId}`, {
        body
      });
      setScan(scan);
      setMessage('Scan successfully updated');
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting scan entry.'
            : e.message ?? e.toString()
      });
      console.error(e);
    }
  };


  useEffect(() => {
    fetchScan();
  }, [fetchScan]);

  if (!scan)
    return (
      <div className={classes.root}>
        <h1>No results found</h1>
      </div>
    );

  return (
    <div className={classes.root}>
      <Header>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <h1>{scan.name}</h1>
          </div>
        </div>
      </Header>
      {errors.global && <p className={classes.error}>{errors.global}</p>}
      {message && <p>{message}</p>}
      Hello world! {scan.name}
    </div>
  );
};

export default ScanComponent;