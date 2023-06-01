import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button, TextInput, Label, Dropdown } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { User } from 'types';

interface FormData {
  firstName: string;
  lastName: string;
  organization?: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthCreateAccount: React.FC = () => {
  const history = useHistory();
  const [values, setValues] = useState<FormData>({
    firstName: '',
    lastName: '',
    organization: undefined
  });
  const [errors, setErrors] = useState<Errors>({});
  const [publicOrgs, setPublicOrgs] = useState<{ name: string; id: string }[]>(
    []
  );
  const { user, setUser, apiGet, apiPut } = useAuthContext();

  const fetchPublicOrgs = useCallback(async () => {
    const publicOrgs = await apiGet('/organizations/public');
    publicOrgs.unshift({
      name: 'None',
      id: ''
    });
    setPublicOrgs(publicOrgs);
    if (publicOrgs.length > 0)
      setValues((values) => ({
        ...values,
        organization: publicOrgs[0].id
      }));
  }, [apiGet, setValues]);

  useEffect(() => {
    fetchPublicOrgs();
  }, [fetchPublicOrgs]);

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      if (!user) throw Error('Unable to register');
      const updated: User = await apiPut(`/users/${user.id}`, {
        body: values
      });

      setUser(updated);
      history.push('/', {
        message: 'Your account has been successfully created.'
      });
    } catch (e: any) {
      setErrors({
        global: e.message ?? e.toString()
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h2>Crossfeed is currently in private beta</h2>
      {(process.env.NODE_ENV === 'development' ||
        (user && user.userType === 'globalAdmin')) && (
        <>
          <h1>[DEVELOPMENT, FOR GLOBAL ADMINS ONLY] Finish Creating Account</h1>
          <p>
            We need just a few more details from you in order to finish creating
            your account.
          </p>

          <Label htmlFor="firstName">First Name</Label>
          <TextInput
            required
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={onTextChange}
          />
          <Label htmlFor="lastName">Last Name</Label>
          <TextInput
            required
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={onTextChange}
          />
          <Label htmlFor="email">Email</Label>
          <TextInput
            disabled
            id="email"
            name="email"
            type="text"
            value={user ? user.email : ''}
          />
          <Label htmlFor="organization">
            Select an organization to join. Your request will need to be
            approved before joining.
          </Label>
          <Dropdown
            id="organization"
            name="organization"
            onChange={onTextChange}
            value={values.organization}
          >
            {publicOrgs.map((org) => {
              return (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              );
            })}
          </Dropdown>
          <div className="width-full display-flex flex-justify-start">
            {errors.global && <p className="text-error">{errors.global}</p>}
          </div>
          <div className="display-flex flex-justify-start flex-align-center width-full margin-top-3">
            <Button type="submit">Submit</Button>
          </div>
        </>
      )}
    </AuthForm>
  );
};
