import { connectToDatabase, Service } from '../../models';

export default async (services: Service[]): Promise<void> => {
  await connectToDatabase();

  for (const service of services) {
    await Service.createQueryBuilder()
      .insert()
      .values(service)
      .onConflict(
        `
        ("domainId","port") DO UPDATE
        SET "lastSeen" = excluded."lastSeen",
            "banner" = excluded."banner",
            "service" = excluded."service"
            "updatedAt" = now()
      `
      )
      .execute();
  }
};
