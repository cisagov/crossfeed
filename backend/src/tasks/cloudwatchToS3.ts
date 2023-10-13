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

  if (!logBucketName) {
    console.error('Error: logBucketName not defined');
    return;
  }

  console.log('--> logBucketName=' + logBucketName);

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
    const listTagsCommand = new ListTagsForResourceCommand({
      resourceArn: logGroup.arn
    });
    const listTagsResponse = await logs.send(listTagsCommand);
    console.log(`listTagsCommand: ${JSON.stringify(listTagsCommand)}`);
    console.log(`listTagsResponse: ${JSON.stringify(listTagsResponse)}`);
    const logGroupTags = listTagsResponse.tags || {};
    if (logGroupTags.Stage !== stage) {
      console.log(
        `Skipping log group: ${logGroup.logGroupName} (no ${stage} tag)`
      );
      continue;
    }
    const logGroupName = logGroup.logGroupName!;
    console.log('Processing log group: ' + logGroupName);
    const ssmParameterName = `last-export-to-s3/${logGroupName}`.replace(
      '//',
      '/'
    );
    let ssmValue = '0';

    try {
      const ssmCommand = new GetParameterCommand({ Name: ssmParameterName });
      const ssmResponse = await ssm.send(ssmCommand);
      console.log(`ssmCommand: ${JSON.stringify(ssmCommand)}`);
      console.log(`ssmResponse: ${JSON.stringify(ssmResponse)}`);
      ssmValue = ssmResponse.Parameter?.Value || '0';
    } catch (error) {
      if (error.name !== 'ParameterNotFound') {
        console.error('Error fetching SSM parameter: ' + JSON.stringify(error));
      }
      console.error(`ssm.send error: ${JSON.stringify(error)}`);
    }

    const exportTime = Math.round(Date.now());

    console.log('--> Exporting ' + logGroupName + ' to ' + logBucketName);

    if (exportTime - parseInt(ssmValue) < 24 * 60 * 60 * 1000) {
      console.log(
        'Skipped: log group was already exported in the last 24 hours'
      );
      continue;
    }

    try {
      const exportTaskCommand = new CreateExportTaskCommand({
        logGroupName: logGroupName,
        from: parseInt(ssmValue),
        to: exportTime,
        destination: logBucketName,
        destinationPrefix: logGroupName.replace(/^\/|\/$/g, '')
      });
      const exportTaskResponse = await logs.send(exportTaskCommand);
      console.log(`exportTaskCommand: ${JSON.stringify(exportTaskCommand)}`);
      console.log(`exportTaskResponse: ${JSON.stringify(exportTaskResponse)}`);
      console.log('Task created: ' + exportTaskResponse.taskId);
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
    console.log('SSM parameter updated: ' + ssmParameterName);
  }
  await delay(30 * 1000); // mitigates LimitExceededException (AWS allows only one export task at a time)
};
