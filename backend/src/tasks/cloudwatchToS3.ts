import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsRequest,
  LogGroup,
  ListTagsForResourceCommand,
  CreateExportTaskCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand
} from '@aws-sdk/client-ssm';

const logs = new CloudWatchLogsClient({});
const ssm = new SSMClient({});
const region = process.env.AWS_REGION || 'us-east-1';
const accountId = process.env.AWS_ACCOUNT_ID || '957221700844';
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async () => {
  const extra_args: DescribeLogGroupsRequest = {};
  let log_groups: LogGroup[] = [];
  const log_groups_to_export: string[] = [];

  if (!process.env.CLOUDWATCH_BUCKET_NAME) {
    console.error('Error: CLOUDWATCH_BUCKET_NAME not defined');
    return;
  }

  console.log(
    '--> CLOUDWATCH_BUCKET_NAME=' + process.env.CLOUDWATCH_BUCKET_NAME
  );

  while (true) {
    const response = await logs.send(new DescribeLogGroupsCommand(extra_args));
    console.log(`response: ${JSON.stringify(response)}`);
    log_groups = log_groups.concat(response.logGroups!);
    console.log(`log_groups: ${JSON.stringify(log_groups)}`);
    if (!response.nextToken) {
      break;
    }
    extra_args.nextToken = response.nextToken;
  }

  for (const log_group of log_groups) {
    const command = new ListTagsForResourceCommand({
      resourceArn: `arn:aws:logs:${region}:${accountId}:log-group:${log_group.logGroupName}`
    });
    console.log(`Processing log group: ${log_group.logGroupName}`);
    console.log(`command: ${JSON.stringify(command)}`);
    const response = await logs.send(command);
    console.log(`log group response: ${JSON.stringify(response)}`);
    const log_group_tags = response.tags || {};

    if (log_group_tags.ExportToS3 === 'true') {
      log_groups_to_export.push(log_group.logGroupName!);
    }
    console.log(
      `log_groups_to_export: ${JSON.stringify(log_groups_to_export)}`
    );
    await delay(10 * 1000); // prevents LimitExceededException (AWS allows only one export task at a time)
  }

  for (const log_group_name of log_groups_to_export) {
    console.log('Processing log group: ' + log_group_name);
    const ssm_parameter_name = (
      '/log-exporter-last-export/' + log_group_name
    ).replace('//', '/');
    let ssm_value = '0';

    try {
      const ssm_response = await ssm.send(
        new GetParameterCommand({ Name: ssm_parameter_name })
      );
      ssm_value = ssm_response.Parameter?.Value || '0';
    } catch (error) {
      if (error.name !== 'ParameterNotFound') {
        console.error('Error fetching SSM parameter: ' + error.message);
      }
      console.error(`error: ${error.message}`);
    }

    const export_to_time = Math.round(Date.now());

    console.log(
      '--> Exporting ' +
        log_group_name +
        ' to ' +
        process.env.CLOUDWATCH_BUCKET_NAME
    );

    if (export_to_time - parseInt(ssm_value) < 24 * 60 * 60 * 1000) {
      // Haven't been 24hrs from the last export of this log group
      console.log('    Skipped until 24hrs from last export is completed');
      continue;
    }

    try {
      const response = await logs.send(
        new CreateExportTaskCommand({
          logGroupName: log_group_name,
          from: parseInt(ssm_value),
          to: export_to_time,
          destination: process.env.CLOUDWATCH_BUCKET_NAME,
          destinationPrefix: log_group_name
            .replace(/^\//, '')
            .replace(/\/$/, '')
        })
      );

      console.log('    Task created: ' + response.taskId);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (error.name === 'LimitExceededException') {
        console.log(
          '    Need to wait until all tasks are finished (LimitExceededException). Continuing later...'
        );
        return;
      }
      console.error(
        '    Error exporting ' +
          log_group_name +
          ': ' +
          (error.message || JSON.stringify(error))
      );
      continue;
    }

    await ssm.send(
      new PutParameterCommand({
        Name: ssm_parameter_name,
        Type: 'String',
        Value: export_to_time.toString(),
        Overwrite: true
      })
    );
  }
};
