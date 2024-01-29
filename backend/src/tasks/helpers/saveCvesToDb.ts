import { connectToDatabase, ProductInfo, Cve } from '../../models';

export default async (cves: Cve, cpeIds: string[]): Promise<string> => {
  await connectToDatabase();
  console.log('Saving Cves to database');
  try {
    const id: string = (
      await Cve.createQueryBuilder()
        .insert()
        .values(cves)
        .returning('cve_uid')
        .onConflict(`("cve_name")DO UPDATE SET "last_modified_date" = now()`) //todo this might not be the same
        .execute()
    ).identifiers[0].cve_uid;
    await ProductInfo.createQueryBuilder()
      .relation(Cve, 'product_info')
      .of(id)
      .add(cpeIds);
    return id;
  } catch (error) {
    console.log(`Error saving CVE to database: ${error}`);
    console.log(`CVE: ${cves.cve_name}`);
    return '';
  }
};
