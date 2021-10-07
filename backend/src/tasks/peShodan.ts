import {
  connectToDatabase,
  Organization,

} from '../models';
import { CommandOptions } from './ecs-client';
import { spawnSync} from 'child_process';
import { ProcessCredentials } from 'aws-sdk';
import PQueue from 'p-queue';
import { create } from 'lodash';

function chunkify(a, n, balanced) {
    
  if (n < 2)
      return [a];

  var len = a.length,
          out:string[]= [],
          i = 0,
          size;

  if (len % n === 0) {
      size = Math.floor(len / n);
      while (i < len) {
          out.push(a.slice(i, i += size));
      }
  }

  else if (balanced) {
      while (i < len) {
          size = Math.ceil((len - i) / n--);
          out.push(a.slice(i, i += size));
      }
  }

  else {

      n--;
      size = Math.floor(len / n);
      if (len % size === 0)
          size--;
      while (i < size * n) {
          out.push(a.slice(i, i += size));
      }
      out.push(a.slice(size * n));

  }

  return out;
}

const create_child =async (APIkey, org_list): Promise<void> =>{
  const child = spawnSync(
    'python3',
    ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: {
        ...process.env,
        org_list: org_list,
        key: APIkey
      }
    }
  );
  const savedOutput = child.stdout;
  console.log(savedOutput);
};

export const handler = async (commandOptions: CommandOptions) => {
    const { organizationId, organizationName } = commandOptions;
    await connectToDatabase();

    const organizations = await Organization.createQueryBuilder('organization')
      .select('organization.name')
      .innerJoin('organization.tags', 'tags')
      .where('tags.name = :name', { name: "P&E" })
      .getRawMany();
   
    const org_string_list : string[] = organizations.map(org => org.organization_name)
    console.log(org_string_list)
    
    const numOfApis: number = 3
    const org_chunks = chunkify(org_string_list, numOfApis, true)

    console.log(org_chunks)

    const queue = new PQueue({ concurrency: numOfApis });

    console.log(process.env.PE_SHODAN_API_KEY_1);

    (async () => {
    queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_1, org_chunks[0]));
    })();
    console.log(process.env.PE_SHODAN_API_KEY_2);
    (async () => {
      queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_2, org_chunks[1]));
      })();
      console.log(process.env.PE_SHODAN_API_KEY_3);
    (async () => {
      queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_3, org_chunks[2]));
      })();
};