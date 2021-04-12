import { connectToDatabase, Vulnerability } from '../../models';

export default async (
  vulnerabilities: Vulnerability[],
  updateState: boolean
): Promise<void> => {
  await connectToDatabase();
  for (const vulnerability of vulnerabilities) {
    const updatedValues = Object.keys(vulnerability).filter((key) => {
      const allowedFields = [
        'lastSeen',
        'cvss',
        'severity',
        'cve',
        'cwe',
        'cpe',
        'serviceId',
        'description',
        'structuredData',
        ...(updateState ? ['state', 'substate'] : [])
      ];
      return (
        vulnerability[key] !== undefined && allowedFields.indexOf(key) > -1
      );
    });
    await Vulnerability.createQueryBuilder()
      .insert()
      .values(vulnerability)
      .onConflict(
        `
            ("domainId", "title") DO UPDATE
            SET ${updatedValues
              .map((val) => `"${val}" = excluded."${val}",`)
              .join('\n')}
                "updatedAt" = now()
          `
      )
      .execute();
  }
};
