import {
  IsString,
  isUUID,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsEnum
} from 'class-validator';
import { User, connectToDatabase, Role, Organization, ApiKey } from '../models';
import {
  validateBody,
  wrapHandler,
  NotFound,
  Unauthorized,
  sendEmail
} from './helpers';
import { UserType } from '../models/user';
import {
  getUserId,
  canAccessUser,
  isGlobalViewAdmin,
  isOrgAdmin,
  isGlobalWriteAdmin
} from './auth';

/**
 * @swagger
 *
 * /users/{id}:
 *  delete:
 *    description: Delete a particular user.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: User id
 *    tags:
 *    - Users
 */
export const del = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const result = await User.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

/**
 * @swagger
 *
 * /users/{id}:
 *  put:
 *    description: Update a particular user.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: User id
 *    tags:
 *    - Users
 */
export const update = wrapHandler(async (event) => {
  if (!canAccessUser(event, event.pathParameters?.userId)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewUser, event.body);
  if (!isGlobalWriteAdmin(event) && body.userType) {
    // Non-global admins can't set userType
    return Unauthorized;
  }
  const user = await User.findOne(
    {
      id: id
    },
    {
      relations: ['roles', 'roles.organization']
    }
  );
  if (user) {
    user.firstName = body.firstName ?? user.firstName;
    user.lastName = body.lastName ?? user.lastName;
    user.fullName = user.firstName + ' ' + user.lastName;
    user.userType = body.userType ?? user.userType;
    await User.save(user);
    return {
      statusCode: 200,
      body: JSON.stringify(user)
    };
  }
  return NotFound;
});

class NewUser {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  organization: string;

  @IsBoolean()
  @IsOptional()
  organizationAdmin: string;

  @IsEnum(UserType)
  @IsOptional()
  userType: UserType;
}

const sendInviteEmail = async (email: string, organization?: Organization) => {
  const staging = process.env.NODE_ENV !== 'production';

  await sendEmail(
    email,
    'Crossfeed Invitation',
    `Hi there,

You've been invited to join ${
      organization?.name ? `the ${organization?.name} organization on ` : ''
    }Crossfeed. To accept the invitation and start using Crossfeed, sign on at ${
      process.env.FRONTEND_DOMAIN
    }/signup.

Crossfeed access instructions:

1. Visit ${process.env.FRONTEND_DOMAIN}/signup.
2. Select "Create Account."
3. Enter your email address and a new password for Crossfeed.
4. A confirmation code will be sent to your email. Enter this code when you receive it.
5. You will be prompted to enable MFA. Scan the QR code with an authenticator app on your phone, such as Microsoft Authenticator. Enter the MFA code you see after scanning.
6. After configuring your account, you will be redirected to Crossfeed.

For more information on using Crossfeed, view the Crossfeed user guide at https://docs.crossfeed.cyber.dhs.gov/user-guide/quickstart/. 

If you encounter any difficulties, please feel free to reply to this email (or send an email to ${
      process.env.CROSSFEED_SUPPORT_EMAIL_REPLYTO
    }).`
  );
};

/**
 * @swagger
 *
 * /users:
 *  post:
 *    description: Invite a new user.
 *    tags:
 *    - Users
 */
export const invite = wrapHandler(async (event) => {
  const body = await validateBody(NewUser, event.body);
  // Invoker must be either an organization or global admin
  if (body.organization) {
    if (!isOrgAdmin(event, body.organization)) return Unauthorized;
  } else {
    if (!isGlobalWriteAdmin(event)) return Unauthorized;
  }
  if (!isGlobalWriteAdmin(event) && body.userType) {
    // Non-global admins can't set userType
    return Unauthorized;
  }

  await connectToDatabase();

  body.email = body.email.toLowerCase();

  // Check if user already exists
  let user = await User.findOne({
    email: body.email
  });

  let organization: Organization | undefined;

  if (body.organization) {
    organization = await Organization.findOne(body.organization);
  }

  if (!user) {
    user = await User.create({
      invitePending: true,
      ...body
    });
    await User.save(user);
    await sendInviteEmail(user.email, organization);
  } else if (!user.firstName && !user.lastName) {
    // Only set the user first name and last name the first time the user is invited.
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    await User.save(user);
  }

  // Always update the userType, if specified in the request.
  if (body.userType) {
    user.userType = body.userType;
    await User.save(user);
  }

  if (organization) {
    // Create approved role if organization supplied
    await Role.createQueryBuilder()
      .insert()
      .values({
        user: user,
        organization: { id: body.organization },
        approved: true,
        createdBy: { id: event.requestContext.authorizer!.id },
        approvedBy: { id: event.requestContext.authorizer!.id },
        role: body.organizationAdmin ? 'admin' : 'user'
      })
      .onConflict(
        `
      ("userId", "organizationId") DO UPDATE
      SET "role" = excluded."role",
          "approved" = excluded."approved",
          "approvedById" = excluded."approvedById"
    `
      )
      .execute();
  }

  const updated = await User.findOne(
    {
      id: user.id
    },
    {
      relations: ['roles', 'roles.organization']
    }
  );
  return {
    statusCode: 200,
    body: JSON.stringify(updated)
  };
});

/**
 * @swagger
 *
 * /users/me:
 *  get:
 *    description: Get information about the current user.
 *    tags:
 *    - Users
 */
export const me = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await User.findOne(getUserId(event), {
    relations: ['roles', 'roles.organization', 'apiKeys']
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

/**
 * @swagger
 *
 * /users/me/acceptTerms:
 *  post:
 *    description: Accept the latest terms of service.
 *    tags:
 *    - Users
 */
export const acceptTerms = wrapHandler(async (event) => {
  await connectToDatabase();
  const user = await User.findOne(getUserId(event), {
    relations: ['roles', 'roles.organization']
  });
  if (!user || !event.body) {
    return NotFound;
  }
  user.dateAcceptedTerms = new Date();
  user.acceptedTermsVersion = JSON.parse(event.body).version;
  await user.save();
  return {
    statusCode: 200,
    body: JSON.stringify(user)
  };
});

/**
 * @swagger
 *
 * /users:
 *  get:
 *    description: List users.
 *    tags:
 *    - Users
 */
export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) return Unauthorized;
  await connectToDatabase();
  const result = await User.find({
    relations: ['roles', 'roles.organization']
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
