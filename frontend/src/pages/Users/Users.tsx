import classes from './Users.module.scss';
import React, { useCallback, useRef, useState } from 'react';
import {
  Button,
  TextInput,
  Label,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef
} from '@trussworks/react-uswds';
import { ModalToggleButton } from 'components';
import { Organization } from 'types';
import { Table, ImportExport } from 'components';
import { Column } from 'react-table';
import { User } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';
// @ts-ignore:next-line
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  ButtonGroup
} from '@material-ui/core';

interface Errors extends Partial<User> {
  global?: string;
}

export const Users: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const modalRef = useRef<ModalRef>(null);
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
          .filter((role) => role.approved)
          .map((role) => role.organization.name)
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
      Header: 'Date ToU Signed',
      accessor: ({ dateAcceptedTerms }) =>
        dateAcceptedTerms
          ? `${formatDistanceToNow(parseISO(dateAcceptedTerms))} ago`
          : 'None',
      width: 50,
      minWidth: 50,
      id: 'dateAcceptedTerms',
      disableFilters: true
    },
    {
      Header: 'ToU Version',
      accessor: 'acceptedTermsVersion',
      width: 50,
      minWidth: 50,
      id: 'acceptedTermsVersion',
      disableFilters: true
    },
    {
      Header: 'Last Logged In',
      accessor: ({ lastLoggedIn }) =>
        lastLoggedIn
          ? `${formatDistanceToNow(parseISO(lastLoggedIn))} ago`
          : 'None',
      width: 50,
      minWidth: 50,
      id: 'lastLoggedIn',
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
    }
  ];
  const [errors, setErrors] = useState<Errors>({});

  const [values, setValues] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    organization?: Organization;
    userType: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    userType: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      const rows = await apiGet<User[]>('/users/');
      setUsers(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  const deleteRow = async (index: number) => {
    try {
      const row = users[index];
      await apiDelete(`/users/${row.id}`, { body: {} });
      setUsers(users.filter((user) => user.id !== row.id));
    } catch (e: any) {
      setErrors({
        global:
          e.status === 422 ? 'Unable to delete user' : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const body = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        userType: values.userType
      };
      const user = await apiPost('/users/', {
        body
      });
      setUsers(users.concat(user));
    } catch (e: any) {
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
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  return (
    <div className={classes.root}>
      <h1>Users</h1>
      <Table<User> columns={columns} data={users} fetchData={fetchUsers} />
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
        <Label htmlFor="userType">User Type</Label>
        <RadioGroup
          aria-label="User Type"
          name="userType"
          value={values.userType}
          onChange={onTextChange}
        >
          <FormControlLabel
            value="standard"
            control={<Radio color="primary" />}
            label="Standard"
          />
          <FormControlLabel
            value="globalView"
            control={<Radio color="primary" />}
            label="Global View"
          />
          <FormControlLabel
            value="globalAdmin"
            control={<Radio color="primary" />}
            label="Global Administrator"
          />
        </RadioGroup>
        <br></br>
        <Button type="submit">Invite User</Button>
      </form>
      <ImportExport<
        | User
        | {
            roles: string;
          }
      >
        name="users"
        fieldsToExport={['firstName', 'lastName', 'email', 'roles', 'userType']}
        onImport={async (results) => {
          // TODO: use a batch call here instead.
          const createdUsers = [];
          for (const result of results) {
            const parsedRoles: {
              organization: string;
              role: string;
            }[] = JSON.parse(result.roles as string);
            const body: any = result;
            // For now, just create role with the first organization
            if (parsedRoles.length > 0) {
              body.organization = parsedRoles[0].organization;
              body.organizationAdmin = parsedRoles[0].role === 'admin';
            }
            try {
              createdUsers.push(
                await apiPost('/users/', {
                  body
                })
              );
            } catch (e) {
              // Just continue when an error occurs
              console.error(e);
            }
          }
          setUsers(users.concat(...createdUsers));
        }}
        getDataToExport={() =>
          users.map((user) => ({
            ...user,
            roles: JSON.stringify(
              user.roles.map((role) => ({
                organization: role.organization.id,
                role: role.role
              }))
            )
          }))
        }
      />

      <Modal ref={modalRef} id="modal">
        <ModalHeading>Delete user?</ModalHeading>
        <p>
          Are you sure you would like to delete{' '}
          <code>{users[selectedRow]?.fullName}</code>?
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
    </div>
  );
};

export default Users;
