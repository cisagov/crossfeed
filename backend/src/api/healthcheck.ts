import { wrapHandler } from './helpers';

export const handler = wrapHandler(async () => {
  return {
    statusCode: 200,
    body: ''
  };
});
