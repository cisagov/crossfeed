import { Domain, connectToDatabase } from "../../models";

/** Helper function to fetch all live websites (port 80 or 443) */
// TODO: make this per-organization specific.
export default async (
  includePassive: boolean
): Promise<Domain[]> => {

  await connectToDatabase();

  const qs = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.services', 'services')
    .leftJoinAndSelect('domain.organization', 'organization')
    .groupBy('domain.id, domain.ip, domain.name, organization.id, services.id');

  qs.andHaving(
    "COUNT(CASE WHEN services.port = '443' OR services.port = '80' THEN 1 END) >= 1"
  );

  if (!includePassive) {
    qs.andHaving('NOT organization."isPassive"');
  }

  return await qs.getMany();
};