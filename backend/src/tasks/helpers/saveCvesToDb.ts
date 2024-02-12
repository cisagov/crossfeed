import { connectToDatabase, Cpe, Cve } from '../../models';

export default async (cves: Cve, cpeIds: string[]): Promise<string> => {
  await connectToDatabase();
  console.log('Saving CVEs to database');
  try {
    const id: string = (
      await Cve.createQueryBuilder()
        .insert()
        .values(cves)
        .returning('id')
        .onConflict(`("name")DO UPDATE SET "modifiedAt" = now()`) //todo this might not be the same
        .execute()
    ).identifiers[0].id;
    await Cpe.createQueryBuilder().relation(Cve, 'cpes').of(id).add(cpeIds);
    return id;
  } catch (error) {
    console.log(`Error saving CVE to database: ${error}`);
    console.log(`CVE: ${cves.name}`);
    return '';
  }
};
