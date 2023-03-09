import { Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { list_reports } from 'src/api/reports';
import {
  connectToDatabase,
  Organization,
  User,
  Role,
  UserType
} from '../models';
import S3Client from './s3-client';
import s3Client from './__mocks__/s3-client';

const sendReportEmail = async (email: string, organization?: Organization) => {
  //console.log("Email: " + email, "Organization: " + organization?.name)
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
    const list = JSON.stringify(reportsList)
    // find org admin roles for each organization
    const roles = await Role.find(
      {
        relations: ['user', 'organization'],
        where: {
          role: 'admin',
          organization: organizations[org],
        },
      }
    );

    // loop through reports 
    for (const report in reportsList) {
      console.log(list)

      if (reportsList[report].LastModified >= organizations[org].notifiedAt){
      for (const role in roles) {
    
      // email reporting -- TODO need actual org name thats in database here
      if (roles[role].organization.name.startsWith('WAS')) {
            // TODO - pulling orgadmin email to send emails
            await sendReportEmail(roles[role].user.email, organizations[org]);
            organizations[org].notifiedAt = new Date()

        // P&E
      } else if (roles[role].organization.name.startsWith('P&E')) {
           await sendReportEmail(roles[role].user.email, organizations[org]);  
           organizations[org].notifiedAt = new Date()

        // VS
      } else if (roles[role].organization.name.startsWith('VS')) {
           await sendReportEmail(roles[role].user.email, organizations[org]);
           organizations[org].notifiedAt = new Date()

    }
    }
  }
  } 
  
  }

};
