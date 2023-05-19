import * as fs from 'fs';

// Checks for PSL at ${path} and fetches a new one if missing or out of date
export default async (path = 'public_suffix_list.dat'): Promise<void> => {
  fs.open(path, 'wx', async (err, fd) => {
    if (err) {
      if (err.code === 'EEXIST') {
        const pslAge =
          (Date.now() - fs.statSync(path).mtimeMs) / (1000 * 60 * 60);
        if (pslAge > 24) {
          fs.writeFileSync(path, await fetchPSL());
        }
        return;
      } else throw err;
    }
    try {
      fs.writeFileSync(fd, await fetchPSL());
    } catch (e) {
      console.error(e);
    } finally {
      fs.closeSync(fd);
    }
  });
};

async function fetchPSL() {
  return await fetch('https://publicsuffix.org/list/public_suffix_list.dat', {
    method: 'GET'
  }).then((res) => res.text());
}
