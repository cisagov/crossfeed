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
    const response = await logs.send(new DescribeLogGroupsCommand(args));
    logGroups = logGroups.concat(response.logGroups!);
    if (!response.nextToken) {
      break;
    }
    args.nextToken = response.nextToken;
  }

  for (const logGroup of logGroups) {
    const command = new ListTagsForResourceCommand({
      resourceArn: logGroup.arn!
    });
    const response = await logs.send(command);
    const logGroupTags = response.tags || {};
    if (!logGroupTags[stage!]) {
      console.log(
        `Skipping log group: ${logGroup.logGroupName} (no ${stage} tag)`
      );
      continue;
    }
    const logGroupName = logGroup.logGroupName!;
    console.log('Processing log group: ' + logGroupName);
    const ssmParameterName = (
      '/log-exporter-last-export/' + logGroupName
    ).replace('//', '/');
    let ssmValue = '0';

    try {
      const ssmResponse = await ssm.send(
        new GetParameterCommand({ Name: ssmParameterName })
      );
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
      const response = await logs.send(
        new CreateExportTaskCommand({
          logGroupName: logGroupName,
          from: parseInt(ssmValue),
          to: exportTime,
          destination: logBucketName,
          destinationPrefix: logGroupName.replace(/^\//, '').replace(/\/$/, '')
        })
      );

      console.log('Task created: ' + response.taskId);
      console.log(`logs.send response: ${JSON.stringify(response)}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (error.name === 'LimitExceededException') {
        console.log(JSON.stringify(error));
        return;
      }
      console.error(
        'Error exporting ' + logGroupName + ': ' + JSON.stringify(error)
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
  await delay(10 * 1000); // prevents LimitExceededException (AWS allows only one export task at a time)
};
