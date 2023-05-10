import { wrapHandler } from './helpers';
import S3Client from '../tasks/s3-client';
import { getOrgMemberships } from './auth';

/**
 * @swagger
 *
 * /reports/export:
 *  get:
 *    description: Export CyHy report by specifying the report name returned in /reports/list and the organization id. User must be a member of the organization.
 *    tags:
 *    - Reports
 */
export const export_report = wrapHandler(async (event) => {
  const Name = JSON.parse(event.body!).Name;
  const orgId = JSON.parse(event.body!).currentOrganization.id;
  if (getOrgMemberships(event).includes(orgId)) {
    const client = new S3Client();
    const url = await client.exportReport(Name, orgId);
    if (url == 'File does not exist') {
      return {
        statusCode: 404,
        body: 'File does not exist'
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ url })
    };
  } else {
    return {
      statusCode: 404,
      body: 'User is not a member of this organization.'
    };
  }
});

/**
 * @swagger
 *
 * /reports/list:
 *  get:
 *    description: Get a list of available P&E reports by specifying organization id. User must be a member of the organization.
 *    tags:
 *    - Reports
 */
export const list_reports = wrapHandler(async (event) => {
  const orgId = JSON.parse(event.body!).currentOrganization.id;
  console.log(orgId);
  if (getOrgMemberships(event).includes(orgId)) {
    const client = new S3Client();
    const data = await client.listReports(orgId);
    console.log(data);
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
