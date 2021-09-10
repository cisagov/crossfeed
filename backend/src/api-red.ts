// Main entrypoint for red.
// Essentially, this entrypoint mimics API Gateway by passing down all requests
// to the crossfeed prod api lambda function.
import * as express from 'express';
import * as cors from 'cors';
import { Lambda } from 'aws-sdk';

// Name of the lambda function name.
const API_LAMBDA_FUNCTION_NAME = 'crossfeed-prod-api';
const AWS_REGION = 'us-east-1';

interface LambdaResponse {
  "isBase64Encoded": boolean,
  "statusCode": number,
  "headers": {[x: string]: string},
  "multiValueHeaders": {[x: string]: string[]},
  "body": string
}

const app = express();
app.use(cors());

app.use(async (req, res) => {
  // See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
  // for input / output formats for API gateway lambda integration.
  const input = {
    "resource": req.path,
    "path": req.path,
    "httpMethod": req.method,
    "headers": req.headers,
    "multiValueHeaders": {
    },
    "queryStringParameters": req.query,
    "multiValueQueryStringParameters": {
    },
    "requestContext": {
    },
    "pathParameters": null,
    "stageVariables": null,
    "body": req.body,
    "isBase64Encoded": false
  };
  const lambdaClient = new Lambda({
    region: AWS_REGION
  });
  const response = await lambdaClient.invoke({
    FunctionName: API_LAMBDA_FUNCTION_NAME,
    InvocationType: 'Event',
    Payload: JSON.stringify(input)
  })
  .promise();
  console.log("input", input, "response", response);
  const lambdaResponse: LambdaResponse = JSON.parse(response.Payload!.toString());
  res.status(lambdaResponse.statusCode);
  for (const k in lambdaResponse.headers) {
    res.header(k, lambdaResponse.headers[k]);
  }
  res.send(lambdaResponse.body);
});


const port = 3000;
app.listen(port, () => {
  console.log('App listening on port ' + port);
});