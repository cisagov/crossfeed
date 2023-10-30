import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsRequest,
  ListTagsForResourceCommand,
  LogGroup,
  CreateExportTaskCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand
} from '@aws-sdk/client-ssm';

const logs = new CloudWatchLogsClient({});
const ssm = new SSMClient({});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async () => {
  const args: DescribeLogGroupsRequest = {};
  let logGroups: LogGroup[] = [];
  const logBucketName = process.env.CLOUDWATCH_BUCKET_NAME;
  const stage = process.env.STAGE;

  console.log(`logBucketName=${logBucketName}, stage=${stage}`);

  if (!logBucketName || !stage) {
    console.error(`Error: logBucketName or stage not defined`);
    return;
  }

  while (true) {
    const describeLogGroupsResponse = await logs.send(
      new DescribeLogGroupsCommand(args)
    );
    logGroups = logGroups.concat(describeLogGroupsResponse.logGroups!);
    if (!describeLogGroupsResponse.nextToken) {
      break;
    }
    args.nextToken = describeLogGroupsResponse.nextToken;
  }

  for (const logGroup of logGroups) {
    console.log(`logGroup: ${JSON.stringify(logGroup)}`);
    const listTagsResponse = await logs.send(
      new ListTagsForResourceCommand({
        resourceArn: logGroup.arn!.replace(/:\*$/g, '') // .replace() removes the trailing :*
      })
    );
    console.log(`listTagsResponse: ${JSON.stringify(listTagsResponse)}`);
    const logGroupTags = listTagsResponse.tags || {};
    if (logGroupTags.Stage !== stage) {
      console.log(
        `Skipping log group: ${logGroup.logGroupName} (no ${stage} tag)`
      );
      continue;
    }
    const logGroupName = logGroup.logGroupName!;
    console.log(`Processing log group: ${logGroupName}`);
    const ssmParameterName =
      `/logs/${stage}/last-export-to-s3/${logGroupName}`.replace('//', '/');
    let ssmValue = '0';

    try {
      const ssmResponse = await ssm.send(
        new GetParameterCommand({ Name: ssmParameterName })
      );
      console.log(`ssmResponse: ${JSON.stringify(ssmResponse)}`);
      ssmValue = ssmResponse.Parameter?.Value || '0';
    } catch (error) {
      if (error.name !== 'ParameterNotFound') {
        console.error(`Error fetching SSM parameter: ${JSON.stringify(error)}`);
      }
      console.error(`ssm.send error: ${JSON.stringify(error)}`);
    }

    const exportTime = Math.round(Date.now());

    console.log(`--> Exporting ${logGroupName} to ${logBucketName}`);

    if (exportTime - parseInt(ssmValue) < 24 * 60 * 60 * 1000) {
      console.log(
        'Skipped: log group was already exported in the last 24 hours'
      );
      continue;
    }

    try {
      const exportTaskResponse = await logs.send(
        new CreateExportTaskCommand({
          logGroupName: logGroupName,
          from: parseInt(ssmValue),
          to: exportTime,
          destination: logBucketName,
          destinationPrefix: logGroupName.replace(/^\/|\/$/g, '')
        })
      );
      console.log(`exportTaskResponse: ${JSON.stringify(exportTaskResponse)}`);
      console.log(`Task created: ${exportTaskResponse.taskId}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (error.name === 'LimitExceededException') {
        console.log(JSON.stringify(error));
        return;
      }
      console.error(
        `Error exporting ${logGroupName}: ${JSON.stringify(error)}`
      );
      continue;
    }

    await ssm.send(
      new PutParameterCommand({
        Name: ssmParameterName,
        Type: 'String',
        Value: exportTime.toString(),
        Overwrite: true
      })
    );
    console.log(`SSM parameter updated: ${ssmParameterName}`);
  }
  // TODO: reevaluate the delay time after the first set of exports
  await delay(30 * 1000); // mitigates LimitExceededException (AWS allows only one export task at a time)
};
