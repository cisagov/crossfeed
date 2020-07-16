import { handler as censysIpv4 } from '../censysIpv4';
import axios from "axios";
import * as fs from "fs";
jest.mock('../helpers/getCensysIpv4Data');

const typeMap = {
  "STRING": "string",
  "INTEGER": "integer",
  "BOOLEAN": "boolean",
  "NUMBER": "number",
  "TIMESTAMP": "string",
  "DATETIME": "string",
  "FLOAT": "number",
}

function convertToJSONSchema(data) {
  let schema;
  if (data.repeated) {
    schema = { type: "array", items: {} };
    schema.items = convertToJSONSchema({...data, repeated: false});
  }
  if (data.fields) {
    schema = { type: "object", properties: {} };
    for (let fieldName of Object.keys(data.fields)) {
      schema.properties[fieldName] = convertToJSONSchema(data.fields[fieldName]);
    }
  } else {
    if (!typeMap[data.type]) {
      throw data;
    }
    schema = { type: typeMap[data.type] };
  }
  return schema;

}

describe('censys banners', () => {
  test('basic test', async () => {
    // https://bcherny.github.io/json-schema-to-typescript-browser/
    const { data, status, headers } = await axios.get("https://censys.io/static/data/definitions-ipv4-bq.json");
    const schema = convertToJSONSchema(data);
    schema.title = "CensysIpv4Data";
    fs.writeFileSync(__dirname + "/censysIpv4JSONSchema.json", JSON.stringify(schema, null, 2));

    // npm i -g json-schema-to-typescript
    // npm test censysipv4
    // json2ts /Users/epicfaace/cisa/crossfeed/backend/src/tasks/test/censysIpv4JSONSchema.json > censysIpv4.d.ts

    // await censysIpv4({
    //   organizationId: 'organizationId',
    //   organizationName: 'organizationName',
    //   scanId: 'scanId',
    //   scanName: 'scanName',
    //   scanTaskId: 'scanTaskId'
    // });
  });
});
