import getAllDomains from '../../helpers/getAllDomains';
import { Domain, connectToDatabase } from '../../../models';

describe('getAllDomains', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  test('basic test', async () => {
    const name = Math.random() + '';
    const ip = Math.random() + '';
    const domain = await Domain.create({
      name,
      ip
    }).save();
    const domains = await getAllDomains();
    expect(domains.length).toBeGreaterThan(0);
    const domainIndex = domains.map((e) => e.id).indexOf(domain.id);
    expect(domains[domainIndex]).toEqual({
      id: domain.id,
      name,
      ip
    });
  });
});
