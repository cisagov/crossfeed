import React, { useState } from "react";
import { useHistory, Link, useLocation } from "react-router-dom";
import { AuthForm } from "components";
import { Button, TextInput, Label } from "@trussworks/react-uswds";
import { useAuthContext } from "context/AuthContext";

interface FormData {
  username: string;
  password: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

interface LocationState {
  message?: string;
}

export const AuthLogin: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { login } = useAuthContext();
  const [values, setValues] = useState<FormData>({
    username: "",
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

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const { username, password } = values;
    try {
      await login(username, password);
    } catch (e) {
      if (e.code === "PasswordResetRequiredException") {
        history.push("/reset-password", {
          username,
        });
      } else if (e.code === "UserNotConfirmedException") {
        history.push("/register-confirm", {
          username,
        });
      } else {
        console.log(e);
        setErrors({
          global: e.message ?? "Unable to Login.",
        });
      }
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Welcome to Crossfeed</h1>
      {location.state?.message && <p>{location.state.message}</p>}
      {errors.global && <p className="text-error">{errors.global}</p>}
      <Label htmlFor="username">Username</Label>
      <TextInput
        required
        id="username"
        name="username"
        type="text"
        onChange={onChange}
      />
      <Label htmlFor="password">Password</Label>
      <TextInput
        required
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        onChange={onChange}
      />

      <div className="display-flex flex-justify-start flex-align-center width-full margin-top-3">
        <Button type="submit">Login</Button>
        <Link to="/register">Create an account.</Link>
      </div>
    </AuthForm>
  );
};
