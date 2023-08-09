import { CommandOptions } from '../ecs-client';

export default async (
  commandOptions: CommandOptions
): Promise<CommandOptions> => {
  const { chunkNumber, numChunks } = commandOptions;
  const sanitizedOptions = commandOptions;
  if (chunkNumber === undefined || numChunks === undefined) {
    throw new Error('Chunks not specified.');
  }

  if (chunkNumber >= 100 || chunkNumber >= numChunks) {
    throw new Error('Invalid chunk number.');
  }
  sanitizedOptions.numChunks = numChunks > 100 ? 100 : numChunks;

  return sanitizedOptions;
};
