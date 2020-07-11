import { Domain, connectToDatabase } from '../../models';

export default async (domains: Domain[]): Promise<void> => {
  await connectToDatabase();

  for (let domain of domains) {
    const updatedValues = Object.keys(domain)
      .map((key) => {
        if (key == 'name') return '';
        else if (key == 'organization') return 'organizationId';
        return domain[key] !== null ? key : '';
      })
      .filter((key) => key !== '');
    const { generatedMaps } = await Domain.createQueryBuilder()
      .insert()
      .values(domain)
      .onConflict(
        `
            ("name") DO UPDATE
            SET ${updatedValues
              .map((val) => `"${val}" = excluded."${val}",`)
              .join('\n')}
                "updatedAt" = now()
          `
      )
      .execute();
    // return generatedMaps[0] as Domain;
  }
};