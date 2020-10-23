import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Organization as OrganizationType, Scan, ScanSchema } from 'types';
import { Header } from '@trussworks/react-uswds';
import { OrganizationOption } from 'pages/Scans/ScansView';
import { ScanForm, ScanFormValues } from 'components/ScanForm';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

export const setFrequency = async (body: ScanFormValues) => {
  if (body.isSingleScan) body.frequency = 1;
  if (body.frequencyUnit === 'minute') body.frequency *= 60;
  else if (body.frequencyUnit === 'hour') body.frequency *= 60 * 60;
  else body.frequency *= 60 * 60 * 24;
};

const ScanComponent: React.FC = () => {
  const { scanId } = useParams();
  const { apiGet, apiPut } = useAuthContext();
  const [scan, setScan] = useState<Scan>();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});
  const [values, setValues] = useState<ScanFormValues>({
    name: 'scan.name',
    arguments: '{}',
    organizations: [],
    frequency: 1,
    frequencyUnit: 'minute',
    isGranular: false,
    isSingleScan: false
  });

  const fetchScan = useCallback(async () => {
    try {
      const { scan, schema, organizations } = await apiGet<{
        scan: Scan;
        schema: ScanSchema;
        organizations: OrganizationType[];
      }>(`/scans/${scanId}`);
      setScan(scan);
      setDefaultValues(scan);
      setScanSchema(schema);
      setOrganizationOptions(
        organizations.map((e) => ({ label: e.name, value: e.id }))
      );
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, setScan, scanId]);

  const onSubmit = async (body: ScanFormValues) => {
    try {
      setFrequency(body);
      await apiPut(`/scans/${scanId}`, {
        body: {
          ...body,
          organizations: body.organizations
            ? body.organizations.map((e) => e.value)
            : []
        }
      });
      setMessage('Scan successfully updated');
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const setDefaultValues = async (scan: Scan) => {
    var oldFrequencyUnit = 'minute';
    if (scan.frequency >= 86400) {
      scan.frequency = scan.frequency / (60 * 60 * 24);
      oldFrequencyUnit = 'day';
    } else if (scan.frequency >= 3600) {
      scan.frequency = scan.frequency / (60 * 60);
      oldFrequencyUnit = 'hour';
    } else if (scan.frequency >= 60) {
      scan.frequency = scan.frequency / 60;
      oldFrequencyUnit = 'minute';
    }

    setValues((values) => ({
      ...values,
      name: scan.name,
      frequency: scan.frequency,
      frequencyUnit: oldFrequencyUnit,
      isGranular: scan.isGranular,
      isSingleScan: scan.isSingleScan
    }));

    //retrieves the organizations that are currently
    //associated with this scan
    if (scan.isGranular) {
      const defaultOrganizations: OrganizationOption[] = [];
      for (const org in scan.organizations) {
        const thisOrganization: OrganizationType = scan.organizations[org];
        const thisOrganizationOption: OrganizationOption = {
          label: thisOrganization.name,
          value: thisOrganization.id
        };
        defaultOrganizations.push(thisOrganizationOption);
      }
      setValues((values) => ({
        ...values,
        organizations: defaultOrganizations
      }));
    }
  };

  const isGlobal = scanSchema.global;
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
            <h1>{'Edit ' + scan.name}</h1>
          </div>
        </div>
      </Header>
      {errors.global && <p className={classes.error}>{errors.global}</p>}
      {message && <p>{message}</p>}
      <ScanForm
        organizationOption={organizationOptions}
        propValues={values}
        global={isGlobal}
        onSubmit={onSubmit}
        type="edit"
        scan={scan}
        scanSchema={scanSchema}
      ></ScanForm>
    </div>
  );
};

export default ScanComponent;
