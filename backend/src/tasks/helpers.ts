import { Organization } from '../models';

/** Helper function to return all root domains for all organizations */
export const getRootDomains = async (
  includePassive: boolean
): Promise<
  {
    name: string;
    organization: Organization;
  }[]
> => {
  const organizations = await Organization.find();
  const allDomains: {
    name: string;
    organization: Organization;
  }[] = [];

  for (const org of organizations) {
    if (includePassive || !org.isPassive) {
      for (const domain of org.rootDomains)
        allDomains.push({ name: domain, organization: org });
    }
  }
  return allDomains;
};
