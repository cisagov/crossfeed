import { connectToDatabase, Vulnerability } from '../../models';

export default async (
  vulnerabilities: Vulnerability[],
  updateState: boolean
): Promise<void> => {
  await connectToDatabase();
  for (const vulnerability of vulnerabilities) {
    let query = `("domainId", "title") DO UPDATE
    SET "lastSeen" = excluded."lastSeen",
        "cvss" = excluded."cvss",
        "severity" = excluded."severity",
        "cve" = excluded."cve",
        "cwe" = excluded."cwe",
        "updatedAt" = now(),
        "cpe" = excluded."cpe"`;
    if (updateState) {
      query += ',"state" = excluded."state","substate" = excluded."substate"';
    }
    if (vulnerability.description) {
      query += ',"description" = excluded."description"';
    }
    await Vulnerability.createQueryBuilder()
      .insert()
      .values(vulnerability)
      .onConflict(query)
      .execute();
  }
};
