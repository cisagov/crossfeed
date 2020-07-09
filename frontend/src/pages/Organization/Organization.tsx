import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import classes from './styles.module.scss';
import { Organization as OrganizationType, Role } from 'types';
import {
  FaGlobe,
  FaNetworkWired,
  FaClock,
  FaCheck,
  FaUsers
} from 'react-icons/fa';
import { Column } from 'react-table';
import { Table } from 'components';
import { Label, TextInput, Checkbox, Button } from '@trussworks/react-uswds';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

export const Organization: React.FC = () => {
  const { organizationId } = useParams();
  const { apiGet, apiPut } = useAuthContext();
  const [organization, setOrganization] = useState<OrganizationType>();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>('');

  const [values, setValues] = useState<{
    name: string;
    rootDomains: string;
    ipBlocks: string;
    isPassive: boolean;
    inviteOnly: boolean;
  }>({
    name: '',
    rootDomains: '',
    ipBlocks: '',
    isPassive: false,
    inviteOnly: false
  });

  const columns: Column<Role>[] = [
    {
      Header: 'Name',
      accessor: ({ user }) => user.fullName,
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: ({ user }) => user.email,
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Approve',
      id: 'approve',
      Cell: ({ row }: { row: { index: number } }) => (
        <span onClick={() => {}}>
          <FaCheck />
        </span>
      ),
      disableFilters: true
    }
  ];

  const fetchOrganization = useCallback(async () => {
    try {
      const organization = await apiGet<OrganizationType>(
        `/organizations/${organizationId}`
      );
      setOrganization(organization);
      setValues({
        name: organization.name,
        rootDomains: organization.rootDomains.join(', '),
        ipBlocks: organization.ipBlocks.join(', '),
        isPassive: organization.isPassive,
        inviteOnly: organization.inviteOnly
      });
    } catch (e) {
      console.error(e);
    }
  }, [organizationId, apiGet, setOrganization]);

  const updateOrganization: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      let body = {
        rootDomains:
          values.rootDomains === ''
            ? []
            : values.rootDomains.split(',').map(domain => domain.trim()),
        ipBlocks:
          values.ipBlocks === ''
            ? []
            : values.ipBlocks.split(',').map(ip => ip.trim()),
        name: values.name,
        isPassive: values.isPassive,
        inviteOnly: values.inviteOnly
      };
      const org = await apiPut('/organizations/' + organization?.id, {
        body
      });
      console.log(org);
      setOrganization(org);
      setMessage('Organization successfully updated');
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
    setValues({
      ...values,
      [name]: value
    });
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        {organization && (
          <>
            <div className={classes.header}>
              <div className={classes.headerDetails}>
                <h1>{organization.name}</h1>
                <div className={classes.headerRow}>
                  <label>
                    <FaNetworkWired />
                    Root Domains
                  </label>
                  <span>{organization.rootDomains.join(', ')}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaGlobe />
                    IP Blocks
                  </label>
                  <span>{organization.ipBlocks.join(', ')}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaClock />
                    Passive Mode
                  </label>
                  <span>{organization.isPassive ? 'Yes' : 'No'}</span>
                </div>

                <div className={classes.headerRow}>
                  <label>
                    <FaUsers />
                    Invite Only
                  </label>
                  <span>{organization.inviteOnly ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            <h1>Organization Users</h1>
            <Table<Role> columns={columns} data={organization.userRoles} />
            <h2>Update Organization</h2>
            <form onSubmit={updateOrganization} className={classes.form}>
              {errors.global && (
                <p className={classes.error}>{errors.global}</p>
              )}
              {message && <p>{message}</p>}
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
              <Checkbox
                id="inviteOnly"
                name="inviteOnly"
                label="Invite only"
                checked={values.inviteOnly}
                onChange={e => {
                  onChange(e.target.name, e.target.checked);
                }}
              />
              <br></br>
              <Button type="submit">Update Organization</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Organization;
