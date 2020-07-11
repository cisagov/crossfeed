import portscanner from "../portscanner";
jest.mock("../helpers/getIps");
jest.mock("../helpers/saveServicesToDb");

describe("portscanner", () => {
  test("basic test", async () => {
    await portscanner({
      organizationId: "organizationId",
      organizationName: "organizationName",
      scanId: "scanId",
      scanName: "scanName"
    })
  })
})