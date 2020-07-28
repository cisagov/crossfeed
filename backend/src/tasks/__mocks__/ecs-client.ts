import { CommandOptions } from '../ecs-client';

export const runCommand = jest.fn(async (commandOptions: CommandOptions) => {
  return { tasks: [{}] };
});

export default jest.fn(() => ({
  runCommand
}));
