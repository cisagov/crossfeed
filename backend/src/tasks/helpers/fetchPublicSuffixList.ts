import * as fs from 'fs';
import fetch from 'node-fetch';

// Checks for PSL at ${path} and fetches a new one if missing or out of date
export default async (path = 'public_suffix_list.dat'): Promise<void> => {
  fs.open(path, 'wx', async (err, fd) => {
    if (err) {
      if (err.code === 'EEXIST') {
        return await handleExistingPsl(path);
      } else throw err;
    }
    try {
      fs.writeFileSync(fd, await fetchPsl());
    } catch (e) {
      console.error(e);
    } finally {
      fs.closeSync(fd);
    }
  });
};
async function handleExistingPsl(path) {
  fs.open(path, 'r+', async (err, fd) => {
    try {
      const pslAge = (Date.now() - fs.fstatSync(fd).mtimeMs) / (1000 * 60 * 60);
      if (pslAge > 24) {
        fs.writeFileSync(fd, await fetchPsl());
      }
    } catch (e) {
      console.error(e);
    } finally {
      fs.closeSync(fd);
    }
    if (err) {
      throw err;
    }
  });
}

async function fetchPsl() {
  return await fetch('https://publicsuffix.org/list/public_suffix_list.dat', {
    method: 'GET'
  }).then((res) => res.text());
}
