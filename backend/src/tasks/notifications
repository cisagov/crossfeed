import { Handler } from 'aws-lambda';
import { Organizations } from 'aws-sdk';
import { connectToDatabase, Organization } from '../models';
import {sendEmail} from '../api/helpers';
import * as reports from '../api/reports';
import S3Client from './s3-client'
import { getOrgMemberships } from '../api/auth';

/**
 *  class Notifications {
  s3: S3Client;
  existingReports;
  organizations: Organization [];
  lastNotified: Date;

  constructor() {}

  async initialize({
    existingReports,
    organizations,
    lastNotified

  }: {
    existingReports
    organizations: Organization [];
    lastNotified: Date;
  }) {
    this.s3 = new S3Client();
    this.existingReports = await this.s3.listReports('data');
    this.organizations = organizations;
    this.lastNotified = lastNotified;
  }

}
 */

const sendReportEmail = async (email: string, organization?: Organization) => {
  
  await sendEmail(
    email,
    'New Report Available',
    `Hi there,

The latest report for ${
      organization?.name ? `is now available on ` : ''
    }Crossfeed. To view the report, sign on at ${
      process.env.FRONTEND_DOMAIN
    }

Crossfeed access instructions:

For more information on using Crossfeed, view the Crossfeed user guide at https://docs.crossfeed.cyber.dhs.gov/user-guide/quickstart/. 

If you encounter any difficulties, please feel free to reply to this email (or send an email to ${
      process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO
    }).`
  );
};


export const handler: Handler = async (event) => {
    await connectToDatabase();
    console.log('Running notifications check...')

    // List the latest reports 
    const orgId = JSON.parse(event.body!).currentOrganization.id;
    const client = new S3Client();
    const latestReports = await client.listReports(orgId);
    return {
      body: JSON.stringify(latestReports)
    }

    console.log(latestReports)

    /** 
    //const firstNotified 
    const prev_latestReports = latestReports

   
    // If the existing reports are not the same as the previous reports, send email and update lastNotified
    if (prev_latestReports.length < latestReports.length) {
      await sendReportEmail(email, organization);
       const lastNotified = new Date()

       if (lastNotified != null) {
        return lastNotified
       }
 
     }
*/

  };
  

  