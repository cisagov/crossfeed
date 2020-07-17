import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* ftp(item: CensysIpv4Data) {
  if (item.p21?.ftp) {
    yield {
      port: 21,
      service: "ftp",
      banner: item.p21.ftp.banner?.banner,
      censysMetadata: item.p21.ftp.banner?.metadata,
    };
  }
}

export default ftp;