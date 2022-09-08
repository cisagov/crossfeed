import { wrapHandler } from './helpers';
import S3Client from '../tasks/s3-client';
import { getOrgMemberships } from './auth';

/**
 * @swagger
 *
 * /pe-reports/export:
 *  get:
 *    description: Export P&E report by specifying the S3 key returned in /pe-reports/list.
 *    tags:
 *    - Reports
 */
export const export_pe_report = wrapHandler(async (event) => {
  const Key = JSON.parse(event.body!).Key;
  const client = new S3Client();
  const url = await client.exportPeReport(Key);
  if (url == 'File does not exist') {
    return {
      statusCode: 404,
      body: ''
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ url })
  };
});

/**
 * @swagger
 *
 * /pe-reports/list:
 *  get:
 *    description: Get a list of available P&E reports by specifying organization id. User must be a member of the organization.
 *    tags:
 *    - Reports
 */
export const list_pe_reports = wrapHandler(async (event) => {
  const orgId = JSON.parse(event.body!).currentOrganization.id;
  const orgName = JSON.parse(event.body!).currentOrganization.name;
  console.log(orgName);
  console.log(getOrgMemberships(event));
  if (getOrgMemberships(event).includes(orgId)) {
    const client = new S3Client();
    const data = await client.listPeReports(orgName);
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } else {
    return {
      statusCode: 404,
      body: 'User is not a member of this organization.'
    };
  }
});
