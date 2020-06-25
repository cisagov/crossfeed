import { Handler } from 'aws-lambda';
import axios from 'axios';
import {
  connectToDatabase,
  Domain,
  Service,
  SSLInfo,
  WebInfo
} from '../models';
import * as uuid from 'uuid';
import { InsertResult } from 'typeorm';
import { isNotEmpty } from 'class-validator';

interface FetchDataOpts {
  limit: number;
  offset: number;
}

interface BDAsset {
  'bd.ip_address': string;
  'bd.original_hostname'?: string;
  'bd.hostname': string;
  'ipgeo.country'?: string;
  asn_number?: string;
  'screenshot.screenshot'?: string;

  'ports.ports': number[];
  'ports.lastseen': string[];
  'ports.services': string[];

  'ssl.protocol'?: string;
  'ssl.valid_to'?: string;
  'ssl.valid_from'?: string;
  'ssl.issuer_O'?: string;
  'ssl.issuer_CN'?: string;
  'ssl.subjectaltname'?: string[];
  'ssl.bits'?: number;
  'ssl.fingerprint'?: string;

  'wtech.Web Frameworks'?: string[];
  'wtech.Content Management Systems'?: string[];
  'wtech.Widgets'?: string[];
  'wtech.Font Scripts'?: string[];
  'wtech.Analytics'?: string[];
  'wtech.Javascript Frameworks'?: string[];
  'wtech.Web Servers'?: string[];
  'wtech.Operating Systems'?: string[];
  'wtech.socialurls'?: string[];
  'wtech.gakeys'?: string[];
}

interface BDAPIResponse {
  total: number;
  assets: BDAsset[];
}

const joinOrNull = (value?: (string | null)[] | null) => {
  if (value) {
    return value.filter(isNotEmpty).join(',');
  }
  return null;
};

const fetchBitdisoveryData = async (opts: FetchDataOpts) => {
  const { limit, offset } = opts;
  console.log(`[bitdiscovery] fetching at offset ${offset}`);
  const { data, status } = await axios({
    url: 'https://bitdiscovery.com/api/1.0/inventory',
    params: {
      limit,
      offset,
      inventory: true
    },
    method: 'POST',
    headers: {
      Authorization: process.env.BD_API_KEY,
      'Content-Type': 'application/json'
    },
    data: [
      {
        column: 'bd.original_hostname',
        type: 'ends with',
        value: '.mil'
      },
      { column: 'ports.ports', type: 'has any value' }
    ]
  });
  console.log(`[bitdiscovery] status code ${status}`);
  return data as BDAPIResponse;
};

const parseDomainFromAsset = (asset: BDAsset) => {
  const domain = new Domain();
  domain.id = uuid.v4();
  domain.ip = asset['bd.ip_address'];
  domain.name = asset['bd.original_hostname'] ?? asset['bd.hostname'];
  domain.asn = asset['asn_number'] ? asset['asn_number'].toString() : null;
  domain.country = asset['ipgeo.country'] ?? null;
  const bdScreenshot = asset['screenshot.screenshot'];
  const screenshot = bdScreenshot !== 'no' ? bdScreenshot : null;
  domain.screenshot = screenshot ?? null;

  return domain;
};

const parseServicesFromAsset = (asset: BDAsset, domain: Domain): Service[] => {
  return asset['ports.ports'].map((port, idx) => {
    const service = new Service();
    service.domain = domain;
    service.port = port.toString();
    service.lastSeen = asset['ports.lastseen'][idx] ?? null;
    service.banner = asset['ports.banners'][idx] || null;
    service.service = asset['ports.services'][idx] || null;
    return service;
  });
};

const parseSSLInfoFromAsset = (
  asset: BDAsset,
  domain: Domain
): SSLInfo | null => {
  const info = new SSLInfo();
  info.protocol = asset['ssl.protocol'] ?? null;
  if (!info.protocol) {
    return null;
  }
  info.issuerOrg = asset['ssl.issuer_O'] ?? null;
  info.issuerCN = asset['ssl.issuer_CN'] ?? null;
  info.validTo = asset['ssl.valid_to'] ?? null;
  info.validFrom = asset['ssl.valid_from'] ?? null;
  info.bits = asset['ssl.bits'] ? asset['ssl.bits'].toString() : null;
  info.fingerprint = asset['ssl.fingerprint'] ?? null;
  info.altNames = joinOrNull(asset['ssl.subjectaltname']);
  info.domain = domain;
  return info;
};

