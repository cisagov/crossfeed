import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsBoolean,
  IsUUID,
  IsArray
} from 'class-validator';
import {
  Scan,
  connectToDatabase,
  Organization,
  ScanTask,
  OrganizationTag
} from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { isGlobalWriteAdmin, isGlobalViewAdmin } from './auth';
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
  testProxy: {
    type: 'fargate',
    isPassive: false,
    global: true,
    description: 'Not a real scan, used to test proxy'
  },
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
    cpu: '1024',
    memory: '4096',
    description:
      'Open source tool that fingerprints web technologies based on HTTP responses'
  },
  shodan: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description:
      'Fetch passive port, banner, and vulnerability data from shodan',
    cpu: '1024',
    memory: '8192'
  },
  sslyze: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description: 'SSL certificate inspection'
  },
  censysIpv4: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '2048',
    memory: '6144',
    numChunks: 20,
    description: 'Fetch passive port and banner data from censys ipv4 dataset'
  },
  censysCertificates: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '2048',
    memory: '6144',
    numChunks: 20,
    description: 'Fetch TLS certificate data from censys certificates dataset'
  },
  cve: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '1024',
    memory: '8192',
    description:
      "Matches detected software versions to CVEs from NIST NVD and CISA's Known Exploited Vulnerabilities Catalog."
  },
  dotgov: {
    type: 'fargate',
    isPassive: true,
    global: true,
    description:
      'Create organizations based on root domains from the dotgov registrar dataset. All organizations are created with the "dotgov" tag and have a " (dotgov)" suffix added to their name.'
  },
  searchSync: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '1024',
    memory: '4096',
    description:
      'Syncs records with Elasticsearch so that they appear in search results.'
  },
  intrigueIdent: {
    type: 'fargate',
    isPassive: true,
    global: false,
    cpu: '1024',
    memory: '4096',
    description:
      'Open source tool that fingerprints web technologies based on HTTP responses'
  },
  webscraper: {
    type: 'fargate',
    isPassive: true,
    global: true,
    numChunks: 3,
    cpu: '1024',
    memory: '4096',
    description: 'Scrapes all webpages on a given domain, respecting robots.txt'
  },
  hibp: {
    type: 'fargate',
    isPassive: true,
    global: false,
    cpu: '2048',
    memory: '16384',
    description:
      'Finds emails that have appeared in breaches related to a given domain'
  },
  lookingGlass: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description: 'Finds vulnerabilities and malware from the LookingGlass API'
  },
  dnstwist: {
    type: 'fargate',
    isPassive: true,
    global: false,
    cpu: '2048',
    memory: '16384',
    description:
      'Domain name permutation engine for detecting similar registered domains.'
  },
  peDomMasq: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description:
      'Fetch DNSTwist data, check IPs on blocklist.de, then sync to PE db instance.'
  },
  peCybersixgill: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description: 'Run P&E Cybersixgill scripts and add to PE db instance.'
  },
  peHibpSync: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description: 'Fetch hibp data and sync it with the PE db instance.'
  },
  peShodan: {
    type: 'fargate',
    isPassive: true,
    global: true,
    cpu: '2048',
    memory: '16384',
    description:
      'Run organization IPs through shodan and circl to find un/verified vulns and save them to PE db.'
  },
  rootDomainSync: {
    type: 'fargate',
    isPassive: true,
    global: false,
    description:
      'Creates domains from root domains by doing a single DNS lookup for each root domain.'
  },
  savedSearch: {
    type: 'fargate',
    isPassive: true,
    global: true,
    description: 'Performs saved searches to update their search results'
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

  @IsBoolean()
  isUserModifiable: boolean;

  @IsBoolean()
  isSingleScan: boolean;

  @IsUUID('all', { each: true })
  organizations: string[];

  @IsArray()
  tags: OrganizationTag[];
}

/**
 * @swagger
 *
 * /scans/{id}:
 *  delete:
 *    description: Delete a particular scan.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scan id
 *    tags:
 *    - Scans
 */
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

/**
 * @swagger
 *
 * /scans/{id}:
 *  put:
 *    description: Update a particular scan.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scan id
 *    tags:
 *    - Scans
 */
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
      organizations: body.organizations.map((id) => ({ id })),
      tags: body.tags
    });
    const res = await Scan.save(scan);
    return {
      statusCode: 200,
      body: JSON.stringify(res)
    };
  }
  return NotFound;
});

/**
 * @swagger
 *
 * /scans:
 *  post:
 *    description: Create a new scan.
 *    tags:
 *    - Scans
 */
export const create = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const body = await validateBody(NewScan, event.body);
  const scan = await Scan.create({
    ...body,
    organizations: body.organizations.map((id) => ({ id })),
    tags: body.tags,
    createdBy: { id: event.requestContext.authorizer!.id }
  });
  const res = await Scan.save(scan);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

/**
 * @swagger
 *
 * /scans/{id}:
 *  get:
 *    description: Get information about a particular scan.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scan id
 *    tags:
 *    - Scans
 */
export const get = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.scanId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const scan = await Scan.findOne(
    {
      id: id
    },
    {
      relations: ['organizations', 'tags']
    }
  );

  if (scan) {
    const schema = SCAN_SCHEMA[scan.name];
    const organizations = await Organization.find();
    return {
      statusCode: 200,
      body: JSON.stringify({
        scan: scan,
        schema: schema,
        organizations: organizations.map((e) => ({
          name: e.name,
          id: e.id
        }))
      })
    };
  }
  return NotFound;
});

/**
 * @swagger
 *
 * /scans:
 *  get:
 *    description: List scans.
 *    tags:
 *    - Scans
 */
export const list = wrapHandler(async (event) => {
  // if (!isGlobalWriteAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const result = await Scan.find({ relations: ['tags'] });
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

/**
 * @swagger
 *
 * /granularScans:
 *  get:
 *    description: List user-modifiable scans. These scans are retrieved by a standard organization admin user, who is then able to enable or disable these particular scans.
 *    tags:
 *    - Scans
 */
export const listGranular = wrapHandler(async (event) => {
  await connectToDatabase();
  const scans = await Scan.find({
    select: ['id', 'name', 'isUserModifiable'],
    where: {
      isGranular: true,
      isUserModifiable: true,
      isSingleScan: false
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

/**
 * @swagger
 *
 * /scheduler/invoke:
 *  post:
 *    description: Manually invoke scheduler to run scheduled scans.
 *    tags:
 *    - Scans
 */
export const invokeScheduler = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  const lambdaClient = new LambdaClient();
  const response = await lambdaClient.runCommand({
    name: `${process.env.SLS_LAMBDA_PREFIX!}-scheduler`
  });
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

/**
 * @swagger
 *
 * /scans/{id}/run:
 *  post:
 *    description: Manually run a particular scan.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scan id
 *    tags:
 *    - Scans
 */
export const runScan = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.scanId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const scan = await Scan.findOne({
    id: id
  });

  if (scan) {
    scan.manualRunPending = true;

    const res = await Scan.save(scan);
    return {
      statusCode: 200,
      body: JSON.stringify(res)
    };
  }
  return NotFound;
});
