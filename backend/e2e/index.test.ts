import { setToken } from './utils';

describe('anonymous users', () => {
  beforeEach(async () => {
    await setToken(page, null);
  });

  it('presented with login screen, click login to go to login.gov', async () => {
    await page.goto('http://localhost');
    expect(await page.content()).toContain('Welcome to Crossfeed');
    const button = await page.$x("//button[contains(text(), 'Login')]");
    await button[0].click();
    await page.waitForNavigation();
    expect(page.url()).toContain('idp.int.identitysandbox.gov');
  });

  it('going to another page should redirect to the main page', async () => {
    await page.goto('http://localhost/scans');
    await page.waitFor(() => window.location.href === 'http://localhost/');
  });
});
