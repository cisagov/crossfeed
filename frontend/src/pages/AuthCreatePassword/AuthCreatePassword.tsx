import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { AuthForm } from "components";
import { Button, TextInput, Label } from "@trussworks/react-uswds";
import { useAuthContext } from "context";

interface FormData {
  password: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

interface LocationState {
  user: any;
}

export const AuthCreatePassword: React.FC = () => {
  const { completePassword } = useAuthContext();
  const history = useHistory();
  const [values, setValues] = useState<FormData>({
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    e.persist();
    setValues((values) => ({
      ...values,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (!completePassword) {
      history.push("/");
    }
  }, [completePassword, history]);

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const { password } = values;
      completePassword && (await completePassword(password));
      history.push("/");
    } catch (e) {
      console.error(e);
      setErrors({
        global: e.toString(),
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Choose a Password</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
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
