import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization, ScanTask } from '../models';
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
  for (const scan of scans) {
    for (const organization of organizations) {
      const { type, isPassive } = SCAN_SCHEMA[scan.name];
      // Don't run non-passive scans on passive organizations.
      if (organization.isPassive && !isPassive) {
        continue;
      }
      const lastRunScanTask = await ScanTask.findOne(
        {
          organization: { id: organization.id },
          scan: { id: scan.id },
          status: 'finished'
        },
        {
          order: {
            finishedAt: 'DESC'
          }
        }
      );
      if (
        lastRunScanTask &&
        lastRunScanTask.finishedAt &&
        lastRunScanTask.finishedAt.getTime() >=
          new Date().getTime() - 1000 * scan.frequency
      ) {
        continue;
      }
      const scanTask = await ScanTask.save(
        ScanTask.create({
          organization,
          scan,
          type,
          status: 'created'
        })
      );
      try {
        const commandOptions = {
          organizationId: organization.id,
          organizationName: organization.name,
          scanId: scan.id,
          scanName: scan.name,
          scanTaskId: scanTask.id
        };
        if (type === 'fargate') {
          const result = await ecsClient.runCommand(commandOptions);
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
              Payload: JSON.stringify(commandOptions),
              InvocationType: 'Event'
            })
            .promise();
          console.log(`Successfully invoked ${scan.name} scan with lambda.`);
        } else {
          throw new Error('Invalid type ' + type);
        }
        scanTask.input = JSON.stringify(commandOptions);
        scanTask.status = 'requested';
        scanTask.requestedAt = new Date();
      } catch (error) {
        console.error(`Error invoking ${scan.name} scan.`);
        console.error(error);
        scanTask.output = JSON.stringify(error);
        scanTask.status = 'failed';
      } finally {
        await scanTask.save();
      }
    }
    scan.lastRun = new Date();
    scan.save();
  }
};