const parseWebInfoFromAsset = (
  asset: BDAsset,
  domain: Domain
): WebInfo | null => {
  const info = new WebInfo();
  info.domain = domain;
  info.frameworks = joinOrNull([
    joinOrNull(asset['wtech.gakeys.wtech.Web Frameworks']),
    joinOrNull(asset['wtech.Javascript Frameworks'])
  ]);
  info.cms = joinOrNull(asset['wtech.Content Management Systems']);
  info.widgets = joinOrNull(asset['wtech.Widgets']);
  info.fonts = joinOrNull(asset['wtech.Font Scripts']);
  info.analytics = joinOrNull(asset['wtech.Analytics']);
  info.webServers = joinOrNull(asset['wtech.Web Servers']);
  info.operatingSystems = joinOrNull(asset['wtech.Operating Systems']);
  info.socialUrls = joinOrNull(asset['wtech.socialurls']);
  info.gaKeys = joinOrNull(asset['wtech.gakeys']);
  if (info.frameworks || info.cms || info.analytics || info.webServers) {
    return info;
  }
  return null;
};

const saveDomainToDb = async (domain: Domain): Promise<Domain> => {
  const { generatedMaps } = await Domain.createQueryBuilder()
    .insert()
    .values(domain)
    .onConflict(
      `
      ("name","ip") DO UPDATE 
      SET "screenshot" = excluded."screenshot",
          "asn" = excluded."asn",
          "country" = excluded."country",
          "updatedAt" = now()
    `
    )
    .execute();
  return generatedMaps[0] as Domain;
};

const saveServicesToDb = (services: Service[]): Promise<InsertResult> =>
  Service.createQueryBuilder()
    .insert()
    .values(services)
    .onConflict(
      `
      ("domainId","port") DO UPDATE
      SET "lastSeen" = excluded."lastSeen",
          "banner" = excluded."banner",
          "service" = excluded."service"
    `
    )
    .execute();

const saveSSLInfosToDb = (info: SSLInfo): Promise<InsertResult> =>
  SSLInfo.createQueryBuilder()
    .insert()
    .values(info)
    .onConflict(
      `
      ("domainId") DO UPDATE
      SET "protocol" = excluded."protocol",
          "issuerOrg" = excluded."issuerOrg",
          "issuerCN" = excluded."issuerCN",
          "validFrom" = excluded."validFrom",
          "validTo" = excluded."validTo",
          "altNames" = excluded."altNames",
          "fingerprint" = excluded."fingerprint"
    `
    )
    .execute();

const saveWebInfoToDb = (info: WebInfo): Promise<InsertResult> =>
  WebInfo.createQueryBuilder()
    .insert()
    .values(info)
    .onConflict(
      `
      ("domainId") DO UPDATE
        SET "frameworks" = excluded."frameworks",
            "cms" = excluded."cms",
            "widgets" = excluded."widgets",
            "fonts" = excluded."fonts",
            "analytics" = excluded."analytics",
            "webServers" = excluded."webServers",
            "operatingSystems" = excluded."operatingSystems",
            "socialUrls" = excluded."socialUrls",
            "gaKeys" = excluded."gaKeys"
    `
    )
    .execute();

const saveAsset = async (asset: BDAsset) => {
  const parsedDomain = parseDomainFromAsset(asset);
  const domain = await saveDomainToDb(parsedDomain);

  const parsedServices = parseServicesFromAsset(asset, domain);
  await saveServicesToDb(parsedServices);

  const parsedSSLInfo = parseSSLInfoFromAsset(asset, domain);
  if (parsedSSLInfo) {
    await saveSSLInfosToDb(parsedSSLInfo);
  }

  const parsedWebInfo = parseWebInfoFromAsset(asset, domain);
  if (parsedWebInfo) {
    await saveWebInfoToDb(parsedWebInfo);
  }
};

export const handler: Handler = async (event) => {
  await connectToDatabase();
  const limit = 500;
  let offset = 0;
  let totalCount = Infinity;
  let maxCount = Infinity;

  if (event) {
    const num = parseInt(event);
    if (num) {
      maxCount = num;
    }
  }

  while (offset < totalCount && offset < maxCount) {
    const { assets, total } = await fetchBitdisoveryData({
      limit,
      offset
    });

    for (const asset of assets) {
      await saveAsset(asset);
    }

    totalCount = total;
    offset += limit;
    console.log(
      `[bitdiscovery] fetched and parsed ${offset}/${total} bitdiscovery assets`
    );
  }
};
