import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* rdp(item: CensysIpv4Data) {
  if (item.p3389?.rdp) {
    yield {
      port: 3389,
      service: "rdp",
      censysMetadata: item.p3389.rdp.banner?.metadata
    };
  }
}

export default rdp;