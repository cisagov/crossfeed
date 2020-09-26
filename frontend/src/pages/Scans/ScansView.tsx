import classes from './Scans.module.scss';
import React, { useCallback, useState } from 'react';
import {
  Button,
  TextInput,
  Label,
  Dropdown,
  ModalContainer,
  Overlay,
  Modal,
  Form,
  Checkbox
} from '@trussworks/react-uswds';
import { Table, ImportExport } from 'components';
import { Column } from 'react-table';
import { Scan, Organization, ScanSchema } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';
import { formatDistanceToNow, parseISO } from 'date-fns';
import MultiSelect from './MultiSelect';

interface Errors extends Partial<Scan> {
  global?: string;
  scheduler?: string;
}

interface OrganizationOption {
  label: string;
  value: string;
}

const ScansView: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [scans, setScans] = useState<Scan[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});

  const columns: Column<Scan>[] = [
    {
      Header: 'Name',
      accessor: 'name',
      width: 200,
      id: 'name',
      disableFilters: true
    },
    {
      Header: 'Run per organization',
      accessor: ({ isGranular }) => (isGranular ? 'Yes' : 'No'),
      width: 150,
      minWidth: 150,
      id: 'granular',
      disableFilters: true
    },
    {
      Header: 'Mode',
      accessor: ({ name }) =>
        scanSchema[name] && scanSchema[name].isPassive ? 'Passive' : 'Active',
      width: 150,
      minWidth: 150,
      id: 'mode',
      disableFilters: true
    },
    {
      Header: 'Frequency',
      accessor: ({ frequency }) => {
        let val, unit;
        if (frequency < 60 * 60) {
          val = frequency / 60;
          unit = 'minute';
        } else if (frequency < 60 * 60 * 24) {
          val = frequency / (60 * 60);
          unit = 'hour';
        } else {
          val = frequency / (60 * 60 * 24);
          unit = 'day';
        }
        return `Every ${val} ${unit}${val === 1 ? '' : 's'}`;
      },
      width: 200,
      id: 'frequency',
      disableFilters: true
    },
    {
      Header: 'Last Run',
      accessor: (args: Scan) => {
        return !args.lastRun ||
          new Date(args.lastRun).getTime() === new Date(0).getTime()
          ? 'Never'
          : `${formatDistanceToNow(parseISO(args.lastRun))} ago`;
      },
      width: 200,
      id: 'lastRun',
      disableFilters: true
    },
    {
      Header: 'Delete',
      id: 'delete',
      Cell: ({ row }: { row: { index: number } }) => (
        <span
          onClick={() => {
            setShowModal(true);
            setSelectedRow(row.index);
          }}
        >
          <FaTimes />
        </span>
      ),
      disableFilters: true
    },
    {
      Header: 'Description',
      accessor: ({ name }) => scanSchema[name]?.description,
      width: 200,
      maxWidth: 200,
      id: 'description',
      disableFilters: true
    }
  ];
  const [errors, setErrors] = useState<Errors>({});

  const [values, setValues] = useState<{
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

  React.useEffect(() => {
    document.addEventListener('keyup', (e) => {
      //Escape
      if (e.keyCode === 27) {
        setShowModal(false);
      }
    });
  }, [apiGet]);

  const fetchScans = useCallback(async () => {
    try {
      let { scans, organizations, schema } = await apiGet<{
        scans: Scan[];
        organizations: Organization[];
        schema: ScanSchema;
      }>('/scans/');
      setScans(scans);
      setScanSchema(schema);
      setOrganizationOptions(
        organizations.map((e) => ({ label: e.name, value: e.id }))
      );
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  const deleteRow = async (index: number) => {
    try {
      let row = scans[index];
      await apiDelete(`/scans/${row.id}`);
      setScans(scans.filter((scan) => scan.id !== row.id));
    } catch (e) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to delete scan' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      // For now, parse the arguments as JSON. We'll want to add a GUI for this in the future
      let body: typeof values = Object.assign({}, values);
      body.arguments = JSON.parse(values.arguments);
      if (values.frequencyUnit === 'minute') body.frequency *= 60;
      else if (values.frequencyUnit === 'hour') body.frequency *= 60 * 60;
      else body.frequency *= 60 * 60 * 24;

      const scan = await apiPost('/scans/', {
        body: {
          ...body,
          organizations: body.organizations
            ? body.organizations.map((e) => e.value)
            : []
        }
      });
      setScans(scans.concat(scan));
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const invokeScheduler = async () => {
    setErrors({ ...errors, scheduler: '' });
    try {
      await apiPost('/scheduler/invoke', {});
    } catch (e) {
      console.error(e);
      setErrors({ ...errors, scheduler: 'Invocation failed.' });
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

  const selectedScan = scanSchema[values.name] || {};

  return (
    <>
      <Table<Scan> columns={columns} data={scans} fetchData={fetchScans} />
      <Button type="submit" outline onClick={invokeScheduler}>
        Manually run scheduler
      </Button>
      {errors.scheduler && <p className={classes.error}>{errors.scheduler}</p>}
      <h2>Add a scan</h2>
      <Form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="name">Name</Label>
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
        <p>{selectedScan.description}</p>
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
        {(values.name === 'censysIpv4' || !selectedScan.global) && (
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
        <br />

        <Button type="submit">Create Scan</Button>
      </Form>
      <ImportExport<Scan>
        name="scans"
        fieldsToExport={['name', 'arguments', 'frequency']}
        onImport={async (results) => {
          // TODO: use a batch call here instead.
          let createdScans = [];
          for (let result of results) {
            createdScans.push(
              await apiPost('/scans/', {
                body: {
                  ...result,
                  // These fields are initially parsed as strings, so they need
                  // to be converted to objects.
                  arguments: JSON.parse(
                    ((result.arguments as unknown) as string) || ''
                  )
                }
              })
            );
          }
          setScans(scans.concat(...createdScans));
        }}
        getDataToExport={() =>
          scans.map((scan) => ({
            ...scan,
            arguments: JSON.stringify(scan.arguments)
          }))
        }
      />

      {showModal && (
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
                      setShowModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      deleteRow(selectedRow);
                      setShowModal(false);
                    }}
                  >
                    Delete
                  </Button>
                </>
              }
              title={<h2>Delete scan?</h2>}
            >
              <p>
                Are you sure you would like to delete the{' '}
                <code>{scans[selectedRow].name}</code> scan?
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </>
  );
};

export default ScansView;
