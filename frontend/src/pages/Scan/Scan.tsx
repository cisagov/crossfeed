import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import {
  Organization as OrganizationType,
  Scan, ScanSchema} from 'types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Header,
  Button,
  Form,
  Dropdown,
  TextInput,
  Checkbox,
  Label
} from '@trussworks/react-uswds';
import MultiSelect from '../Scans/MultiSelect';
import { OrganizationOption } from 'pages/Scans/ScansView';
import { Link } from 'react-router-dom';
import { isRegExp } from 'util';


interface Errors extends Partial<OrganizationType> {
  global?: string;
}

const ScanComponent: React.FC = () => {
  const { scanId } = useParams();
  const { apiGet, apiPut, apiPost } = useAuthContext();
  const [scan, setScan] = useState<Scan>();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});
  const [values, setValues] = useState<{
    name: string;
    organizations: OrganizationOption[];
    arguments: string;
    frequency: number;
    frequencyUnit: string;
    isGranular: boolean;
    isSingleScan: boolean;
  }>({
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
      const { scan, schema, organizations }= await apiGet<{
        scan: Scan;
        schema: ScanSchema;
        organizations: OrganizationType[];
      }>(`/scans/${scanId}`);
      setScan(scan);
      setScanSchema(schema);
      setDefaultValues(scan);
      setOrganizationOptions(
          organizations.map((e) => ({ label: e.name, value: e.id }))
        );
        
    } catch (e) {
      console.error(e);
    }
    
  }, [apiGet, setScan, scanId]);

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      // For now, parse the arguments as JSON. We'll want to add a GUI for this in the future
      let body: typeof values = Object.assign({}, values);
      body.arguments = JSON.parse(values.arguments);
      if (values.isSingleScan) body.frequency = 1;
      if (values.frequencyUnit === 'minute') body.frequency *= 60;
      else if (values.frequencyUnit === 'hour') body.frequency *= 60 * 60;
      else body.frequency *= 60 * 60 * 24;
      //updateScan(body);

      const scan = await apiPut(`/scans/${scanId}`, {
        body: {
          ...body,
          organizations: body.organizations
            ? body.organizations.map((e) => e.value)
            : []
        }
      });
      setScan(scan);
      setMessage("Scan successfully updated");
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onTextChange: React.ChangeEventHandler<
  HTMLInputElement | HTMLSelectElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  const setDefaultValues = async( scan: Scan) => {
    var oldFrequencyUnit = 'minute';
    if (scan.frequency >= 86400) {
      scan.frequency = scan.frequency/(60 * 60 *24);
      oldFrequencyUnit = 'day';
    } else if (scan.frequency >= 3600) {
      scan.frequency = scan.frequency/(60 * 60);
      oldFrequencyUnit = 'hour';
    } else {
      scan.frequency = scan.frequency/(60);
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
        for (const org in scan.organizations){
          const thisOrganization: OrganizationType = scan.organizations[org];
          const thisOrganizationOption: OrganizationOption = {label: thisOrganization.name, value: thisOrganization.id};
          defaultOrganizations.push(thisOrganizationOption);
        }
        setValues((values) => ({
          ...values,
            organizations: defaultOrganizations
        }))
      }
      
      

  } 

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
        <Form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        {message && <p>{message}</p>}
        {(values.name === 'censysIpv4' || !scanSchema.global ) && (
          
          <Checkbox
            id="isGranular"
            label="Limit enabled organizations"
            name="isGranular"
            checked={values.isGranular}
            onChange={(e) => onChange('isGranular', e.target.checked)}
          />
        )}
        {values.isGranular && (
          <>
            <Label htmlFor="organizations">Enabled Organizations</Label>
            <MultiSelect
              name="organizations"
              options={organizationOptions}
              value={values.organizations}
              onChange={(e) => onChange('organizations', e)}
            />
            <br />
          </>
        )}
        <Checkbox
            id="isSingleScan"
            label="Run scan once"
            name="isSingleScan"
            checked={values.isSingleScan}
            onChange={(e) => onChange('isSingleScan', e.target.checked)}
          />
        {!values.isSingleScan && (
        <div className="form-group form-inline">
          <label style={{ marginRight: '10px' }} htmlFor="frequency">
            Run every
          </label>
          <TextInput
            id="frequency"
            name="frequency"
            type="number"
            style={{
              display: 'inline-block',
              width: '150px',
              marginRight: '15px'
            }}
            value={values.frequency}
            onChange={(e) => {
              onChange(e.target.name, Number(e.target.value));
            }}
          />
          <Dropdown
            id="frequencyUnit"
            name="frequencyUnit"
            onChange={onTextChange}
            value={values.frequencyUnit}
            style={{ display: 'inline-block', width: '150px' }}
          >
            <option value="minute">Minute(s)</option>
            <option value="hour">Hour(s)</option>
            <option value="day">Day(s)</option>
          </Dropdown>
        </div>
        )}
        <br />
        
        <Link to={`/scans`}>
        <Button type='button'> Return to Scans</Button>
        </Link>
        <Button type='submit' size = "big">Save Changes</Button>
        </Form>
        </div>
       
  );
};

export default ScanComponent;