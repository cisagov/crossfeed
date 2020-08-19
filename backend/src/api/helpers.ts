import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';
import {
  ValidationOptions,
  validateOrReject,
  ValidationError
} from 'class-validator';
import { ClassType } from 'class-transformer/ClassTransformer';
import { plainToClass } from 'class-transformer';
import { SES, AWSError } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';

export const validateBody = async <T>(
  obj: ClassType<T>,
  body: string | null,
  validateOptions?: ValidationOptions
): Promise<T> => {
  const raw: T = plainToClass(obj, JSON.parse(body ?? '{}'));
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

type WrapHandler = (handler: APIGatewayProxyHandler) => APIGatewayProxyHandler;
export const wrapHandler: WrapHandler = (handler) => async (
  event,
  context,
  callback
) => {
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
  const ses = new SES({ region: 'us-east-1' });
  const params: SendEmailRequest = {
    Source:
      process.env.NODE_ENV === 'production'
        ? 'support@crossfeed.cyber.dhs.gov'
        : 'support@staging.crossfeed.cyber.dhs.gov',
    Destination: {
      ToAddresses: [recipient]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: body,
          Charset: 'UTF-8'
        }
      }
    }
  };

  await ses.sendEmail(params).promise();
};
