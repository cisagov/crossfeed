import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsRequest,
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

  if (!logBucketName) {
    console.error('Error: logBucketName not defined');
    return;
  }

  console.log('--> logBucketName=' + logBucketName);

  while (true) {
    const response = await logs.send(new DescribeLogGroupsCommand(args));
    console.log(`response: ${JSON.stringify(response)}`);
    logGroups = logGroups.concat(response.logGroups!);
    console.log(`logGroups: ${JSON.stringify(logGroups)}`);
    if (!response.nextToken) {
      break;
    }
    args.nextToken = response.nextToken;
  }

  for (const logGroup of logGroups) {
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
      ssmValue = ssmResponse.Parameter?.Value || '0';
    } catch (error) {
      if (error.name !== 'ParameterNotFound') {
        console.error('Error fetching SSM parameter: ' + error.message);
      }
      console.error(`error: ${error.message}`);
    }

    const exportTime = Math.round(Date.now());

    console.log('--> Exporting ' + logGroupName + ' to ' + logBucketName);

    if (exportTime - parseInt(ssmValue) < 24 * 60 * 60 * 1000) {
      console.log('Skipped until 24hrs from last export');
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

      console.log('    Task created: ' + response.taskId);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (error.name === 'LimitExceededException') {
        console.log(error.message);
        return;
      }
      console.error(
        'Error exporting ' +
          logGroupName +
          ': ' +
          (error.message || JSON.stringify(error))
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
  }
  await delay(10 * 1000); // prevents LimitExceededException (AWS allows only one export task at a time)
};
