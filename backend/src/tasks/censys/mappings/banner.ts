import { CensysIpv4Data } from "../../../models/generated/censysIpv4";
import smtp from "../services/smtp";

type BannerMap = {
  [x in keyof CensysIpv4Data]: (service: CensysIpv4Data[x]) => {
    service: string,
    banner?: string,
    censysMetadata?: {
      product?: string,
      revision?: string,
      description?: string,
      version?: string,
      manufacturer?: string
    }
  }
}

const httpMap = (e: CensysIpv4Data["p80"]) => ({
  service: "http",
  banner: e?.http?.get?.body,
  censysMetadata: e?.http?.get?.metadata,
});

const httpsMap = (e: CensysIpv4Data["p443"]) => ({
  service: "https",
  banner: e?.https?.get?.body,
  censysMetadata: e?.https?.get?.metadata,
});

const bannerMap: BannerMap = {
  p80: httpMap,
  p8888: httpMap,
  p8080: httpMap,
  p16992: httpMap,
  p443: httpsMap,
  p16993: httpsMap,
  p21: e => ({
    service: "ftp",
    banner: e?.ftp?.banner?.banner,
    censysMetadata: e?.ftp?.banner?.metadata,
  }),
  p22: e => ({
    service: "ssh",
    banner: e?.ssh?.v2?.banner?.raw,
    censysMetadata: e?.ssh?.v2?.metadata
  }),
  p23: e => ({
    service: "telnet",
    banner: e?.telnet?.banner?.banner,
    censysMetadata: e?.telnet?.banner?.metadata
  }),
  p25: e => ({
    service: "smtp",
    banner: e?.smtp?.starttls?.banner,
    censysMetadata: e?.smtp?.starttls?.metadata
  }),
  p465: e => ({
    service: "smtp",
    banner: e?.smtp?.tls?.banner,
    censysMetadata: e?.smtp?.tls?.metadata
  }),
  p587: e => ({
    service: "smtp",
    banner: e?.smtp?.starttls?.banner,
    censysMetadata: e?.smtp?.starttls?.metadata
  }),
  p3306: e => ({
    service: "mysql",
    banner: e?.mysql?.banner?.server_version,
    censysMetadata: e?.mysql?.banner?.metadata
  })
  // p102: e => e?.s7?.szl?.system,
  // p11211: e => e?.memcached?.banner?.stats,
  // p25: service => service?.smtp?.starttls?.banner,
}
export default bannerMap;