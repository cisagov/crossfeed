import { handler as scanExecution, startFargateTask } from '../scanExecution';
import { SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';

describe('Scan Execution', () => {
  beforeEach(() => {
    // Mock the sendMessage method manually
    const mockSendMessage = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });

    AWS.SQS.prototype.sendMessage = mockSendMessage;
  });

  process.env.FARGATE_CLUSTER_NAME = 'FARGATE_CLUSTER_NAME';
  process.env.SHODAN_QUEUE_URL = 'SHODAN_QUEUE_URL';
  process.env.SHODAN_SERVICE_NAME = 'SHODAN_SERVICE_NAME';

  // Create a wrapper function for startFargateTask
  let startFargateTaskWrapper = async (clusterName: string, serviceName: string, desiredCountNum: number) => {
    return startFargateTask(clusterName, serviceName, desiredCountNum);
  };

  // Mock the startFargateTaskWrapper function
  const mockStartFargateTaskWrapper = jest.fn().mockResolvedValue(undefined);

  it('scanExecution should run successfully', async () => {
    // Set the mock for startFargateTaskWrapper
    startFargateTaskWrapper = mockStartFargateTaskWrapper;

    const event = {
      Records: [
        {
          body: JSON.stringify({ scriptType: 'shodan' }),
          eventSourceARN: 'SQSQueueARN'
        } as SQSRecord
      ]
    };

    const result = await scanExecution(event, {} as any, () => void 0);

    expect(result.statusCode).toEqual(200);
    expect(result.body).toContain('Fargate task started and message sent to SQS queue');

    // Assert that startFargateTaskWrapper was called with the expected arguments (if needed)
    expect(mockStartFargateTaskWrapper).toHaveBeenCalledWith('FARGATE_CLUSTER_NAME', 'SHODAN_SERVICE_NAME', 5);
  });
});
