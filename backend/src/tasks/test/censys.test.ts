import censys from "../censys";
jest.mock("../helpers/getDomains");
jest.mock("../helpers/saveDomainsToDb");

describe("censys", () => {
  test("basic test", async () => {
    await censys({
      organizationId: "organizationId",
      organizationName: "organizationName",
      scanId: "scanId",
      scanName: "scanName"
    })
  })
})