import { Organization, connectToDatabase } from '../../models';

export default async (organizationId: string) => {
  await connectToDatabase();

  const organization = await Organization.findOne(organizationId);
  return organization!.rootDomains;
};
