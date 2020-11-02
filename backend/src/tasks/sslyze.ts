import { CommandOptions } from './ecs-client';
import { getLiveWebsites, LiveDomain } from './helpers/getLiveWebsites';
import PQueue from 'p-queue';
import * as sslChecker from 'ssl-checker';

interface IResolvedValues {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  validFor: string[];
}

const sslyze = async (domain: LiveDomain): Promise<void> => {
  try {
    const response: IResolvedValues = await (sslChecker as any)(domain.name);
    domain.ssl = {
      ...(domain.ssl || {}),
      valid: response.valid,
      validFrom: response.validFrom,
      validTo: response.validTo,
      altNames: response.validFor
    };
    console.log(
      domain.name,
      ': valid',
      response.valid,
      'validFrom',
      response.validFrom,
      'validTo',
      response.validTo
    );
    await domain.save();
  } catch (e) {
    console.error(domain.name, e);
  }
};

export const handler = async (commandOptions: CommandOptions) => {
  const { organizationId, organizationName } = commandOptions;

  console.log('Running sslyze on organization', organizationName);

  const liveWebsites = await getLiveWebsites(organizationId!, [], true);
  const queue = new PQueue({ concurrency: 5 });
  await Promise.all(liveWebsites.map((site) => queue.add(() => sslyze(site))));

  console.log(`sslyze finished for ${liveWebsites.length} domains`);
};
