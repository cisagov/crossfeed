import { connectToDatabase, Cpes, Cves } from '../../models';

export default async (cves: Cves, cpeIds: string[]): Promise<string> => {
  await connectToDatabase();
  console.log('Saving Cves to database');
  try {
    const id: string = (
      await Cves.createQueryBuilder()
        .insert()
        .values(cves)
        .returning('cve_uid')
        .onConflict(`("cve_name")DO UPDATE SET "last_modified_date" = now()`) //todo this might not be the same
        .execute()
    ).identifiers[0].cve_uid;
    await Cpes.createQueryBuilder().relation(Cves, 'cpes').of(id).add(cpeIds);
    return id;
  } catch (error) {
    console.log(`Error saving CVE to database: ${error}`);
    console.log(`CVE: ${cves.cve_name}`);
    return '';
  }
};
