import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler
} from 'aws-lambda';
import { ValidationOptions, validateOrReject } from 'class-validator';
import { ClassType } from 'class-transformer/ClassTransformer';
import { plainToClass } from 'class-transformer';
import { SES } from 'aws-sdk';
import * as nodemailer from 'nodemailer';
import { readFile }from 'fs'
import { compile } from 'handlebars';
import { promisify } from 'util';

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
  body: "Item not found. View logs for details."
};

export const Unauthorized: APIGatewayProxyResult = {
  statusCode: 403,
  body: "Unauthorized access. View logs for details."
};

export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string,
  html: string
) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  await transporter.sendMail({
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
    to: recipient,
    subject: subject,
    text: body,
    html: html
    replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
  });
};

export const sendNotificationEmail = async (
  recepient: string,
  subject: string,
  p_email: string,
  p_firstName: string,
  p_lastname: string,
) => {

    const transporter = nodemailer.createTransport({
      SES: new SES({ region: 'us-east-1' })
    });
    const readFile = promisify(fs.readFile);

    html = await readFile('../../email_templates/template.html', 'utf8');
    template = handlebars.compile(html);
    data = {
      email: p_email,
      firstName: p_firstName,
      lastName: p_lastname
    }

    htmlToSend = template(data);

    mailOptions = {
      from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER,
      to: recepient,
      subject: subject,
      html: htmlToSend,
      attachments: [{
        filename: '../../email_templates/img/example.png',
        path: __dirname + 'example.png',
        cid: 'example'
      }]
    };

    nodemailer.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
    })
};

