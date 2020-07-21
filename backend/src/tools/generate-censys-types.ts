import axios from "axios";
import { compile } from "json-schema-to-typescript";
import * as fs from "fs";
import * as path from "path";

/**
 * Converts censys schema to JSON Schema.
 * @param data 
 */
function convertToJSONSchema(data) {
  const typeMap = {
    "STRING": "string",
    "BOOLEAN": "boolean",
    "INTEGER": "string", // number types are rendered as strings in the JSON data
    "NUMBER": "string",
    "TIMESTAMP": "string",
    "DATETIME": "string",
    "FLOAT": "number",
  };

  let schema;
  if (data.repeated) {
    schema = { type: "array", items: {}, description: data.doc };
    schema.items = convertToJSONSchema({...data, repeated: false});
  }
  if (data.fields) {
    schema = { type: "object", properties: {}, description: data.doc };
    for (let fieldName of Object.keys(data.fields)) {
      schema.properties[fieldName] = convertToJSONSchema(data.fields[fieldName]);
    }
  } else {
    if (!typeMap[data.type]) {
      console.error(data.type);
      throw new Error("Unrecognized type" + data.type);
    }
    schema = { type: typeMap[data.type], description: data.doc };
  }
  return schema;
}

/**
 * Generates typescript models from the Censys IPV4 BigQuery dataset schema.
 * Converts BigQuery schema -> JSON Schema -> typescript definition
 */
const generateCensysTypes = async () => {
  const { data, status, headers } = await axios.get("https://censys.io/static/data/definitions-ipv4-bq.json");
  const schema = convertToJSONSchema(data);
  const types = await compile(schema, "CensysIpv4Data", {
    bannerComment: `/* tslint:disable */\n/**\n* This file was automatically generated by json-schema-to-typescript.\n* DO NOT MODIFY IT BY HAND. Instead, run "npm run codegen" to regenerate this file.\n*/`
  });
  fs.writeFileSync(path.join(__dirname, "..", "models", "generated", "censysIpv4.ts"), types);
}

(async () => {
  await generateCensysTypes();
  process.exit();
})();
