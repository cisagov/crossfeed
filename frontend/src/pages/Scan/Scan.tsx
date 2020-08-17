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
  const { apiGet } = useAuthContext();
  const [scan, setScan] = useState<Scan>();
  const [] = useState<number>(0);
  const [] = useState<Errors>({});
  const [] = useState<string>('');
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
      Hello world! {scan.name}
    </div>
  );
};

export default ScanComponent;