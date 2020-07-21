import axios from 'axios';
import { compile } from 'json-schema-to-typescript';
import * as fs from 'fs';
import * as path from 'path';

async function searchCensys() {
  const { data, status, headers } = await axios.get(
    'https://censys.io/api/v1/account/',
    {
      auth: {
        username: process.env.CENSYS_API_ID!,
        password: process.env.CENSYS_API_SECRET!
      }
    }
  );
  console.error(data);
};

(async () => {
  // npx ts-node src/tools/search.ts
  await searchCensys();
  process.exit();
})();
