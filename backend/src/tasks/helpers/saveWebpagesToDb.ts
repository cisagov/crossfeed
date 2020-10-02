import { connectToDatabase, Webpage } from '../../models';

export default async (webpages: Webpage[]): Promise<void> => {
  await connectToDatabase();

  for (const webpage of webpages) {
    await Webpage.createQueryBuilder()
      .insert()
      .values(webpage)
      .onConflict(
        `
        ("domainId","url") DO UPDATE
        SET "lastSeen" = excluded."lastSeen",
            "status" = excluded."status",
            "updatedAt" = now()
      `
      )
      .execute();
  }
};
