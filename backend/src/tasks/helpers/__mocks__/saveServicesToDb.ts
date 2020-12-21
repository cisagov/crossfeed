import { Service } from '../../../models';

export default async (services: Service[]): Promise<string[]> => {
  services = services.sort((a, b) =>
    (a.service || '').localeCompare(b.service || '')
  );
  expect(services).toMatchSnapshot('helpers.saveServicesToDb');
  return ['1234'];
};
