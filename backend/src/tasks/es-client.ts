import { Client } from '@elastic/elasticsearch';
import { Domain } from '../models';

export const DOMAINS_INDEX = 'domains-4';

/**
 * Elasticsearch client.
 */
class ESClient {
  client: Client;

  constructor(isLocal?: boolean) {
    this.client = new Client({ node: process.env.ELASTICSEARCH_ENDPOINT! });
  }

  /**
   * Creates the domains index, if it doesn't already exist.
   */
  async syncDomainsIndex() {
    try {
      await this.client.indices.get({
        index: DOMAINS_INDEX
      });
      console.log(`Index ${DOMAINS_INDEX} already created`);
    } catch (e) {
      await this.client.indices.create({
        index: DOMAINS_INDEX,
        body: {
          mappings: {
            dynamic: true,
            properties: {
              services: {
                type: 'nested'
              },
              vulnerabilities: {
                type: 'nested'
              }
            }
          },
          settings: {
            number_of_shards: 2
          }
        }
      });
      console.log(`Created index ${DOMAINS_INDEX}`);
    }
  }

  /**
   * Updates the given domains, upserting as necessary.
   * @param domains Domains to insert.
   */
  async updateDomains(domains: Domain[]) {
    return this.client.helpers.bulk<Domain>({
      datasource: domains,
      onDocument(domain) {
        return [
          {
            update: {
              _index: DOMAINS_INDEX,
              _id: domain.id
            }
          },
          { doc_as_upsert: true }
        ];
      }
    });
  }

  /**
   * Searches for domains.
   */
  async searchDomains() {
    return this.client.search({
      index: DOMAINS_INDEX,
      body: {
        query: {
          // match: { name: 'cisa' }
          match_all: {}
        }
      }
    });
  }
}

export default ESClient;
