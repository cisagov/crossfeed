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
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as util from 'util';

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

export const sendUserNotificationEmail = async (
  recepient: string,
  p_subject: string,
  p_firstName: string,
  p_lastname: string,
  template_file: string
) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  const fs = require('fs').promises;
  const html = await fs.readFile(template_file, 'utf8');
  const template = handlebars.compile(html);
  const data = {
    first_name: p_firstName,
    last_name: p_lastname
  };

  const htmlToSend = template(data);

  const mailOptions = {
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER,
    to: recepient,
    subject: p_subject,
    html: htmlToSend,
    attachments: [
      {
        filename: 'banner.png',
        path: '/app/src/email_templates/banner.png',
        cid: 'CISA Banner'
      },
      {
        filename: 'web.png',
        path: '/app/src/email_templates/banner.png',
        cid: 'CISA Web'
      },
      {
        filename: 'email.png',
        path: '/app/src/email_templates/email.png',
        cid: 'CISA Email'
      },
      {
        filename: 'linkedin.png',
        path: '/app/src/email_templates/linkedin.png',
        cid: 'CISA LinkedIn'
      },
      {
        filename: 'twitter.png',
        path: '/app/src/email_templates/twitter.png',
        cid: 'CISA Twitter'
      },
      {
        filename: 'facebook.png',
        path: '/app/src/email_templates/facebooK.png',
        cid: 'CISA Facebook'
      },
      {
        filename: 'instagram.png',
        path: '/app/src/email_templates/instagram.png',
        cid: 'CISA Instagram'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

export const sendRegionalAdminNotificationEmail = async (
  recepient: string,
  p_subject: string,
  p_firstName: string,
  p_lastname: string,
  p_username: string
) => {
  const transporter = nodemailer.createTransport({
    SES: new SES({ region: 'us-east-1' })
  });

  const fs = require('fs').promises;
  const html = await fs.readFile(
    '/app/src/email_templates/crossfeed_regional_admin_notification.html',
    'utf8'
  );
  const template = handlebars.compile(html);
  const data = {
    first_name: p_firstName,
    last_name: p_lastname
  };

  const htmlToSend = template(data);

  const mailOptions = {
    from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER,
    to: recepient,
    subject: p_subject,
    html: htmlToSend,
    attachments: [
      {
        filename: 'banner.png',
        path: '/app/src/email_templates/banner.png',
        cid: 'CISA Banner'
      },
      {
        filename: 'web.png',
        path: '/app/src/email_templates/banner.png',
        cid: 'CISA Web'
      },
      {
        filename: 'email.png',
        path: '/app/src/email_templates/email.png',
        cid: 'CISA Email'
      },
      {
        filename: 'linkedin.png',
        path: '/app/src/email_templates/linkedin.png',
        cid: 'CISA LinkedIn'
      },
      {
        filename: 'twitter.png',
        path: '/app/src/email_templates/twitter.png',
        cid: 'CISA Twitter'
      },
      {
        filename: 'facebook.png',
        path: '/app/src/email_templates/facebooK.png',
        cid: 'CISA Facebook'
      },
      {
        filename: 'instagram.png',
        path: '/app/src/email_templates/instagram.png',
        cid: 'CISA Instagram'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};
