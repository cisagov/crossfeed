import { Handler } from 'aws-lambda';
import { connectToDatabase, Organization, User, Role, UserType } from '../models';
import {sendEmail} from '../api/helpers';
import S3Client from './s3-client'
import {isOrgAdmin} from '../api/auth'

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
    
    // created to test if admin can be found
    const firstName = ' first name';
    const lastName = 'last name';
    const email = Math.random() + '@crossfeed.cisa.gov'; 
     await User.create ({
      firstName,
      lastName,
      email,
      userType: UserType.GLOBAL_ADMIN
      }).save();  
    
   // Get all organizations
    const organizations = await Organization.find()
      
     for (const org in organizations) {
       const client = new S3Client();
       // pull reports list 
       const reportsList = await client.listReports(organizations[org].id)
       //find all global admin users only
       const users = await User.find({
        userType: UserType.GLOBAL_ADMIN
         })
         // loop through reports and send email notification
       for (const report in reportsList) {

      // email reporting -- TODO need actual org name thats in database here
        if (organizations[org].name.startsWith("WAS") ){
          for ( const user in users) {
            // TODO - check for proper use of isOrgAdmin, testing ?
            if (isOrgAdmin(event)) {
              await sendReportEmail('123@crossfeed.cisa.gov', organizations[org])
            }
          }
        // P&E 
         } else if (organizations[org].name.startsWith("P&E")){
          for ( const user in users) {
            if (isOrgAdmin(event)) {
              await sendReportEmail(users[user].email, organizations[org])
            }
          }
        // VS
         } else if (organizations[org].name.startsWith("VS")){
          for ( const user in users) {
            if (isOrgAdmin(event)) {
              await sendReportEmail(users[user].email, organizations[org])
            }
          }
         }
      }
       
     }
    
  

  };
  

  