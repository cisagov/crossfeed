import { Scan } from './scan';

export interface ScanTask {
  id: string;
  status: string;
  type: string;
  input: string;
  output: string;
  createdAt: string;
  startedAt: string;
  requestedAt: string;
  finishedAt: string;
  scan: Scan;
  fargateTaskArn: string;
}
