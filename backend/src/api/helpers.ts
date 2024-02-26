import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler
} from 'aws-lambda';
import { ValidationOptions, validateOrReject } from 'class-validator';
import { ClassType } from 'class-transformer/ClassTransformer';
import { plainToClass } from 'class-transformer';
import S3Client from '../tasks/s3-client';
import { SES } from 'aws-sdk';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

export const validateBody = async <T>(
  obj: ClassType<T>,
  body: string | null,
  validateOptions?: ValidationOptions
): Promise<T> => {
  const raw: any = plainToClass(obj, JSON.parse(body ?? '{}'));
  await validateOrReject(raw, {
    ...validateOptions,
    whitelist: true,
    forbidUnknownValues: true
  });
  return raw;
};

export const makeResponse = (
  event: APIGatewayProxyEvent,
  opts: Partial<APIGatewayProxyResult>
): APIGatewayProxyResult => {
  const origin = event.headers?.origin || '*';
  const { body, statusCode = 200, ...rest } = opts;
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': origin
    },
    body: body ?? '',
    ...rest
  };
};

type WrapHandler = (
  handler: Handler<
    APIGatewayProxyEvent & {
      query?: any;
    },
    APIGatewayProxyResult
  >
) => APIGatewayProxyHandler;
export const wrapHandler: WrapHandler =
  (handler) => async (event, context, callback) => {
    try {
      const result = (await handler(
        event,
        context,
        callback
      )) as APIGatewayProxyResult;
      const resp = makeResponse(event, result);
      if (typeof jest === 'undefined') {
        console.log(`=> ${resp.statusCode} ${event.path} `);
      }
      return resp;
    } catch (e) {
      console.error(e);
      return makeResponse(event, {
        statusCode: Array.isArray(e) ? 400 : 500
      });
    }
  };

export const NotFound: APIGatewayProxyResult = {
  statusCode: 404,
  body: 'Item not found. View logs for details.'
};

export const Unauthorized: APIGatewayProxyResult = {
  statusCode: 403,
  body: 'Unauthorized access. View logs for details.'
};

export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string
) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  await transporter.sendMail({
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
    to: recipient,
    subject: subject,
    text: body,
    replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
  });
};

export const sendRegistrationTextEmail = async (recipient: string) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  const mailOptions = {
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
    to: recipient,
    subject: 'Crossfeed Registration Pending',
    text: 'Your registration is pending approval.',
    replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
  };

  await transporter.sendMail(mailOptions, (error, data) => {
    console.log(data);
    if (error) {
      console.log(error);
    }
  });
};

export const sendRegistrationHtmlEmail = async (recipient: string) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  const mailOptions = {
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
    to: recipient,
    subject: 'Crossfeed Registration Pending',
    html: '<p>Your registration is pending approval.</p>',
    replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
  };

  await transporter.sendMail(mailOptions, (error, data) => {
    console.log(data);
    if (error) {
      console.log(error);
    }
  });
};

export const sendUserRegistrationEmail = async (
  recepient: string,
  subject: string,
  firstName: string,
  lastName: string,
  templateFileName: string
) => {
  try {
    const client = new S3Client();
    const htmlTemplate = await client.getEmailAsset(templateFileName);
    const template = handlebars.compile(htmlTemplate);
    const data = {
      firstName: firstName,
      lastName: lastName
    };

    const htmlToSend = template(data);
    const mailOptions = {
      from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
      to: recepient,
      subject: subject,
      html: htmlToSend,
      replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
    };

    const transporter = nodemailer.createTransport({
      SES: new SES({ region: 'us-east-1' })
    });
    await transporter.sendMail(mailOptions);
  } catch (errorMessage) {
    console.log('Email error: ', errorMessage);
  }
};

export const sendRegistrationDeniedEmail = async (
  recepient: string,
  subject: string,
  firstName: string,
  lastName: string,
  templateFileName: string
) => {
  try {
    const client = new S3Client();
    const htmlTemplate = await client.getEmailAsset(templateFileName);
    const template = handlebars.compile(htmlTemplate);
    const data = {
      firstName: firstName,
      lastName: lastName
    };

    const htmlToSend = template(data);
    const mailOptions = {
      from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
      to: recepient,
      subject: subject,
      html: htmlToSend,
      replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
    };

    const transporter = nodemailer.createTransport({
      SES: new SES({ region: 'us-east-1' })
    });
    await transporter.sendMail(mailOptions);
  } catch (errorMessage) {
    console.log('Email error: ', errorMessage);
  }
};

export const sendRegistrationApprovedEmail = async (
  recepient: string,
  subject: string,
  firstName: string,
  lastName: string,
  templateFileName: string
) => {
  try {
    const client = new S3Client();
    const htmlTemplate = await client.getEmailAsset(templateFileName);
    const template = handlebars.compile(htmlTemplate);
    const data = {
      firstName: firstName,
      lastName: lastName
    };

    const htmlToSend = template(data);
    const mailOptions = {
      from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
      to: recepient,
      subject: subject,
      html: htmlToSend,
      replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
    };

    const transporter = nodemailer.createTransport({
      SES: new SES({ region: 'us-east-1' })
    });
    await transporter.sendMail(mailOptions);
  } catch (errorMessage) {
    console.log('Email error: ', errorMessage);
  }
};
