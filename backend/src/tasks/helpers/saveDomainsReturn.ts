import { Domain, connectToDatabase } from '../../models';

export default async (domains: Domain[]) => {
  await connectToDatabase();

  const ids: string[] = [];
  for (const domain of domains) {
    const updatedValues = Object.keys(domain)
      .map((key) => {
        if (['name', 'fromRootDomain', 'discoveredBy'].indexOf(key) > -1)
          return '';
        else if (key === 'organization') return 'organizationId';
        return domain[key] !== null ? key : '';
      })
      .filter((key) => key !== '');
    const id: string = (
      await Domain.createQueryBuilder()
        .insert()
        .values(domain)
        .onConflict(
          `
            ("name", "organizationId") DO UPDATE
            SET ${updatedValues
              .map((val) => `"${val}" = excluded."${val}",`)
              .join('\n')}
                "updatedAt" = now()
          `
        )
        .returning('id')
        .execute()
    ).identifiers[0].id;
    ids.push(id);
  }
  return ids;
};
