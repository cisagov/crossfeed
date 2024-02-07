import { Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { connectToDatabase, User, UserType } from '../models';
import { subDays, formatISO } from 'date-fns';
import { sendEmail } from '../api/helpers';
import { getRepository } from 'typeorm';

const cognito = new AWS.CognitoIdentityServiceProvider();
const userPoolId = process.env.REACT_APP_USER_POOL_ID!;
const ses = new AWS.SES({ region: 'us-east-1' }); // Assuming SES for email notifications

export const handler: Handler = async (event) => {
  await connectToDatabase(true);

  const today = new Date();
  const cutoff30Days = subDays(today, 30);
  const cutoff45Days = subDays(today, 45);
  const cutoff90Days = subDays(today, 90);

  // Format dates for database querying
  const formattedCutoff30Days = formatISO(cutoff30Days, {
    representation: 'date'
  });
  const formattedCutoff45Days = formatISO(cutoff45Days, {
    representation: 'date'
  });
  const formattedCutoff90Days = formatISO(cutoff90Days, {
    representation: 'date'
  });

  // Users to notify (30 days of inactivity)
  const usersToNotify = await User.find({
    where: {
      lastLoggedIn: {
        lt: formattedCutoff30Days, // Less than 30 days ago
        gte: formattedCutoff45Days // Greater than or equal to 45 days ago
      }
    }
  });

  // Notify users of inactivity (30 days)
  for (const user of usersToNotify) {
    const subject = 'Account Inactivity Notice';
    const textBody = `Hello ${user.fullName},\n\nYour account has been
     inactive for over 30 days. If your account reaches 45 days of inactivity,
      your password will be reset, requiring action to reactivate your account.`;
    await sendEmail(user.email, subject, textBody);
  }

  // Users to deactivate (45 days of inactivity)
  const usersToDeactivate = await User.find({
    where: {
      lastLoggedIn: {
        lt: formattedCutoff30Days, // Less than 30 days ago
        gte: formattedCutoff45Days // Greater than or equal to 45 days ago
      }
    }
  });

  // Notify users of inactivity (45 days)
  for (const user of usersToDeactivate) {
    const subject = 'Account Deactiveation Notice';
    const textBody = `Hello ${user.fullName},\n\nYour account has been
     inactive for over 45 days. If your account reaches 90 days of inactivity,
      your password will be removed, requiring action to recreate your account.`;
    await sendEmail(user.email, subject, textBody);
  }

  // Users to remove (90 days of inactivity)
  const usersToRemove = await User.find({
    where: {
      lastLoggedIn: `<${formattedCutoff90Days}`
    }
  });

  // Notify users of inactivity (90 days)
  for (const user of usersToRemove) {
    const subject = 'Account Deactiveation Notice';
    const textBody = `Hello ${user.fullName},\n\nYour account has been
     inactive for over 90 days. If your account has been removed, requiring
      action to recreate your account.`;
    await sendEmail(user.email, subject, textBody);
  }

  // Deactivate users (reset password)
  for (const user of usersToDeactivate) {
    try {
      await cognito
        .adminSetUserPassword({
          Password: 'TemporaryPassword1!', // Set a new temporary password
          UserPoolId: userPoolId,
          Username: user.cognitoId,
          Permanent: false // Requires the user to change their password at next login
        })
        .promise();
      console.log(
        `Password reset for user ${user.id} due to 45 days of inactivity.`
      );
    } catch (error) {
      console.error(`Error resetting password for user ${user.id}: ${error}`);
    }
  }

  // Notify and remove users (90 days of inactivity)
  for (const user of usersToRemove) {
    const subject = 'Account Deactivation Notice';
    const textBody = `Hello ${user.fullName},\n\nYour account has been
     inactive for over 90 days and has been removed. You will need to recreate
      your account if you wish to use our services again.`;
    await sendEmail(user.email, subject, textBody);

    try {
      // Remove the user from Cognito
      await cognito
        .adminDeleteUser({
          UserPoolId: userPoolId,
          Username: user.cognitoId
        })
        .promise();

      // Remove the user from your database
      await getRepository(User).remove(user); // Correctly placed inside async handler

      console.log(`Removed user ${user.id} due to 90 days of inactivity.`);
    } catch (error) {
      console.error(`Error removing user ${user.id}: ${error}`);
    }
  }
};
