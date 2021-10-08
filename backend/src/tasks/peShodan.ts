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

const create_child =async (APIkey, org_list): Promise<void> =>{
  console.log("create Child started ", APIkey )
  
  const child = spawn(
    'python3',
    ['/app/worker/pe_scripts/enrich_shodan_pe.py'],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        org_list: JSON.stringify(org_list),
        key: APIkey
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
    console.log("stdout", APIkey, line);
    });
    readInterfaceStderr.on('line', line => {
    console.log("stderr", APIkey, line);
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
    console.log(org_string_list)
    
    const numOfApis: number = 3
    const org_chunks = chunk(org_string_list,org_string_list.length / numOfApis)


    console.log(org_chunks)

  const org_obj = [
    {
      org_list: org_chunks[0],
    api_key:process.env.PE_SHODAN_API_KEY_1 
    },
    {
      org_list: org_chunks[1],
      api_key:process.env.PE_SHODAN_API_KEY_2
    },
    {
      org_list: org_chunks[2],
      api_key:process.env.PE_SHODAN_API_KEY_3
    }
  ]
  const queue = new PQueue({ concurrency: numOfApis });
  
  await Promise.all(
    org_obj.map((obj) => queue.add(() => create_child(obj.api_key, obj.org_list)))
  );
    

    // console.log(process.env.PE_SHODAN_API_KEY_1);

    // (async () => {
    // queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_1, org_chunks[0]));
    // })();
    
    // (async () => {
    //   queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_2, org_chunks[1]));
    //   })();
      
    // (async () => {
    //   queue.add(async()=>create_child(process.env.PE_SHODAN_API_KEY_3, org_chunks[2]));
    //   })();

    //   console.log("Finished All IPs")
};