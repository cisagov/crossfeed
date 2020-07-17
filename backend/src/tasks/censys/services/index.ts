import http from "./http";
import https from "./https";
import smtp from "./smtp";
import ftp from "./ftp";
import rdp from "./rdp";
import ssh from "./ssh";

export function* getServices(item: CensysIpv4Data) {
  yield* http(item);
  yield* https(item);
  yield* smtp(item);
  yield* ftp(item);
  yield* rdp(item);
  yield* ssh(item);
}