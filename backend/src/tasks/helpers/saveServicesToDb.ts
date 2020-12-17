import { connectToDatabase, Service } from '../../models';

export default async (services: Service[]): Promise<void> => {
  await connectToDatabase();

  for (const service of services) {
    const updatedValues = Object.keys(service)
      .map((key) => {
        if (['port', 'domain', 'discoveredBy'].indexOf(key) > -1) return '';
        return service[key] !== null ? key : '';
      })
      .filter((key) => key !== '');
    await Service.createQueryBuilder()
      .insert()
      .values(service)
      .onConflict(
        `
      ("domainId","port") DO UPDATE
      SET ${updatedValues
        .map((val) => `"${val}" = excluded."${val}",`)
        .join('\n')}
          "updatedAt" = now()`
      )
      .execute();
  }
};
