import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization } from '../models';
import { Lambda, Credentials } from 'aws-sdk';
import ECSClient from './ecs-client';
import { SCAN_SCHEMA } from '../api/scans';

export const handler: Handler = async (event) => {
  let args = {};
  if (process.env.IS_OFFLINE || process.env.IS_LOCAL) {
    args = {
      apiVersion: '2015-03-31',
      endpoint: 'http://backend:3002',
      credentials: new Credentials({ accessKeyId: '', secretAccessKey: '' })
    };
  }

  const lambda = new Lambda(args);

  const ecsClient = new ECSClient();

  await connectToDatabase();

  const scans = await Scan.find();
  const organizations = await Organization.find();
  for (const organization of organizations) {
    for (const scan of scans) {
      if (
        !scan.lastRun ||
        scan.lastRun.getTime() < new Date().getTime() - 1000 * scan.frequency
      ) {
        const { type } = SCAN_SCHEMA[scan.name];
        try {
          if (type === 'fargate') {
            const result = await ecsClient.runCommand({
              organizationId: organization.id,
              organizationName: organization.name,
              scanId: scan.id,
              scanName: scan.name
            });
            if (result.tasks!.length === 0) {
              console.error(result.failures);
              throw new Error(
                `Failed to start fargate task for scan ${scan.name} -- got ${
                  result.failures!.length
                } failures.`
              );
            }
            console.log(result.tasks);
            console.log(`Successfully invoked ${scan.name} scan with fargate.`);
          } else if (type === 'lambda') {
            // Asynchronously invoke the function
            await lambda
              .invoke({
                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!.replace(
                  'scheduler',
                  scan.name
                ),
                Payload: JSON.stringify(scan.arguments),
                InvocationType: 'Event'
              })
              .promise();
            console.log(`Successfully invoked ${scan.name} scan with lambda.`);
          } else {
            throw new Error('Invalid type ' + type);
          }
          scan.lastRun = new Date();
          scan.save();
        } catch (error) {
          console.error(`Error invoking ${scan.name} scan.`);
          console.error(error);
        }
      }
    }
  }
};
