import * as fs from 'fs';

// Checks for PSL at ${path} and fetches a new one if missing or out of date
export default async (path = 'public_suffix_list.dat'): Promise<void> => {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, await fetchPSL());
  } else {
    const pslAge = (Date.now() - fs.statSync(path).mtimeMs) / (1000 * 60 * 60);
    if (pslAge > 24) {
      fs.writeFileSync(path, await fetchPSL());
    }
  }
};

async function fetchPSL() {
  return fetch('https://publicsuffix.org/list/public_suffix_list.dat', {
    method: 'GET'
  }).then((res) => res.text());
}
