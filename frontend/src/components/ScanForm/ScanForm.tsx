import React, { useState, useEffect, useCallback } from 'react';
import classes from './styles.module.scss';
import { Organization as OrganizationType, Scan, ScanSchema } from 'types';
import {
  Button,
  Form,
  Dropdown,
  TextInput,
  Checkbox,
  Label
} from '@trussworks/react-uswds';
import MultiSelect from 'pages/Scans/MultiSelect';
import { OrganizationOption } from 'pages/Scans/ScansView';
import { Link } from 'react-router-dom';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

export interface ScanFormValues {
  name: string;
  organizations: OrganizationOption[];
  arguments: any;
  frequency: number;
  frequencyUnit: string;
  isGranular: boolean;
  isSingleScan: boolean;
}

export const ScanForm: React.FC<{
  propValues: ScanFormValues;
  organizationOption: OrganizationOption[];
  global?: any;
  onSubmit: (values: any) => Promise<void>;
  //'create' or 'edit'
  type: string;
  scan?: Scan;
  scanSchema: ScanSchema;
}> = ({
  propValues,
  organizationOption,
  global,
  onSubmit,
  type,
  scan,
  scanSchema
}) => {
  const setDefault = () => ({
    name: scan ? scan.name : 'censys',
    arguments: scan ? scan.arguments : '{}',
    frequency: scan ? scan.frequency : 1,
    frequencyUnit: scan ? propValues.frequencyUnit : 'minute',
    isGranular: scan ? scan.isGranular : false,
    isSingleScan: scan ? scan.isSingleScan : false,
    organizations: scan ? propValues.organizations : []
  });
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >(organizationOption);
  const [values, setValues] = useState<ScanFormValues>(setDefault());
  const [schemaUpdated, setSchemaUpdated] = useState<boolean>(false);

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    onChange(e.target.name, e.target.value);
    //Ensures global scans can't be granular
    if (type === 'create' && scanSchema[e.target.value]) {
      onChange('isGranular', false);
    }
  };

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };
  const setDefaultValues = useCallback(async () => {
    try {
      setOrganizationOptions(organizationOption);
      if (scanSchema && scanSchema[values.name]) {
        setSchemaUpdated(true);
      }
      if (scan) {
        setValues((values) => ({
          ...values,
          name: scan.name,
          frequency: propValues.frequency,
          frequencyUnit: propValues.frequencyUnit,
          isGranular: scan.isGranular,
          isSingleScan: scan.isSingleScan,
          organizations: propValues.organizations
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [
    organizationOption,
    propValues.frequency,
    propValues.frequencyUnit,
    propValues.organizations,
    scan,
    scanSchema,
    values.name
  ]);

  useEffect(() => {
    setDefaultValues();
  }, [setDefaultValues]);

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          name: values.name,
          arguments: values.arguments,
          organizations: values.organizations,
          frequency: values.frequency,
          frequencyUnit: values.frequencyUnit,
          isGranular: values.isGranular,
          isSingleScan: values.isSingleScan
        });
      }}
      className={classes.form}
    >
      {type === 'create' && scanSchema && <Label htmlFor="name">Name</Label> && (
        <Dropdown
          required
          id="name"
          name="name"
          className={classes.textField}
          onChange={onTextChange}
          value={values.name}
        >
          {Object.keys(scanSchema).map((i) => {
            return (
              <option key={i} value={i}>
                {i}
              </option>
            );
          })}
        </Dropdown>
      )}
      {schemaUpdated && <p>{scanSchema[values.name].description}</p>}
      {/* <Label htmlFor="arguments">Arguments</Label>
        <TextInput
          required
          id="arguments"
          name="arguments"
          className={classes.textField}
          type="text"
          value={values.arguments}
          onChange={onTextChange}
        /> */}
      {type === 'edit' &&
        (values.name === 'censysIpv4' ||
          values.name === 'censysCertificates' ||
          values.name === 'webscraper' ||
          !global) && (
          <Checkbox
            id="isGranular"
            label="Limit enabled organizations"
            name="isGranular"
            checked={values.isGranular}
            onChange={(e) => onChange('isGranular', e.target.checked)}
          />
        )}
      {type === 'create' &&
        (values.name === 'censysIpv4' ||
        values.name === 'censysCertificates' ||
          values.name === 'webscraper' ||
          (schemaUpdated && !scanSchema[values.name].global)) && (
          <Checkbox
            id="isGranular"
            label="Limit enabled organizations"
            name="isGranular"
            checked={values.isGranular}
            onChange={(e) => onChange('isGranular', e.target.checked)}
          />
        )}
      {values.isGranular &&
        (values.name === 'censysIpv4' ||
        values.name === 'censysCertificates' ||
          (schemaUpdated && !scanSchema[values.name].global) ||
          !global) && (
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
      {type === 'edit' && (
        <Link to={`/scans`}>
          <Button type="button" outline> Return to Scans</Button>
        </Link>
      )}
      {type === 'edit' && <Button type="submit">Save Changes</Button>}
      {type === 'create' && <Button type="submit">Create Scan</Button>}
    </Form>
  );
};
