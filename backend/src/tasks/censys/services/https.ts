import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* https(item: CensysIpv4Data) {
  if (item.p443?.https) {
    yield {
      port: 443,
      service: "https",
      banner: item.p443?.https?.get?.body,
      censysMetadata: item.p443?.https?.get?.metadata
    };
  }
  if (item.p16993?.https) {
    yield {
      port: 16993,
      service: "https",
      banner: item.p16993?.https?.get?.body,
      censysMetadata: item.p16993?.https?.get?.metadata
    };
  }
}

export default https;