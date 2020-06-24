import { Handler } from "aws-lambda";
import axios from "axios";
import { connectToDatabase, Report } from "../models";
import * as uuid from "uuid";
import { InsertResult } from "typeorm";
import { isNotEmpty } from "class-validator";

const saveReport = async (reports: Report[]): Promise<Report> => {
  const { generatedMaps } = await Report.createQueryBuilder()
    .insert()
    .values(reports)
    .onConflict(
      `
      ("report_id") DO UPDATE
      SET "triaged" =excluded."triaged",
        "last_program_activity" =excluded."last_program_activity",
        "last_reporter_activity" = excluded."last_reporter_activity",
        "severity" = excluded."severity",
        "state" = excluded."state"
      `
    )
    .execute();
  return generatedMaps[0] as Report;
};

const fetchHackeroneData = async (url: string) => {
  const username = "crossfeed";
  const password = process.env.HO_API_KEY;
  console.log("[hackerone] Fetching reports");
  const { data, status } = await axios({
    url: url,
    method: "GET",
    headers: {
      Authorization:
        "Basic :" + Buffer.from(username + ":" + password).toString("base64"),
      "Content-Type": "application/json",
    },
    params: {
      "page[size]": "100",
    },
  });
  console.log(`[hackerone] status code ${status}`);
  return {
    data: data,
    next: data.links.next,
    last: data.links.last,
    cur: data.links.self,
  };
};

export const handler: Handler = async (event) => {
  await connectToDatabase();
  console.log("[hackerone] Sycning Reports from HackerOne");

  let max = Infinity;
  if (event) {
    const num = parseInt(event);
    if (num) {
      max = num;
    }
  }

  let next_url =
    "https://api.hackerone.com/v1/reports?filter%5Bprogram%5D%5B%5D=deptofdefense";
  let cur_url = next_url;
  let last_url = "";
  let count = 0;
  let processed = 0;
  let reports = new Array<Report>();
  while (cur_url != last_url && count < max) {
    const { data, next, last, cur } = await fetchHackeroneData(next_url);
    next_url = next;
    cur_url = cur;
    last_url = last;
    for (const d in data.data) {
      const r = new Report();
      r.report_id = data.data[d].id;
      r.title = data.data[d].attributes.title;
      r.created = data.data[d].attributes.created_at;
      r.desc = data.data[d].attributes.vulnerability_information;
      r.triaged = data.data[d].attributes.triaged_at;
      r.reported = data.data[d].attributes.first_reporter_activity_at;
      r.last_program_activity =
        data.data[d].attributes.last_program_activity_at;
      r.last_reporter_activity =
        data.data[d].attributes.last_reporter_activity_at;
      r.state = data.data[d].attributes.state;
      try {
        r.severity = data.data[d].relationships.severity.data.attributes.rating;
      } catch (err) {
        r.severity = "unknown";
      }
      reports.push(r);
      processed++;
    }
    saveReport(reports);
    reports = [];
    count++;
    console.log(`[hackerone] processed ${processed} reports`);
  }
  if (next_url == last_url) {
    console.log("[hackerone] Reached end of reports");
  }
  if (count == max) {
    console.log("[hackerone] Reached max page count");
  }
  console.log(`[hackerone] processed ${processed} reports total`);
};
