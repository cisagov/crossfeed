import { connectToDatabase, Cpes } from '../../models';

export default async (cpes: Cpes[]): Promise<string[]> => {
  await connectToDatabase();
  console.log('Saving CPEs to database');
  const ids: string[] = [];
  for (const cpe of cpes) {
    try {
      const id: string = (
        await Cpes.createQueryBuilder()
          .insert()
          .values(cpe)
          .returning('id')
          .onConflict(
            `("cpe_product_name", "version_number", "vender")DO UPDATE SET "last_seen" = now()`
          )
          .execute()
      ).identifiers[0].id;
      ids.push(id);
    } catch (error) {
      console.log(`Error saving CPE to database: ${error}`);
      console.log(
        `CPE: ${cpe.cpe_product_name} ${cpe.version_number} ${cpe.vender}`
      );
    }
  }
  return ids;
};
