import { connectToDatabase, Service } from '../../models';

export default async (services: Service[]): Promise<void> => {
  await connectToDatabase();

  Service.createQueryBuilder()
    .insert()
    .values(services)
    .onConflict(
      `
      ("domainId","port") DO UPDATE
      SET "lastSeen" = excluded."lastSeen",
          "banner" = excluded."banner",
          "service" = excluded."service"
    `
    )
    .execute();
};
