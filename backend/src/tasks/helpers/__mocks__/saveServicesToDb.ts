import { Service } from '../../../models';

export default async (services: Service[]) => {
  services = services.sort((a, b) =>
    (a.service || '').localeCompare(b.service || '')
  );
  services.forEach((service) => {
    if (service.censysIpv4Results) {
      // Create a smaller snapshot, rather than storing the entire ipv4 result data.
      service.censysIpv4Results = {
        TEST_SNAPSHOT:
          JSON.stringify(service.censysIpv4Results).substring(0, 300) + '...'
      };
    }
  });
  expect(services).toMatchSnapshot('helpers.saveServicesToDb');
};
