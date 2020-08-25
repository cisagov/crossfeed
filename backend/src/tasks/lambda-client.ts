import { Lambda } from 'aws-sdk';
import { handler as scheduler } from './scheduler';

/**
 * Lambda Client used to invoke lambda functions.
 */
class LambdaClient {
  lambda: Lambda;
  isLocal: boolean;

  constructor() {
    this.isLocal =
      process.env.IS_OFFLINE || process.env.IS_LOCAL ? true : false;
    if (!this.isLocal) {
      this.lambda = new Lambda();
    }
  }

  /**
   * Invokes a lambda function with the given name.
   */
  async runCommand({
    name
  }: {
    name: string;
  }): Promise<Lambda.InvocationResponse> {
    console.log('Invoking lambda function ', name);
    if (this.isLocal) {
      scheduler({}, {} as any, () => null);
      return { StatusCode: 202, Payload: '' };
    } else {
      // Invoke lambda asynchronously
      return this.lambda
        .invoke({
          FunctionName: name,
          InvocationType: 'Event',
          Payload: ''
        })
        .promise();
    }
  }
}

export default LambdaClient;
