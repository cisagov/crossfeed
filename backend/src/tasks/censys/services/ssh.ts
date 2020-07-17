import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* ssh(item: CensysIpv4Data) {
  if (item.p22?.ssh) {
    return {
      port: 22,
      service: "ssh",
      banner: item.p22.ssh.v2?.banner?.raw,
      censysMetadata: item.p22.ssh.v2?.metadata
    };
  }
}

export default ssh;