import findomain from "../findomain";
jest.mock("../helpers/getDomains");
jest.mock("../helpers/saveDomainsToDb");

describe("findomain", () => {
  test("basic test", () => {
    findomain({
      organizationId: "organizationId",
      organizationName: "organizationName",
      scanId: "scanId",
      scanName: "scanName"
    })
  })
})