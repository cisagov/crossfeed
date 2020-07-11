import { handler as wappalyzer } from '../wappalyzer';
jest.mock('../helpers/getLiveWebsites');
jest.mock('../helpers/saveDomainsToDb');

jest.mock("simple-wappalyzer", () => async () => 
  [{"name":"Drupal","slug":"drupal","categories":[{"id":1,"slug":"cms","name":"CMS","priority":1}],"confidence":100,"version":"8","icon":"Drupal.svg","website":"https://drupal.org","cpe":"cpe:/a:drupal:drupal"},{"name":"Apache","slug":"apache","categories":[{"id":22,"slug":"web-servers","name":"Web servers","priority":8}],"confidence":100,"version":"","icon":"Apache.svg","website":"http://apache.org","cpe":"cpe:/a:apache:http_server"},{"name":"PHP","slug":"php","categories":[{"id":27,"slug":"programming-languages","name":"Programming languages","priority":5}],"confidence":100,"version":"","icon":"PHP.svg","website":"http://php.net","cpe":"cpe:/a:php:php"}]
)

describe('wappalyzer', () => {
  test('basic test', async () => {
    await wappalyzer({
      organizationId: 'organizationId',
      organizationName: 'organizationName',
      scanId: 'scanId',
      scanName: 'scanName',
      scanTaskId: 'scanTaskId'
    });
  });
});
