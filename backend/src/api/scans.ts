import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject
} from 'class-validator';
import { Scan, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';

const SCAN_SCHEMA = {
  censys: {},
  amass: {}
};

class NewScan {
  @IsString()
  @IsIn(Object.keys(SCAN_SCHEMA))
  name: string = 'name';

  @IsObject()
  arguments: Object = {};

  @IsInt()
  @IsPositive()
  frequency: number = 1;
}

export const del = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.scanId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const result = await Scan.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const update = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.scanId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewScan, event.body);
  const scan = await Scan.findOne({
    id: id
  });
  if (scan) {
    Scan.merge(scan, body);
    const res = await Scan.save(scan);
    return {
      statusCode: 200,
      body: JSON.stringify(res)
    };
  }
  return NotFound;
});

export const create = wrapHandler(async (event) => {
  await connectToDatabase();
  const body = await validateBody(NewScan, event.body);
  const scan = await Scan.create(body);
  const res = await Scan.save(scan);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await Scan.find();
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
