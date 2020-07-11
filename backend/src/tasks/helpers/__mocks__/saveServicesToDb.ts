import { Service } from "../../../models";

export default async (services: Service[]) => {
  expect(
    services.sort((a, b) => (a.service || "").localeCompare(b.service || ""))
  ).toMatchSnapshot("helpers.saveServicesToDb");
}