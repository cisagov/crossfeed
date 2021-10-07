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
   
    
    console.log(organizations)
    const numOfApis: number = 2
    const org_chunks = chunkify(organizations, numOfApis, true)

    console.log(org_chunks)

    const queue = new PQueue({ concurrency: numOfApis });
    (async () => {
    queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY, org_chunks[0]));
    })();
    // const child_1 = spawnSync(
    //     'python3',
    //     ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
    //     {
    //       stdio: 'pipe',
    //       encoding: 'utf-8',
    //       env: {
    //         ...process.env,
    //         org_list: org_chunks[0],
    //         key: process.env.PE_SHODAN_API_KEY
    //       }
    //     }
    //   );
    //   const savedOutput = child_1.stdout;
    //   console.log(savedOutput);
    

    //   const child_2 = spawnSync(
    //     'python3',
    //     ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
    //     {
    //       stdio: 'pipe',
    //       encoding: 'utf-8',
    //       env: {
    //         ...process.env,
    //         org_list: org_chunks[1],
    //         key: process.env.PE_SHODAN_API_KEY_2
    //       }
    //     }
    //   );
    //   const savedOutput_2 = child_2.stdout;
    //   console.log(savedOutput_2);
};