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
  email: string;
}

export const AuthRegisterConfirm: React.FC = () => {
  const location = useLocation<LocationState>();
  const { username, email } = location.state ?? {};
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
      const { code } = values;
      await Auth.confirmSignUp(username, code);
      history.push("/", {
        message: "Your account has been created, please login.",
      });
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString(),
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Confirm email address</h1>
      <p>
        Enter the verification code that has been sent to{" "}
        {email ?? "the provided email address"}.
      </p>
      <Label htmlFor="password">Verification Code</Label>
      <TextInput
        required
        id="code"
        name="code"
        type="text"
        onChange={onChange}
      />
      <div className="width-full display-flex flex-justify-start">
        {errors.global && <p className="text-error">{errors.global}</p>}
      </div>
      <div className="display-flex flex-justify-start flex-align-center width-full margin-top-3">
        <Button type="submit">Confirm</Button>
      </div>
    </AuthForm>
  );
};
