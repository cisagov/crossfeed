import * as fs from 'fs';
import * as path from 'path';

/**
 * Sets token in localStorage. If null is provided to token,
 * clears localStorage (used to simulate anonymous access).
 */
export const setToken = async (page, token: string | null) => {
  await page.goto('http://localhost');
  await page.evaluate((token) => {
    if (token === null) {
      localStorage.clear();
    } else {
      localStorage.setItem('token', token);
    }
  }, token);
  await page.reload();
};

/**
 * Wraps and runs downloadFunction, a function that triggers a download,
 * so that the resulting file is read and returned.
 */
export const downloadAndReadFile = async (page, downloadFunction: Function) => {
  const downloadPath = fs.mkdtempSync(
    path.resolve(__dirname, 'downloaded') + '/'
  );
  await (page as any)._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await downloadFunction();
  await page.waitFor(1000);

  const filePath = path.resolve(downloadPath, fs.readdirSync(downloadPath)[0]);
  return fs.readFileSync(filePath, 'utf-8');
};
