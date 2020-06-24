import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { AuthForm } from "components";
import { Button, TextInput, Label } from "@trussworks/react-uswds";
import { Auth } from "aws-amplify";
import { useRecaptcha } from "hooks";

interface FormData {
  username: string;
  password: string;
  email: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthRegister: React.FC = () => {
  const history = useHistory();
  const { getToken } = useRecaptcha();
  const [values, setValues] = useState<FormData>({
    username: "",
    password: "",
    email: "",
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
    const recaptchaToken = await getToken("register");
    const { username, email, password } = values;
    try {
      await Auth.signUp({
        username,
        password,
        attributes: {
          email,
        },
        clientMetadata: {
          recaptchaToken,
        },
      });
      history.push("/register-confirm", {
        username,
        email,
      });
    } catch (e) {
      let error = "Failed to Register.";
      if (e.code === "InvalidLambdaResponseException") {
        if (e.message?.includes("recaptcha")) {
          error = "Recaptcha verification failed.";
        } else {
          error = "Email address must be a .gov or .mil domain";
        }
      } else if (e.code === "InvalidParameterException") {
        error = "Password does not meet the minimum requirements.";
      } else {
        console.log(e);
      }
      setErrors({
        global: error,
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Welcome to Crossfeed</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
      <Label htmlFor="username">Username</Label>
      <TextInput
        required
        id="username"
        name="username"
        type="text"
        onChange={onChange}
      />
      <Label htmlFor="email">Email (must be .mil or .gov)</Label>
      <TextInput
        required
        id="email"
        name="email"
        type="email"
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
        <Button type="submit">Register</Button>
        <Link to="/">Already have an account? Login.</Link>
      </div>
    </AuthForm>
  );
};
