import { handler as scanExecution } from '../scanExecution';
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

  process.env.SQS_QUEUE_URL = 'YOUR_SQS_QUEUE_URL';

  it('scanExecution should run successfully', async () => {
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
  });
});
