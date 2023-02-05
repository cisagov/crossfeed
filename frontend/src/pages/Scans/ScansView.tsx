import classes from './Scans.module.scss';
import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ButtonGroup,
  ModalFooter,
  ModalHeading,
  ModalRef
} from '@trussworks/react-uswds';
import { ModalToggleButton } from 'components';
import { Table, ImportExport } from 'components';
import { Column, CellProps } from 'react-table';
import { Scan, Organization, ScanSchema, OrganizationTag } from 'types';
import { FaTimes, FaEdit } from 'react-icons/fa';
import { FaPlayCircle } from 'react-icons/fa';
import { useAuthContext } from 'context';
// @ts-ignore:next-line
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { setFrequency } from 'pages/Scan/Scan';
import { ScanForm, ScanFormValues } from 'components/ScanForm';

interface Errors extends Partial<Scan> {
  global?: string;
  scheduler?: string;
}

export interface OrganizationOption {
  label: string;
  value: string;
}

const ScansView: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const modalRef = useRef<ModalRef>(null);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [scans, setScans] = useState<Scan[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<
    OrganizationOption[]
  >([]);
  const [tags, setTags] = useState<OrganizationTag[]>([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});

  const columns: Column<Scan>[] = [
    {
      Header: 'Run',
      id: 'run',
      Cell: ({ row }: { row: { index: number } }) => (
        <div
          style={{ textAlign: 'center' }}
          onClick={() => {
            runScan(row.index);
          }}
        >
          <FaPlayCircle />
        </div>
      ),
      disableFilters: true
    },
    {
      Header: 'Name',
      accessor: 'name',
      width: 200,
      id: 'name',
      disableFilters: true
    },
    {
      Header: 'Tags',
      accessor: ({ tags }) => tags.map((tag) => tag.name).join(', '),
      width: 150,
      minWidth: 150,
      id: 'tags',
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
      accessor: ({ frequency, isSingleScan }) => {
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
        if (isSingleScan) {
          return 'Single Scan';
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
          ? 'None'
          : `${formatDistanceToNow(parseISO(args.lastRun))} ago`;
      },
      width: 200,
      id: 'lastRun',
      disableFilters: true
    },
    {
      Header: 'Edit',
      id: 'edit',
      Cell: ({ row }: CellProps<Scan>) => (
        <Link to={`/scans/${row.original.id}`} style={{ color: 'black' }}>
          <FaEdit />
        </Link>
      ),
      disableFilters: true
    },
    {
      Header: 'Delete',
      id: 'delete',
      Cell: ({ row }: { row: { index: number } }) => (
        <span
          onClick={() => {
            modalRef.current?.toggleModal(undefined, true);
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

  const [values] = useState<ScanFormValues>({
    name: 'censys',
    arguments: '{}',
    organizations: [],
    frequency: 1,
    frequencyUnit: 'minute',
    isGranular: false,
    isUserModifiable: false,
    isSingleScan: false,
    tags: []
  });

  const fetchScans = useCallback(async () => {
    try {
      const { scans, organizations, schema } = await apiGet<{
        scans: Scan[];
        organizations: Organization[];
        schema: ScanSchema;
      }>('/scans/');
      const tags = await apiGet<OrganizationTag[]>(`/organizations/tags`);
      setScans(scans);
      setScanSchema(schema);
      setOrganizationOptions(
        organizations.map((e) => ({ label: e.name, value: e.id }))
      );
      setTags(tags);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  const deleteRow = async (index: number) => {
    try {
      const row = scans[index];
      await apiDelete(`/scans/${row.id}`, { body: {} });
      setScans(scans.filter((scan) => scan.id !== row.id));
    } catch (e: any) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to delete scan' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit = async (body: ScanFormValues) => {
    try {
      // For now, parse the arguments as JSON. We'll want to add a GUI for this in the future
      body.arguments = JSON.parse(body.arguments);
      setFrequency(body);

      const scan = await apiPost('/scans/', {
        body: {
          ...body,
          organizations: body.organizations
            ? body.organizations.map((e) => e.value)
            : [],
          tags: body.tags ? body.tags.map((e) => ({ id: e.value })) : []
        }
      });
      setScans(scans.concat(scan));
    } catch (e: any) {
      setErrors({
        global: e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const invokeScheduler = async () => {
    setErrors({ ...errors, scheduler: '' });
    try {
      await apiPost('/scheduler/invoke', { body: {} });
    } catch (e) {
      console.error(e);
      setErrors({ ...errors, scheduler: 'Invocation failed.' });
    }
  };

  /**
   * Manually runs a single scan, then immediately invokes the
   * scheduler so the scan is run.
   * @param index Row index
   */
  const runScan = async (index: number) => {
    const row = scans[index];
    try {
      await apiPost(`/scans/${row.id}/run`, { body: {} });
    } catch (e) {
      console.error(e);
      setErrors({ ...errors, scheduler: 'Run failed.' });
    }
    await invokeScheduler();
  };

  return (
    <>
      <Table<Scan> columns={columns} data={scans} fetchData={fetchScans} />
      <br></br>
      <Button type="submit" outline onClick={invokeScheduler}>
        Manually run scheduler
      </Button>
      {errors.scheduler && <p className={classes.error}>{errors.scheduler}</p>}
      <h2>Add a scan</h2>
      {errors.global && <p className={classes.error}>{errors.global}</p>}
      <ScanForm
        organizationOption={organizationOptions}
        tags={tags}
        propValues={values}
        onSubmit={onSubmit}
        type="create"
        scanSchema={scanSchema}
      ></ScanForm>
      <ImportExport<Scan>
        name="scans"
        fieldsToExport={['name', 'arguments', 'frequency']}
        onImport={async (results) => {
          // TODO: use a batch call here instead.
          const createdScans = [];
          for (const result of results) {
            createdScans.push(
              await apiPost('/scans/', {
                body: {
                  ...result,
                  // These fields are initially parsed as strings, so they need
                  // to be converted to objects.
                  arguments: JSON.parse(
                    (result.arguments as unknown as string) || ''
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

      <Modal ref={modalRef} id="modal">
        <ModalHeading>Delete scan?</ModalHeading>
        <p>
          Are you sure you would like to delete the{' '}
          <code>{scans[selectedRow]?.name}</code> scan?
        </p>
        <ModalFooter>
          <ButtonGroup>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              onClick={() => {
                deleteRow(selectedRow);
              }}
            >
              Delete
            </ModalToggleButton>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              unstyled
              className="padding-105 text-center"
            >
              Cancel
            </ModalToggleButton>
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ScansView;
