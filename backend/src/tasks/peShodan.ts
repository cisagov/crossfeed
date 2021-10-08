import {
  connectToDatabase,
  Organization,

} from '../models';
import { CommandOptions } from './ecs-client';
import { spawnSync, spawn} from 'child_process';
import { ProcessCredentials } from 'aws-sdk';
import PQueue from 'p-queue';
import { chunk } from 'lodash';
import * as readline from 'readline'

interface org_api {
  org_list: string[];
  api_key: string;
  thread_num: number;
}

const create_child =async (APIkey, org_list, thread_num): Promise<void> =>{
  console.log("create Child started ", APIkey )
  
  const child = spawn(
    'python3',
    ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        org_list: JSON.stringify(org_list),
        key: APIkey,
      }
    }
  );
  const readInterface = readline.createInterface({
    // Output
    input: child.stdout
    });
    const readInterfaceStderr = readline.createInterface({
    // Error logs
    input: child.stderr
    });
    
    await new Promise((resolve, reject) => {
    readInterface.on('line', line => {
    console.log("thread", thread_num,  line);
    });
    readInterfaceStderr.on('line', line => {
    console.log("error", thread_num , line);
    });
    child.stdout.on('close', resolve)
    child.stdout.on('SIGINT', reject);
    child.stdout.on('SIGCONT', reject);
    child.stdout.on('SIGTSTP', reject);
    });
  // const savedOutput = child.stdout;
  // console.log(savedOutput, APIkey);
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
    
    const API_keys = process.env.PE_SHODAN_API_KEYS!
    const API_list = API_keys?.split(', ')
    const numOfApis: number = API_list.length
    const org_chunks = chunk(org_string_list,org_string_list.length / numOfApis)
    console.log(API_list)
    console.log(org_chunks)



  var org_obj: org_api[] = []
  for (let i = 0; i < numOfApis; i++) {
    const org_api = {
      org_list: org_chunks[i],
      api_key: API_list[i],
      thread_num: i
    }
    org_obj.push(org_api)
  }
  //   {
  //     org_list: org_chunks[0],
  //   api_key:API_list[0]
  //   },
  //   {
  //     org_list: org_chunks[1],
  //     api_key:API_list[1]
  //   },
  //   {
  //     org_list: org_chunks[2],
  //     api_key:API_list[2]
  //   }
  // ]
  const queue = new PQueue({ concurrency: numOfApis });
  
  await Promise.all(
    org_obj.map((obj) => queue.add(() => create_child(obj.api_key, obj.org_list, obj.thread_num)))
  );
  
      console.log("Finished All IPs")
};