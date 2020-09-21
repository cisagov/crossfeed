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
  test('set products should combine data from multiple scans (intrigue over wappalyzer)', async () => {
    const service = await Service.create({
      port: 443
    }).save();
    service.wappalyzerResults = [
      {
        cpe: 'cpe:/a:software',
        name: 'name',
        version: '',
        slug: 'slug',
        icon: 'icon',
        website: 'website',
        confidence: 0,
        categories: []
      }
    ];
    service.intrigueIdentResults = {
      fingerprint: [
        {
          cpe: 'cpe:/a:software',
          version: '1.1',
          type: '',
          vendor: 'vendor',
          update: '1',
          tags: ['test'],
          match_type: '',
          match_details: '',
          hide: false,
          product: '',
          inference: false
        }
      ],
      content: []
    };
    await service.save();
    expect(service.products).toMatchObject([
      {
        cpe: 'cpe:/a:software',
        icon: 'icon',
        name: 'name',
        revision: '1',
        tags: ['test'],
        vendor: 'vendor',
        version: '1.1'
      }
    ]);
  });
  test('set products should combine data from multiple scans (wappalyzer over intrigue)', async () => {
    const service = await Service.create({
      port: 443
    }).save();
    service.wappalyzerResults = [
      {
        cpe: 'cpe:/a:software',
        name: 'name',
        version: '1.1',
        slug: 'slug',
        icon: 'icon',
        website: 'website',
        confidence: 0,
        categories: []
      }
    ];
    service.intrigueIdentResults = {
      fingerprint: [
        {
          cpe: 'cpe:/a:software',
          version: '',
          type: '',
          vendor: 'vendor',
          update: '1',
          tags: ['test'],
          match_type: '',
          match_details: '',
          hide: false,
          product: '',
          inference: false
        }
      ],
      content: []
    };
    await service.save();
    expect(service.products).toMatchObject([
      {
        cpe: 'cpe:/a:software',
        icon: 'icon',
        name: 'name',
        revision: '1',
        tags: ['test'],
        vendor: 'vendor',
        version: '1.1'
      }
    ]);
  });
});
