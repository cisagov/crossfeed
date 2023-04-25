import { connectToDatabase, Organization, OrganizationTag } from '../models';
import { CommandOptions } from './ecs-client';
import axios from 'axios';
import * as Papa from 'papaparse';

interface ParsedRow {
  'Domain Name': string;
  'Domain Type': string;
  Agency: string;
  Organization: string;
  City: string;
  State: string;
  'Security Contact Email': string;
}

// Retrieve all .gov domains
// export const DOTGOV_LIST_ENDPOINT =
//   'https://raw.githubusercontent.com/cisagov/dotgov-data/main/current-full.csv';

// To scan only federal .gov domains, use the below endpoint:
export const DOTGOV_LIST_ENDPOINT =
  'https://raw.githubusercontent.com/cisagov/dotgov-data/main/current-federal.csv';

export const DOTGOV_TAG_NAME = 'dotgov';
export const DOTGOV_ORG_SUFFIX = ' (dotgov)';

export const handler = async (commandOptions: CommandOptions) => {
  const { data } = await axios.get(DOTGOV_LIST_ENDPOINT);
  const parsedRows: ParsedRow[] = await new Promise((resolve, reject) =>
    Papa.parse(data, {
      header: true,
      dynamicTyping: true,
      complete: ({ data, errors }) =>
        errors.length ? reject(errors) : resolve(data as ParsedRow[])
    })
  );

  await connectToDatabase();

  const orgsToRootDomainMap: {
    [x: string]: { row: ParsedRow; rootDomains: Set<string> };
  } = {};
  for (const row of parsedRows) {
    const orgName = row.Agency + DOTGOV_ORG_SUFFIX;
    if (!orgsToRootDomainMap[orgName]) {
      orgsToRootDomainMap[orgName] = { row, rootDomains: new Set() };
    }
    orgsToRootDomainMap[orgName].rootDomains.add(
      row['Domain Name'].toLowerCase()
    );
  }

  const tag =
    (await OrganizationTag.findOne({ where: { name: DOTGOV_TAG_NAME } })) ||
    (await OrganizationTag.create({
      name: DOTGOV_TAG_NAME
    }).save());

  for (const [orgName, { row, rootDomains }] of Object.entries(
    orgsToRootDomainMap
  )) {
    // Create a new organization if needed; else, create the same one.
    console.log(orgName);
    const organization =
      (await Organization.findOne({
        name: orgName
      })) ||
      (await Organization.create({
        name: orgName,
        tags: [tag],
        ipBlocks: [],
        isPassive: true,
        rootDomains: []
      }));
    organization.tags = [tag];
    // Replace existing rootDomains with new rootDomains.
    organization.rootDomains = [...rootDomains];
    await organization.save();
    console.log('Finished org', orgName);
  }

  console.log(`dotgov done`);
};
