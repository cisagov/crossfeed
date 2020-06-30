import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan } from '../models';
import { Lambda, Credentials } from 'aws-sdk';

export const handler: Handler = async (event) => {
  console.log(process.env);
  let lambda;
  if (process.env.IS_LOCAL) {
    lambda = new Lambda({
      endpoint: 'http://localhost:3002',
      credentials: new Credentials({ accessKeyId: '', secretAccessKey: '' })
    });
  } else {
    lambda = new Lambda();
  }

  await connectToDatabase();

  const scans = await Scan.find();
  for (let scan of scans) {
    if (
      !scan.lastRun ||
      scan.lastRun.getTime() < new Date().getTime() - 1000 * scan.frequency ||
      true
    ) {
      try {
        let res = await lambda
          .invoke({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!.replace(
              'scheduler',
              scan.name
            ),
            Payload: JSON.stringify(scan.arguments)
          })
          .promise();
        console.log(res);
        console.log(`Successfully invoked ${scan.name} scan.`);
        scan.lastRun = new Date();
        scan.save();
      } catch (error) {
        console.log(`Error invoking ${scan.name} scan:`);
        console.error(error);
      }
    }
  }
};
