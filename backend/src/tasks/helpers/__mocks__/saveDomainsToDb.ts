import { Domain } from "../../../models";

export default async (domains: Domain[]) => {
  expect(
    domains.sort((a, b) => a.name.localeCompare(b.name))
  ).toMatchSnapshot("helpers.saveDomainsToDb");
}