import { connectToDatabase } from '../connection';
import { Service } from '../service';

describe('service', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  test('set products', async () => {
    const service = await Service.create({
      port: 443
    }).save();
    service.wappalyzerResults = [
      {
        cpe: 'cpe1',
        name: 'name',
        version: 'version',
        slug: 'slug',
        icon: 'icon',
        website: 'website',
        confidence: 0,
        categories: []
      }
    ];
    await service.save();
    expect(service.products).toMatchSnapshot();
  });
  test('set products should not include a blacklisted product', async () => {
    const service = await Service.create({
      port: 443
    }).save();
    service.wappalyzerResults = [
      {
        cpe: 'cpe:/a:apache:tomcat',
        name: 'name',
        version: '1.1',
        slug: 'slug',
        icon: 'icon',
        website: 'website',
        confidence: 0,
        categories: []
      }
    ];
    await service.save();
    expect(service.products.length).toEqual(0);
  });
});
