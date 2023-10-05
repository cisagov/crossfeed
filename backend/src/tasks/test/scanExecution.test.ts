import { handler } from '../scanExecution';
import { SQSRecord } from 'aws-lambda';

// Mock the AWS SDK methods using aws-sdk-mock
jest.mock('aws-sdk', () => {
  return {
    ECS: jest.fn(() => ({
      runTask: jest.fn().mockReturnThis(),
      promise: jest.fn()
    })),
    SQS: jest.fn(() => ({
      sendMessage: jest.fn().mockReturnThis(),
      promise: jest.fn()
    }))
  };
});

describe('Scan Execution', () => {
  it('should handle the event', async () => {
    const event = {
      Records: [
        {
          body: 'test command',
          eventSourceARN: 'YourSQSQueueARN'
        } as SQSRecord
      ]
    };

    const context = {} as any;
    const callback = () => void 0;
    const result = await handler(event, context, callback);

    // Add your assertions here
    expect(result.statusCode).toEqual(200);
    expect(result.body).toContain(
      'Fargate task started and message sent to SQS queue'
    );
  });
});
