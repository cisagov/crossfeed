import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject
} from 'class-validator';
import { Scan, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { isGlobalWriteAdmin } from './auth';

interface ScanSchema {
  [name: string]: {
    // Scan type
    type: 'lambda' | 'fargate';
    isPassive: boolean;
  };
}

export const SCAN_SCHEMA: ScanSchema = {
  censys: {
    type: 'fargate',
    isPassive: true
  },
  amass: {
    type: 'fargate',
    isPassive: false
  },
  findomain: {
    type: 'fargate',
    isPassive: true
  },
  portscanner: {
    type: 'fargate',
    isPassive: false
  },
  wappalyzer: {
    type: 'fargate',
    isPassive: false
  }
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
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
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
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
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
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
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
  // if (!isGlobalWriteAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const result = await Scan.find();
  return {
    statusCode: 200,
    body: JSON.stringify({
      scans: result,
      schema: SCAN_SCHEMA
    })
  };
});
