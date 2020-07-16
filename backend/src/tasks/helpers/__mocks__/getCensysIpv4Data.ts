import * as fs from "fs";
import * as path from "path";

export default async () => {
  const results = fs.readFileSync(path.join(__dirname, "censysIpv4Sample.json"));
  return results.toString().split("\n").filter(e => e).map(e => JSON.parse(e));
}