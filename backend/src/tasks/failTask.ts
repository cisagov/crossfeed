import { Handler } from 'aws-lambda';
import { connectToDatabase, ScanTask } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  console.log(event);
  if (event.id) {
    const scanTask = await ScanTask.findOne(event.id);
    if (scanTask) {
      scanTask.status = 'failed';
      scanTask.output = 'Manually stopped at ' + new Date();
      await ScanTask.save(scanTask);
    }
  }
};
