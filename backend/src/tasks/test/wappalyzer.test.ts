import wappalyzer from "../wappalyzer";
jest.mock("../helpers/getLiveWebsites");
jest.mock("../helpers/saveDomainsToDb");

describe("wappalyzer", () => {
  test("basic test", async () => {
    await wappalyzer({
      organizationId: "organizationId",
      organizationName: "organizationName",
      scanId: "scanId",
      scanName: "scanName"
    })
  })
})