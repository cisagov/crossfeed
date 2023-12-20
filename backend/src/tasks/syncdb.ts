import { Handler } from 'aws-lambda';
import {
  connectToDatabase,
  Service,
  Domain,
  Organization,
  OrganizationTag,
  Scan,
  Vulnerability
} from '../models';
import ESClient from './es-client';
import * as Sentencer from 'sentencer';
import * as services from './sample_data/services.json';
import * as cpes from './sample_data/cpes.json';
import * as vulnerabilities from './sample_data/vulnerabilities.json';
import * as nouns from './sample_data/nouns.json';
import * as adjectives from './sample_data/adjectives.json';
import { sample } from 'lodash';
import { handler as searchSync } from './search-sync';
import { In } from 'typeorm';
import logger from '../tools/lambda-logger';

const SAMPLE_TAG_NAME = 'Sample Data'; // Tag name for sample data
const NUM_SAMPLE_ORGS = 10; // Number of sample orgs
const NUM_SAMPLE_DOMAINS = 10; // Number of sample domains per org
const PROB_SAMPLE_SERVICES = 0.5; // Higher number means more services per domain
const PROB_SAMPLE_VULNERABILITIES = 0.5; // Higher number means more vulnerabilities per domain

export const handler: Handler = async (event, context) => {
  const connection = await connectToDatabase(false);
  const type = event?.type || event;
  const dangerouslyforce = type === 'dangerouslyforce';
  if (connection) {
    await connection.synchronize(dangerouslyforce);
  } else {
    logger.error('Error: could not sync', { context });
  }

  if (process.env.NODE_ENV !== 'test') {
    // Create indices on elasticsearch only when not using tests.
    const client = new ESClient();
    if (dangerouslyforce) {
      logger.info('Deleting all data in elasticsearch...', { context });
      await client.deleteAll();
      logger.info('Done.', { context });
    }
    await client.syncDomainsIndex();
  }

  if (type === 'populate') {
    logger.info('Populating the database with some sample data...', {
      context
    });
    Sentencer.configure({
      nounList: nouns,
      adjectiveList: adjectives,
      actions: {
        entity: () => sample(['city', 'county', 'agency', 'department'])
      }
    });
    const organizationIds: string[] = [];
    let tag = await OrganizationTag.findOne(
      { name: SAMPLE_TAG_NAME },
      { relations: ['organizations'] }
    );
    if (tag) {
      await Organization.delete({
        id: In(tag.organizations.map((e) => e.id))
      });
    } else {
      tag = await OrganizationTag.create({
        name: SAMPLE_TAG_NAME
      }).save();
    }
    for (let i = 0; i <= NUM_SAMPLE_ORGS; i++) {
      const organization = await Organization.create({
        name: Sentencer.make('{{ adjective }} {{ entity }}').replace(
          /\b\w/g,
          (l) => l.toUpperCase()
        ), // Capitalize organization names
        rootDomains: ['crossfeed.local'],
        ipBlocks: [],
        isPassive: false,
        tags: [tag]
      }).save();
      logger.info(organization.name, { context });
      organizationIds.push(organization.id);
      for (let i = 0; i <= NUM_SAMPLE_DOMAINS; i++) {
        const randomNum = () => Math.floor(Math.random() * 256);
        const domain = await Domain.create({
          name: Sentencer.make('{{ adjective }}-{{ noun }}.crossfeed.local'),
          ip: ['127', randomNum(), randomNum(), randomNum()].join('.'), // Create random loopback addresses
          fromRootDomain: 'crossfeed.local',
          subdomainSource: 'findomain',
          organization
        }).save();
        logger.info(`\t${domain.name}`, { context });
        let service;
        for (const serviceData of services) {
          if (service && Math.random() < PROB_SAMPLE_SERVICES) continue;
          service = await Service.create({
            domain,
            port: serviceData.port,
            service: serviceData.service,
            serviceSource: 'shodan',
            wappalyzerResults: [
              {
                technology: {
                  cpe: sample(cpes)
                },
                version: ''
              }
            ]
          }).save();
        }
        // Create a bunch of vulnerabilities for the first service
        for (const vulnData of vulnerabilities) {
          // Sample CVE vulnerabilities, but always add a single instance of other
          // vulnerabilities (hibp / dnstwist)
          if (
            vulnData.title.startsWith('CVE-') &&
            Math.random() < PROB_SAMPLE_VULNERABILITIES
          )
            continue;
          await Vulnerability.create({
            ...vulnData,
            domain,
            service
          } as object).save();
        }
      }
    }

    logger.info('Done. Running search sync...', { context });
    for (const organizationId of organizationIds) {
      await searchSync({
        organizationId,
        scanId: 'scanId',
        scanName: 'scanName',
        organizationName: 'organizationName',
        scanTaskId: 'scanTaskId'
      });
    }
    logger.info('Done.', { context });
  }
};
