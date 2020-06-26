import classes from './Scans.module.scss';
import React, { useCallback, useState } from 'react';
import {
  Button,
  TextInput,
  Label,
  Dropdown,
  ModalContainer,
  Overlay,
  Modal
} from '@trussworks/react-uswds';
import { Query } from 'types';
import { Table } from 'components';
import { Column } from 'react-table';
import { Scan } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';

interface Errors extends Partial<Scan> {
  global?: string;
}

export const Scans: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [scans, setScans] = useState<Scan[]>([]);
  const [validCommands, setValidCommands] = useState<Array<string>>([]);

  const columns: Column<Scan>[] = [
    {
      Header: 'Name',
      accessor: 'name',
      width: 200,
      id: 'name',
      disableFilters: true
    },
    {
      Header: 'Arguments',
      accessor: (args: Scan) => JSON.stringify(args.arguments),
      width: 150,
      minWidth: 150,
      id: 'arguments',
      disableFilters: true
    },
    {
      Header: 'Frequency',
      accessor: 'frequency',
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
          : args.lastRun;
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
    }
  ];
  const [errors, setErrors] = useState<Errors>({});

  const [values, setValues] = useState<{
    name: string;
    arguments: string;
    frequency: number;
  }>({
    name: 'censys',
    arguments: '{}',
    frequency: 0
  });

  React.useEffect(() => {
    document.addEventListener('keyup', e => {
      //Escape
      if (e.keyCode === 27) {
        setShowModal(false);
      }
    });
  }, [apiGet]);

  const fetchScans = useCallback(
    async (query: Query<Scan>) => {
      try {
        let { scans, schema } = await apiGet<{ scans: Scan[]; schema: Object }>(
          '/scans/'
        );
        setScans(scans);
        setValidCommands(Object.keys(schema));
      } catch (e) {
        console.error(e);
      }
    },
    [apiGet]
  );

  const deleteRow = async (index: number) => {
    try {
      let row = scans[index];
      await apiDelete(`/scans/${row.id}`);
      setScans(scans.filter(scan => scan.id !== row.id));
    } catch (e) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to delete scan' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      // For now, parse the arguments as JSON. We'll want to add a GUI for this in the future
      values.arguments = JSON.parse(values.arguments);
      const scan = await apiPost('/scans/', {
        body: values
      });
      setScans(scans.concat(scan));
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = e => {
    e.persist();
    setValues(values => ({
      ...values,
      [e.target.name]:
        e.target.name === 'frequency'
          ? parseInt(e.target.value)
          : e.target.value
    }));
  };

  return (
    <div className={classes.root}>
      <h1>Scans</h1>
      <Table<Scan> columns={columns} data={scans} fetchData={fetchScans} />
      <h2>Add a scan</h2>
      <form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="name">Name</Label>
        <Dropdown
          required
          id="name"
          name="name"
          className={classes.textField}
          onChange={onChange}
        >
          {validCommands.map(i => {
            return (
              <option key={i} value={i}>
                {i}
              </option>
            );
          })}
        </Dropdown>

        <Label htmlFor="arguments">Arguments</Label>
        <TextInput
          required
          id="arguments"
          name="arguments"
          className={classes.textField}
          type="text"
          onChange={onChange}
        />
        <Label htmlFor="frequency">Frequency</Label>
        <TextInput
          required
          id="frequency"
          name="frequency"
          className={classes.textField}
          type="number"
          onChange={onChange}
        />
        <br></br>
        <Button type="submit">Create Scan</Button>
      </form>

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
    </div>
  );
};

export default Scans;
