import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function *http(item: CensysIpv4Data) {
  if (item.p8080?.http?.get) {
   return {
      port: 8080,
      service: "http",
      banner: item.p8080?.http?.get?.body,
      censysMetadata: item.p8080?.http?.get?.metadata,
   };
  }
  if (item.p8888?.http?.get) {
    yield {
      port: 8888,
      service: "http",
      banner: item.p8888?.http?.get?.body,
      censysMetadata: item.p8888?.http?.get?.metadata,
    };
  }
  if (item.p80?.http?.get) {
    yield {
      port: 80,
      service: "http",
      banner: item.p80?.http?.get?.body,
      censysMetadata: item.p80?.http?.get?.metadata,
    };
  }
  if (item.p16992?.http?.get) {
    yield {
      port: 16992,
      service: "http",
      banner: item.p16992?.http?.get?.body,
      censysMetadata: item.p16992?.http?.get?.metadata,
    };
  }
}

export default http;