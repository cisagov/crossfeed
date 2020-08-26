import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsBoolean,
  IsUUID
} from 'class-validator';
import { Scan, connectToDatabase, Organization } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { isGlobalWriteAdmin } from './auth';
import LambdaClient from '../tasks/lambda-client';

interface ScanSchema {
  [name: string]: {
    // Scan type. Only Fargate is supported.
    type: 'fargate';

    description: string;

    // Whether scan is passive (not allowed to hit the domain).
    isPassive: boolean;

    // Whether scan is global. Global scans run once for all organizations, as opposed
    // to non-global scans, which are run for each organization.
    global: boolean;

    // CPU and memory for the scan. See this page for more information:
    // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
    cpu?: string;
    memory?: string;

    // A scan is "chunked" if its work is divided and run in parallel by multiple workers.
    // To make a scan chunked, make sure it is a global scan and specify the "numChunks" variable,
    // which corresponds to the number of workers that will be created to run the task.
    // Chunked scans can only be run on scans whose implementation takes into account the
    // chunkNumber and numChunks parameters specified in commandOptions.
    numChunks?: number;
  };
}

export const SCAN_SCHEMA: ScanSchema = {
  censys: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description: 'Passive discovery of subdomains from public certificates'
  },
  amass: {
    type: 'fargate',
    isPassive: false,
    global: false,
    description:
      'Open source tool that integrates passive APIs and active subdomain enumeration in order to discover target subdomains'
  },
  findomain: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description:
      'Open source tool that integrates passive APIs in order to discover target subdomains'
  },
  portscanner: {
    type: 'fargate',
    isPassive: false,
    global: false,
    description: 'Active port scan of common ports'
  },
  wappalyzer: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description:
      'Open source tool that fingerprints web technologies based on HTTP responses'
  },
  censysIpv4: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '1024',
    memory: '4096',
    numChunks: 20,
    description: 'Fetch passive port and banner data from censys ipv4 dataset'
  },
  cve: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '1024',
    memory: '4096',
    description: 'Matches detected software versions to CVEs from NIST NVD'
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

  @IsBoolean()
  isGranular: boolean;

  @IsUUID('all', { each: true })
  organizations: string[];
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
    Scan.merge(scan, {
      ...body,
      organizations: body.organizations.map((id) => ({ id }))
    });
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
  const scan = await Scan.create({
    ...body,
    organizations: body.organizations.map((id) => ({ id })),
    createdBy: { id: event.requestContext.authorizer!.id }
  });
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
  const organizations = await Organization.find();
  return {
    statusCode: 200,
    body: JSON.stringify({
      scans: result,
      schema: SCAN_SCHEMA,
      organizations: organizations.map((e) => ({
        name: e.name,
        id: e.id
      }))
    })
  };
});

export const listGranular = wrapHandler(async (event) => {
  await connectToDatabase();
  const scans = await Scan.find({
    select: ['id', 'name', 'isGranular'],
    where: {
      isGranular: true
    }
  });
  return {
    statusCode: 200,
    body: JSON.stringify({
      scans,
      schema: SCAN_SCHEMA
    })
  };
});

export const invokeScheduler = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  const lambdaClient = new LambdaClient();
  const response = await lambdaClient.runCommand({
    name: `${process.env.SLS_LAMBDA_PREFIX!}-scheduler`
  });
  console.log(response);
  if (response.StatusCode !== 202) {
    return {
      statusCode: 500,
      body: 'Invocation failed.'
    };
  }
  return {
    statusCode: 200,
    body: ''
  };
});
