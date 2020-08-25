import React, { useState } from 'react';
import classes from './styles.module.scss';
import { Organization } from 'types';
import { Label, TextInput, Checkbox, Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';

export interface OrganizationFormValues {
  name: string;
  rootDomains: string;
  ipBlocks: string;
  isPassive: boolean;
  inviteOnly: boolean;
}

export const OrganizationForm: React.FC<{
  organization?: Organization;
  onSubmit: (values: Object) => Promise<void>;
  type: string;
}> = ({ organization, onSubmit, type }) => {
  const defaultValues = () => ({
    name: organization ? organization.name : '',
    rootDomains: organization ? organization.rootDomains.join(', ') : '',
    ipBlocks: organization ? organization.ipBlocks.join(', ') : '',
    isPassive: organization ? organization.isPassive : false,
    inviteOnly: organization ? organization.inviteOnly : false
  });

  const { user } = useAuthContext();

  const [values, setValues] = useState<OrganizationFormValues>(defaultValues);

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = e => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues(values => ({
      ...values,
      [name]: value
    }));
  };

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        await onSubmit({
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
        });
        if (!organization) setValues(defaultValues);
      }}
      className={classes.form}
    >
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
      {user?.userType === 'globalAdmin' && <>
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
      </>}
      <br></br>
      <Checkbox
        id="isPassive"
        name="isPassive"
        label="Passive mode"
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
      <Button type="submit">
        {type === 'update' ? 'Update' : 'Create'} Organization
      </Button>
    </form>
  );
};
