import { Service } from '../../../models';

export default async (services: Service[]): Promise<string[]> => {
  services = services.sort((a, b) =>
    (a.service || '').localeCompare(b.service || '')
  );
  expect(services).toMatchSnapshot('helpers.saveServicesToDb');
  return ['8831089d-f220-4bb5-893f-6b1ae5e7ca5a'];
};
