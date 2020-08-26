import { CommandOptions } from '../ecs-client';

export const runCommand = jest.fn(async (commandOptions: CommandOptions) => {
  return {
    tasks: [
      {
        taskArn: 'mock_task_arn'
      }
    ]
  };
});

export const getNumTasks = jest.fn(() => 0);

export default jest.fn(() => ({
  runCommand,
  getNumTasks
}));
