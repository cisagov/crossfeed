import { connectToDatabase, Cpe } from '../../models';

export default async (cpes: Cpe[]): Promise<string[]> => {
  await connectToDatabase();
  console.log('Saving CPEs to database');
  const ids: string[] = [];
  for (const cpe of cpes) {
    try {
      const id: string = (
        await Cpe.createQueryBuilder()
          .insert()
          .values(cpe)
          .returning('id')
          .onConflict(
            `("name", "version", "vendor")DO UPDATE SET "lastSeenAt" = now()`
          )
          .execute()
      ).identifiers[0].id;
      ids.push(id);
    } catch (error) {
      console.log(`Error saving CPE to database: ${error}`);
      console.log(`CPE: ${cpe.name} ${cpe.version} ${cpe.vendor}`);
    }
  }
  return ids;
};
