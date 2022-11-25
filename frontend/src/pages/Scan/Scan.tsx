import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import {
  Organization as OrganizationType,
  OrganizationTag,
  Scan,
  ScanSchema
} from 'types';
import { Header } from '@trussworks/react-uswds';
import { OrganizationOption } from 'pages/Scans/ScansView';
import { ScanForm, ScanFormValues } from 'components/ScanForm';

export const setFrequency = async (body: ScanFormValues) => {
  if (body.isSingleScan) body.frequency = 1;
  if (body.frequencyUnit === 'minute') body.frequency *= 60;
  else if (body.frequencyUnit === 'hour') body.frequency *= 60 * 60;
  else body.frequency *= 60 * 60 * 24;
};

const ScanComponent: React.FC = () => {
  const { scanId } = useParams<any>();
  const { apiGet, apiPut, setFeedbackMessage } = useAuthContext();
  const [scan, setScan] = useState<Scan>();
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [tags, setTags] = useState<OrganizationTag[]>([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});
  const [values, setValues] = useState<ScanFormValues>({
    name: 'scan.name',
    arguments: '{}',
    organizations: [],
    frequency: 1,
    frequencyUnit: 'minute',
    isGranular: false,
    isUserModifiable: false,
    isSingleScan: false,
    tags: []
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
      const tags = await apiGet<OrganizationTag[]>(`/organizations/tags`);
      setTags(tags);
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
            : [],
          tags: body.tags
            ? body.tags.map((e) => ({
                id: e.value
              }))
            : []
        }
      });
      setFeedbackMessage({
        message: 'Scan successfully updated',
        type: 'success'
      });
    } catch (e) {
      setFeedbackMessage({
        message: 'Error updating scan',
        type: 'error'
      });
      console.log(e);
    }
  };

  const setDefaultValues = async (scan: Scan) => {
    let oldFrequencyUnit = 'minute';
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
        organizations: defaultOrganizations,
        tags: scan.tags.map((tag) => ({
          label: tag.name,
          value: tag.id
        }))
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
      <ScanForm
        organizationOption={organizationOptions}
        tags={tags}
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
