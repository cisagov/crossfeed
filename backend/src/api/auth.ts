import { CognitoUserPoolTriggerHandler } from "aws-lambda";
import axios from "axios";

const ALLOWED_EMAIL_DOMAINS = ["gov", "mil"];

export const preSignUp: CognitoUserPoolTriggerHandler = async (event) => {
  const email = event.request.userAttributes.email;
  console.log("registration attempt: ", email);

  // verify recaptcha
  try {
    const recaptchaToken = event.request.clientMetadata?.recaptchaToken;
    const res = await axios({
      url: "https://www.google.com/recaptcha/api/siteverify",
      method: "POST",
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
      },
    });
    if (!res.data.success || res.data.action !== "register") {
      throw new Error();
    }
    console.log("recaptcha verified.");
  } catch (e) {
    throw new Error("Recaptcha verification failed");
  }

  // verify valid TLD
  const tld = email.split(".").pop();
  if (!(tld && ALLOWED_EMAIL_DOMAINS.includes(tld))) {
    throw new Error("Invalid email address provided");
  }

  return event;
};
