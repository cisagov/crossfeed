import { Organization, Scan } from 'src/models';

/**
 * Return the organizations that a scan should be run on.
 * A scan should be run on an organization if the scan is
 * enabled for that organization or for one of its tags.
 */
export default (scan: Scan) => {
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
