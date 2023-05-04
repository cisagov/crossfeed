import { CensysIpv4Data } from '../../models/generated/censysIpv4';

type Mapping = {
  [x in keyof CensysIpv4Data]: (service: CensysIpv4Data[x]) => {
    banner?: string | null;
    censysMetadata?: {
      product?: string;
      revision?: string;
      description?: string;
      version?: string;
      manufacturer?: string;
    };
  };
};

const httpMap = (e: CensysIpv4Data['p80']) => ({
  banner: e?.http?.get?.body,
  censysMetadata: e?.http?.get?.metadata
});

const httpsMap = (e: CensysIpv4Data['p443']) => ({
  banner: e?.https?.get?.body,
  censysMetadata: e?.https?.get?.metadata
});

const vncMap = (e: CensysIpv4Data['p5900']) => ({
  banner: null,
  censysMetadata: e?.vnc?.banner?.metadata
});

export const mapping: Mapping = {
  p80: httpMap,
  p8888: httpMap,
  p8080: httpMap,
  p16992: httpMap,
  p443: httpsMap,
  p16993: httpsMap,
  p21: (e) => ({
    banner: e?.ftp?.banner?.banner,
    censysMetadata: e?.ftp?.banner?.metadata
  }),
  p22: (e) => ({
    banner: e?.ssh?.v2?.banner?.raw,
    censysMetadata: e?.ssh?.v2?.metadata
  }),
  p23: (e) => ({
    banner: e?.telnet?.banner?.banner,
    censysMetadata: e?.telnet?.banner?.metadata
  }),
  p25: (e) => ({
    banner: e?.smtp?.starttls?.banner,
    censysMetadata: e?.smtp?.starttls?.metadata
  }),
  p53: (e) => ({
    banner: null,
    censysMetadata: e?.dns?.lookup?.metadata
  }),
  p465: (e) => ({
    banner: e?.smtp?.tls?.banner,
    censysMetadata: e?.smtp?.tls?.metadata
  }),
  p587: (e) => ({
    banner: e?.smtp?.starttls?.banner,
    censysMetadata: e?.smtp?.starttls?.metadata
  }),
  p102: (e) => ({
    banner: null,
    censysMetadata: e?.s7?.szl?.metadata
  }),
  p110: (e) => ({
    banner: e?.pop3?.starttls?.banner,
    censysMetadata: e?.pop3?.starttls?.metadata
  }),
  p161: (e) => ({
    banner: null,
    censysMetadata: e?.snmp?.banner?.metadata
  }),
  p143: (e) => ({
    banner: e?.imap?.starttls?.banner,
    censysMetadata: e?.imap?.starttls?.metadata
  }),
  p445: (e) => ({
    banner: null,
    censysMetadata: e?.smb?.banner?.metadata
  }),
  p502: (e) => ({
    banner: null,
    censysMetadata: e?.modbus?.device_id?.metadata
  }),
  p623: (e) => ({
    banner: e?.ipmi?.banner?.raw,
    censysMetadata: e?.ipmi?.banner?.metadata
  }),
  p631: (e) => ({
    banner: null,
    censysMetadata: e?.ipp?.banner?.metadata
  }),
  p993: (e) => ({
    banner: e?.imaps?.tls?.banner,
    censysMetadata: e?.imaps?.tls?.metadata
  }),
  p995: (e) => ({
    banner: e?.pop3s?.tls?.banner,
    censysMetadata: e?.pop3s?.tls?.metadata
  }),
  p1433: (e) => ({
    banner: null,
    censysMetadata: e?.mssql?.banner?.metadata
  }),
  p1521: (e) => ({
    banner: null,
    censysMetadata: e?.oracle?.banner?.metadata
  }),
  p1883: (e) => ({
    banner: null,
    censysMetadata: e?.mqtt?.banner?.metadata
  }),
  p8883: (e) => ({
    banner: null,
    censysMetadata: e?.mqtt?.banner?.metadata
  }),
  p1900: (e) => ({
    banner: null,
    censysMetadata: e?.upnp?.discovery?.metadata
  }),
  p1911: (e) => ({
    banner: null,
    censysMetadata: e?.fox?.device_id?.metadata
  }),
  p2323: (e) => ({
    banner: e?.telnet?.banner?.banner,
    censysMetadata: e?.telnet?.banner?.metadata
  }),
  p3306: (e) => ({
    banner: null,
    censysMetadata: e?.mysql?.banner?.metadata
  }),
  p3389: (e) => ({
    banner: null,
    censysMetadata: e?.rdp?.banner?.metadata
  }),
  p5432: (e) => ({
    banner: null,
    censysMetadata: e?.postgres?.banner?.metadata
  }),
  p5632: (e) => ({
    banner: null,
    censysMetadata: e?.pca?.banner?.metadata
  }),
  p5672: (e) => ({
    banner: null,
    censysMetadata: e?.amqp?.banner?.metadata
  }),
  p5900: vncMap,
  p5901: vncMap,
  p5902: vncMap,
  p5903: vncMap,
  p6379: (e) => ({
    banner: null,
    censysMetadata: e?.redis?.banner?.metadata
  }),
  p6443: (e) => ({
    banner: null,
    censysMetadata: e?.kubernetes?.banner?.metadata
  }),
  p7547: (e) => ({
    banner: e?.cwmp?.get?.body,
    censysMetadata: e?.cwmp?.get?.metadata
  }),
  p9090: (e) => ({
    banner: null,
    censysMetadata: e?.prometheus?.banner?.metadata
  }),
  p9200: (e) => ({
    banner: null,
    censysMetadata: e?.elasticsearch?.banner?.metadata
  }),
  p11211: (e) => ({
    banner: null,
    censysMetadata: e?.memcached?.banner?.metadata
  }),
  p20000: (e) => ({
    banner: null,
    censysMetadata: e?.dnp3?.status?.metadata
  }),
  p27017: (e) => ({
    banner: null,
    censysMetadata: e?.mongodb?.banner?.metadata
  }),
  p47808: (e) => ({
    banner: null,
    censysMetadata: e?.bacnet?.device_id?.metadata
  })
};
