import { Handler } from 'aws-lambda';
import { Organizations } from 'aws-sdk';
import { connectToDatabase, Organization } from '../models';
import {sendEmail} from '../api/helpers';

import { In, IsNull, Not } from 'typeorm';

import * as reports from '../api/reports';
import S3Client from './s3-client'
import ECSClient from './ecs-client';
import { getOrgMemberships } from '../api/auth';
import { isNull } from 'lodash';

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
    const result = await Organization.find()

    // for (const orgs in result) {
    //   const client = new S3Client();
    //   const reportsList = await client.listReports(orgs)
    //   console.log(reportsList)
    // }
    
      // Get list of organizations

    // Loop through organizations and pull reports
    result.forEach( async Element => {
      const client = new S3Client();
      const reportsList = await client.listReports(JSON.stringify(Element))
      console.log(reportsList)
      
    })
    


    // Loop through organizations and pull reports
    /**for ( let orgs = 0; orgs < result.length, orgs++;) {
      organizations += result[orgs] + ''
      const client = new S3Client();
      const reportsList = await client.listReports(JSON.stringify(organizations))
      //console.log(result)
      console.log(orgs)
    } 
    */
  
    
     /** 

    // List the latest reports 
    const orgId = JSON.parse(event.body!).currentOrganization.id;
    if (getOrgMemberships(event).includes(orgId)) {
      const client = new S3Client();
      const latestReports = await client.listReports(orgId);
      return {
        statusCode: 200,
        body: JSON.stringify(latestReports)
      };
    } else {
      return {
        statusCode: 404,
        body: 'User is not a member of this organization.'
      };
    }
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
  

  