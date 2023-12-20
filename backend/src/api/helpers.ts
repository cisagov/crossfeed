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
import logger from '../tools/lambda-logger';

const AWS = require('aws-sdk');
const httpProxy = require('https-proxy-agent');

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
        logger.info(`=> ${resp.statusCode} ${event.path} `);
      }
      return resp;
    } catch (e) {
      logger.error(e);
      return makeResponse(event, {
        statusCode: Array.isArray(e) ? 400 : 500
      });
    }
  };

export const NotFound: APIGatewayProxyResult = {
  statusCode: 404,
  body: ''
};

export const Unauthorized: APIGatewayProxyResult = {
  statusCode: 403,
  body: ''
};

export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string
) => {
  try {
    process.env.HTTPS_PROXY = 'http://proxy.lz.us-cert.gov:8080';
    process.env.HTTP_PROXY = 'http://proxy.lz.us-cert.gov:8080';
    const proxyAgent = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    AWS.config.update({
      httpOptions: {
        agent: proxyAgent ? httpProxy(proxyAgent) : undefined
      }
    });
    const transporter = nodemailer.createTransport({
      SES: new SES({
        region: 'us-gov-west-1',
        endpoint: 'https://email.us-gov-west-1.amazonaws.com'
      })
    });

    await transporter.sendMail({
      from: process.env.CROSSFEED_SUPPORT_EMAIL_SENDER!,
      to: recipient,
      subject: subject,
      text: body,
      replyTo: process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO!
    });

    logger.info('Email sent successfully');
    return 'Email sent successfully';
  } catch (error) {
    logger.error(`Error sending email: ${error}`);

    // Handle the error or re-throw it if needed
    throw error;
  }
};
