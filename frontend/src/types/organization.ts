export interface Organization {
  id: number;
  name: string;
  rootDomains: string[];
  ipBlocks: string[];
  isPassive: boolean;
}
