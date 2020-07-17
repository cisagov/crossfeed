import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* smb(item: CensysIpv4Data) {
  if (item.p445?.smb) {
    yield {
      port: 445,
      service: "smb",
      censysMetadata: item.p445.smb.banner?.metadata
    };
  }
}

export default smb;