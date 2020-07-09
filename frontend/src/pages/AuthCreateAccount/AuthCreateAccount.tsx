import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button, TextInput, Label } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { User } from 'types';

interface FormData {
  firstName: string;
  lastName: string;
  organization: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthCreateAccount: React.FC = () => {
  const history = useHistory();
  const [values, setValues] = useState<FormData>({
    firstName: '',
    lastName: '',
    organization: ''
  });
  const [errors, setErrors] = useState<Errors>({});
  const { user, login, apiPut } = useAuthContext();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    e.persist();
    setValues(values => ({
      ...values,
      [e.target.name]: e.target.value
    }));
  };

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      if (!user) throw Error('Unable to register');
      const updated: User = await apiPut(`/users/${user.id}`, {
        body: values
      });

      login(localStorage.getItem('token')!, updated);
      history.push('/', {
        message: 'Your account has been successfully created.'
      });
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Finish Creating Account</h1>
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
        onChange={onChange}
      />
      <Label htmlFor="lastName">Last Name</Label>
      <TextInput
        required
        id="lastName"
        name="lastName"
        type="text"
        value={values.lastName}
        onChange={onChange}
      />
      <Label htmlFor="email">Email</Label>
      <TextInput
        disabled
        id="email"
        name="email"
        type="text"
        value={user ? user.email : ''}
      />
      <Label htmlFor="organization">Organization</Label>
      <TextInput
        id="organization"
        name="organization"
        type="text"
        value={values.organization}
        onChange={onChange}
      />
      <div className="width-full display-flex flex-justify-start">
        {errors.global && <p className="text-error">{errors.global}</p>}
      </div>
      <div className="display-flex flex-justify-start flex-align-center width-full margin-top-3">
        <Button type="submit">Submit</Button>
      </div>
    </AuthForm>
  );
};
