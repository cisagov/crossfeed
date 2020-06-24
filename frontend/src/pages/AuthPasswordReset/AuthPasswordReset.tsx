import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { AuthForm } from "components";
import { Button, TextInput, Label } from "@trussworks/react-uswds";
import { Auth } from "aws-amplify";

interface FormData {
  code: string;
  password: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

interface LocationState {
  username: string;
}

export const AuthPasswordReset: React.FC = () => {
  const location = useLocation<LocationState>();
  const { username } = location.state;
  const history = useHistory();
  const [values, setValues] = useState<FormData>({
    code: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!username) {
      history.push("/");
    }
  }, [history, username]);

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    e.persist();
    setValues((values) => ({
      ...values,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const { code, password } = values;
      await Auth.forgotPasswordSubmit(username, code, password);
      history.push("/");
    } catch (e) {
      console.log(e);
      setErrors({
        global: e.toString(),
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Password Change Required</h1>
      {errors.global && <p>{errors.global}</p>}
      <Label htmlFor="password">Verification Code</Label>
      <TextInput
        required
        id="code"
        name="code"
        type="text"
        autoComplete="current-password"
        onChange={onChange}
      />
      <Label htmlFor="password">New Password</Label>
      <TextInput
        required
        id="password"
        name="password"
        type="password"
        onChange={onChange}
      />

      <div className="display-flex flex-justify-start flex-align-center width-full margin-top-3">
        <Button type="submit">Login</Button>
      </div>
    </AuthForm>
  );
};
