import { OrganizationTag } from './organization';

export interface Scan {
  id: string;
  name: string;
  arguments: Object;
  frequency: number;
  lastRun: string;
  isGranular: boolean;
  isUserModifiable: boolean;
  isSingleScan: boolean;
  organizations: [];
  tags: OrganizationTag[];
}

// ScanSchema. TODO: synchronize this with the ScanSchema type in the backend.
export interface ScanSchema {
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
