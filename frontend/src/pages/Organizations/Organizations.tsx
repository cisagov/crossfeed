import classes from './Organizations.module.scss';
import React, { useCallback, useState } from 'react';
import {
  Button,
  TextInput,
  Label,
  ModalContainer,
  Overlay,
  Modal,
  Checkbox
} from '@trussworks/react-uswds';
import { Query } from 'types';
import { Table } from 'components';
import { Column } from 'react-table';
import { Organization } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';

interface Errors extends Partial<Organization> {
  global?: string;
}

export const Organizations: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const columns: Column<Organization>[] = [
    {
      Header: 'Name',
      accessor: 'name',
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Root Domains',
      accessor: ({ rootDomains }) => rootDomains.join(', '),
      width: 150,
      minWidth: 150,
      id: 'rootDomains',
      disableFilters: true
    },
    {
      Header: 'IP Blocks',
      accessor: ({ ipBlocks }) => ipBlocks.join(', '),
      id: 'ipBlocks',
      width: 200,
      disableFilters: true
    },
    {
      Header: 'Passive',
      accessor: ({ isPassive }) => (isPassive ? 'Yes' : 'No'),
      id: 'isPassive',
      width: 100,
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
    rootDomains: string;
    ipBlocks: string;
    isPassive: boolean;
  }>({
    name: '',
    rootDomains: '',
    ipBlocks: '',
    isPassive: false
  });

  const fetchOrganizations = useCallback(
    async (query: Query<Organization>) => {
      try {
        let rows = await apiGet<Organization[]>('/organizations/');
        setOrganizations(rows);
      } catch (e) {
        console.error(e);
      }
    },
    [apiGet]
  );

  const deleteRow = async (index: number) => {
    try {
      let row = organizations[index];
      await apiDelete(`/organizations/${row.id}`);
      setOrganizations(
        organizations.filter(organization => organization.id !== row.id)
      );
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Unable to delete organization'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      console.log(values);
      let body = {
        rootDomains:
          values.rootDomains === '' ? [] : values.rootDomains.split(','),
        ipBlocks: values.ipBlocks === '' ? [] : values.ipBlocks.split(','),
        name: values.name,
        isPassive: values.isPassive
      };
      const org = await apiPost('/organizations/', {
        body
      });
      setOrganizations(organizations.concat(org));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting organization entry.'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = e => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues(values => ({
      ...values,
      [name]: value
    }));
  };

  React.useEffect(() => {
    document.addEventListener('keyup', e => {
      //Escape
      if (e.keyCode === 27) {
        setShowModal(false);
      }
    });
  }, [apiGet]);

  return (
    <div className={classes.root}>
      <h1>Organizations</h1>
      <Table<Organization>
        columns={columns}
        data={organizations}
        fetchData={fetchOrganizations}
      />
      <h2>Add an organization</h2>
      <form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="name">Name</Label>
        <TextInput
          required
          id="name"
          name="name"
          className={classes.textField}
          type="text"
          value={values.name}
          onChange={onTextChange}
        />
        <Label htmlFor="rootDomains">Root Domains</Label>
        <TextInput
          required
          id="rootDomains"
          name="rootDomains"
          className={classes.textField}
          type="text"
          value={values.rootDomains}
          onChange={onTextChange}
        />
        <Label htmlFor="ipBlocks">IP Blocks (Optional)</Label>
        <TextInput
          id="ipBlocks"
          name="ipBlocks"
          className={classes.textField}
          type="text"
          value={values.ipBlocks}
          onChange={onTextChange}
        />
        <br></br>
        <Checkbox
          id="isPassive"
          name="isPassive"
          label="Passive operation"
          checked={values.isPassive}
          onChange={e => {
            onChange(e.target.name, e.target.checked);
          }}
        />
        <br></br>
        <Button type="submit">Create Organization</Button>
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
              title={<h2>Delete organization?</h2>}
            >
              <p>
                Are you sure you would like to delete the{' '}
                <code>{organizations[selectedRow].name}</code> organization?
                This will irreversibly delete all associated domains.
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};

export default Organizations;
