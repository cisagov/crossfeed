import { connectToDatabase, Vulnerability } from '../../models';

export default async (
  vulnerabilities: Vulnerability[],
  updateState: boolean
): Promise<void> => {
  await connectToDatabase();

  for (const vulnerability of vulnerabilities) {
    await Vulnerability.createQueryBuilder()
      .insert()
      .values(vulnerability)
      .onConflict(
        `
          ("domainId", "title") DO UPDATE
          SET "lastSeen" = excluded."lastSeen",
              "cvss" = excluded."cvss",
              "severity" = excluded."severity",
              "description" = excluded."description",
              "cve" = excluded."cve",
              "cwe" = excluded."cwe",
              "cpe" = excluded."cpe"${
                updateState
                  ? `,"state" = excluded."state",
                  "substate" = excluded."substate"`
                  : ''
              }`
      )
      .execute();
  }
};
