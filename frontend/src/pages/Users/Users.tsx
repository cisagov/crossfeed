import classes from './Users.module.scss';
import React, { useCallback, useState } from 'react';
import {
  Button,
  TextInput,
  Label,
  ModalContainer,
  Overlay,
  Modal,
  FormGroup
} from '@trussworks/react-uswds';
import { Query, Organization } from 'types';
import { Table, FileInput } from 'components';
import { Column } from 'react-table';
import { User } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';
import Papa from 'papaparse';
import * as FileSaver from 'file-saver';

interface Errors extends Partial<User> {
  global?: string;
}

export const Users: React.FC = () => {
  const { apiGet, apiPost, apiDelete, setLoading } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);

  const columns: Column<User>[] = [
    {
      Header: 'Name',
      accessor: 'fullName',
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: 'email',
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Organizations',
      accessor: ({ roles }) =>
        roles &&
        roles
          .filter(role => role.approved)
          .map(role => role.organization.name)
          .join(', '),
      id: 'organizations',
      width: 200,
      disableFilters: true
    },
    {
      Header: 'User type',
      accessor: ({ userType }) =>
        userType === 'standard'
          ? 'Standard'
          : userType === 'globalView'
          ? 'Global View'
          : 'Global Admin',
      width: 50,
      minWidth: 50,
      id: 'userType',
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
    firstName: string;
    lastName: string;
    email: string;
    organization?: Organization;
    role: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });

  const fetchUsers = useCallback(
    async (query: Query<User>) => {
      try {
        let rows = await apiGet<User[]>('/users/');
        setUsers(rows);
      } catch (e) {
        console.error(e);
      }
    },
    [apiGet]
  );

  const deleteRow = async (index: number) => {
    try {
      let row = users[index];
      await apiDelete(`/users/${row.id}`);
      setUsers(users.filter(user => user.id !== row.id));
    } catch (e) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to delete user' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      let body = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role
      };
      const user = await apiPost('/users/', {
        body
      });
      setUsers(users.concat(user));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting user entry.'
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

  const downloadCSV = (filename: string) => {
    const csv = Papa.unparse({
      fields: ['firstName', 'lastName', 'email', 'userType'],
      data: users
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, `${filename}.csv`);
  };

  const parseCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files.length) {
      return;
    }
    setLoading(l => l + 1);
    const results: User[] = await new Promise((resolve, reject) =>
      Papa.parse(event.target.files![0], {
        header: true,
        complete: ({ data, errors }) =>
          errors.length ? reject(errors) : resolve(data as User[])
      })
    );
    setLoading(l => l - 1);
    // TODO: use a batch call here instead.
    let createdUsers = [];
    for (let result of results) {
      createdUsers.push(
        await apiPost('/users/', {
          body: result
        })
      );
    }
    setUsers(users.concat(...createdUsers));
  };

  console.log('users', users);
  return (
    <div className={classes.root}>
      <h1>Users</h1>
      <Table<User> columns={columns} data={users} fetchData={fetchUsers} />
      <h2>Export users</h2>
      <Button type="button" outline onClick={e => downloadCSV('users')}>
        Export as CSV
      </Button>
      <h2>Import users</h2>
      <FormGroup>
        <Label htmlFor="import">
          File must be in a CSV format, with the same header as the exported
          file.
        </Label>
        <FileInput id="import" accept=".csv" onChange={e => parseCSV(e)} />
      </FormGroup>
      <h2>Invite a user</h2>
      <form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="firstName">First Name</Label>
        <TextInput
          required
          id="firstName"
          name="firstName"
          className={classes.textField}
          type="text"
          value={values.firstName}
          onChange={onTextChange}
        />
        <Label htmlFor="lastName">Last Name</Label>
        <TextInput
          required
          id="lastName"
          name="lastName"
          className={classes.textField}
          type="text"
          value={values.lastName}
          onChange={onTextChange}
        />
        <Label htmlFor="email">Email</Label>
        <TextInput
          required
          id="email"
          name="email"
          className={classes.textField}
          type="text"
          value={values.email}
          onChange={onTextChange}
        />
        <Label htmlFor="role">Role</Label>
        <TextInput
          required
          id="role"
          name="role"
          className={classes.textField}
          type="text"
          value={values.role}
          onChange={onTextChange}
        />
        <br></br>
        <Button type="submit">Invite User</Button>
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
              title={<h2>Delete user?</h2>}
            >
              <p>
                Are you sure you would like to delete{' '}
                <code>{users[selectedRow].fullName}</code>?
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};

export default Users;
