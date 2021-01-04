import { Organization, Scan } from 'src/models';

export default (scan: Scan) => {
  // Run scan if scan is enabled for organization or for one of its tags
  const organizationsToRun: { [id: string]: Organization } = {};
  for (const tag of scan.tags) {
    for (const organization of tag.organizations) {
      organizationsToRun[organization.id] = organization;
    }
  }
  for (const organization of scan.organizations) {
    organizationsToRun[organization.id] = organization;
  }
  return Object.values(organizationsToRun);
};
