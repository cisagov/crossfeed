import { Handler } from 'aws-lambda';
import { sendEmail } from '../api/helpers';
import { connectToDatabase, Organization, Role } from '../models';
import S3Client from './s3-client';

const sendReportEmail = async (email: string, organization?: Organization) => {
  await sendEmail(
    email,
    'New Report Available',
    `Hi there,

The latest report for ${
      organization?.name ? `is now available on ` : ''
    }Crossfeed. To view the report, sign on at ${process.env.FRONTEND_DOMAIN}

Crossfeed access instructions:

For more information on using Crossfeed, view the Crossfeed user guide at https://docs.crossfeed.cyber.dhs.gov/user-guide/quickstart/. 

If you encounter any difficulties, please feel free to reply to this email (or send an email to ${
      process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO
    }).`
  );
};

export const handler: Handler = async (event) => {
  await connectToDatabase();
  console.log('Running notifications check...');

  // Get all organizations
  const organizations = await Organization.find();

  for (const org in organizations) {
    const client = new S3Client();

    // pull reports list
    const reportsList = await client.listReports(organizations[org].id);
    // find org admin roles for each organization
    const roles = await Role.find({
      relations: ['user', 'organization'],
      where: {
        role: 'admin',
        organization: organizations[org]
      }
    });

    // loop through reports
    for (const report in reportsList) {

      if (reportsList[report].LastModified >= organizations[org].notifiedAt) {
        for (const role in roles) {
          // email reporting -- TODO need actual org name thats in database here
          if (roles[role].organization.name.startsWith('Web')) {
            await sendReportEmail(roles[role].user.email, organizations[org]);
            organizations[org].notifiedAt = new Date();

            // P&E
          } else if (roles[role].organization.name.startsWith('Posture')) {
            await sendReportEmail(roles[role].user.email, organizations[org]);
            organizations[org].notifiedAt = new Date();

            // VS
          } else if (
            roles[role].organization.name.startsWith('Vulnerability')
          ) {
            await sendReportEmail(roles[role].user.email, organizations[org]);
            organizations[org].notifiedAt = new Date();
          }
        }
      }
    }
  }
};
