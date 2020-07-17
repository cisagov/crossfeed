import { CensysIpv4Data } from "../../../models/generated/censysIpv4";

function* smtp(item: CensysIpv4Data) {
  if (item.p25?.smtp) {
    yield {
      port: 25,
      service: "smtp",
      banner: item.p25?.smtp?.starttls?.banner,
      censysMetadata: item.p25?.smtp?.starttls?.metadata
    };
  }
  if (item.p465?.smtp) {
    yield {
      port: 465,
      service: "smtp",
      banner: item.p465?.smtp?.tls?.banner,
      censysMetadata: item.p465?.smtp?.tls?.metadata
    };
  }
  if (item.p587?.smtp) {
    yield {
      port: 587,
      service: "smtp",
      banner: item.p587?.smtp?.starttls?.banner,
      censysMetadata: item.p587?.smtp?.starttls?.metadata,
    };
  }
}

export default smtp;