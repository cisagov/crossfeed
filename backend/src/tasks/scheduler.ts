import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan } from '../models';
import { Lambda, Credentials } from 'aws-sdk';
import ECSClient from './ecs-client';

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

  let ecsClient = new ECSClient();
  const result = await ecsClient.runCommand({
    organizationId: "organizationId",
    organizationName: "organizationName",
    scanId: "scanId",
    scanName: "scanName"
  });
  console.error(result.tasks);
  return;

  // await connectToDatabase();

  // const scans = await Scan.find();
  // for (const scan of scans) {
  //   if (
  //     !scan.lastRun ||
  //     scan.lastRun.getTime() < new Date().getTime() - 1000 * scan.frequency
  //   ) {
  //     try {
  //       // Asynchronously invoke the function
  //       await lambda
  //         .invoke({
  //           FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!.replace(
  //             'scheduler',
  //             scan.name
  //           ),
  //           Payload: JSON.stringify(scan.arguments),
  //           InvocationType: 'Event'
  //         })
  //         .promise();
  //       console.log(`Successfully invoked ${scan.name} scan.`);
  //       scan.lastRun = new Date();
  //       scan.save();
  //     } catch (error) {
  //       console.log(`Error invoking ${scan.name} scan:`);
  //       console.error(error);
  //     }
  //   }
  // }
};
