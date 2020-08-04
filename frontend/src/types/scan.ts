export interface Scan {
  id: string;
  name: string;
  description: string | null;
  arguments: Object;
  frequency: number;
  lastRun: string;
}
