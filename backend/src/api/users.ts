import {
  IsString,
  isUUID,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsObject,
  IsPositive,
  ValidateNested,
  IsUUID
} from 'class-validator';
import { User, connectToDatabase, Role, Organization } from '../models';
import {
  validateBody,
  wrapHandler,
  NotFound,
  Unauthorized,
  sendEmail,
  sendUserRegistrationEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationDeniedEmail
} from './helpers';
import { UserType } from '../models/user';
import {
  getUserId,
  canAccessUser,
  isGlobalViewAdmin,
  isRegionalAdmin,
  isOrgAdmin,
  isGlobalWriteAdmin
} from './auth';
import { Type, plainToClass } from 'class-transformer';
import { IsNull } from 'typeorm';
import { create } from './organizations';

class UserSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn([
    'fullName',
    'firstName',
    'lastName',
    'email',
    'name',
    'userType',
    'dateAcceptedTerms',
    'lastLoggedIn',
    'acceptedTermsVersion',
    'state',
    'regionId'
  ])
  @IsOptional()
  sort: string = 'fullName';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @IsInt()
  @IsOptional()
  // If set to -1, returns all results.
  pageSize?: number;

  @IsString()
  @IsOptional()
  @IsIn(['title'])
  groupBy?: 'title';

  async getResults(event): Promise<[User[], number]> {
    const pageSize = this.pageSize || 25;
    const sort = this.sort === 'name' ? 'user.fullName' : 'user.' + this.sort;
    const qs = User.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles') // Include the roles relation
      .leftJoinAndSelect('roles.organization', 'organization') // Include the organization relation
      .orderBy(sort, this.order);
    const result = await qs.getMany();
    const count = await qs.getCount();
    return [result, count];
  }
}

// New User
class NewUser {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  regionId: string;

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

class UpdateUser {
  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  regionId: string;

  @IsBoolean()
  @IsOptional()
  invitePending: boolean;

  @IsEnum(UserType)
  @IsOptional()
  userType: UserType;

  // @IsString()
  @IsEnum(Organization)
  @IsOptional()
  organization: Organization;

  @IsString()
  @IsOptional()
  role: string;
}

const REGION_STATE_MAP = {
  Connecticut: '1',
  Maine: '1',
  Massachusetts: '1',
  'New Hampshire': '1',
  'Rhode Island': '1',
  Vermont: '1',
  'New Jersey': '2',
  'New York': '2',
  'Puerto Rico': '2',
  'Virgin Islands': '2',
  Delaware: '3',
  Maryland: '3',
  Pennsylvania: '3',
  Virginia: '3',
  'District of Columbia': '3',
  'West Virginia': '3',
  Alabama: '4',
  Florida: '4',
  Georgia: '4',
  Kentucky: '4',
  Mississippi: '4',
  'North Carolina': '4',
  'South Carolina': '4',
  Tennessee: '4',
  Illinois: '5',
  Indiana: '5',
  Michigan: '5',
  Minnesota: '5',
  Ohio: '5',
  Wisconsin: '5',
  Arkansas: '6',
  Louisiana: '6',
  'New Mexico': '6',
  Oklahoma: '6',
  Texas: '6',
  Iowa: '7',
  Kansas: '7',
  Missouri: '7',
  Nebraska: '7',
  Colorado: '8',
  Montana: '8',
  'North Dakota': '8',
  'South Dakota': '8',
  Utah: '8',
  Wyoming: '8',
  Arizona: '9',
  California: '9',
  Hawaii: '9',
  Nevada: '9',
  Guam: '9',
  'American Samoa': '9',
  'Commonwealth Northern Mariana Islands': '9',
  'Republic of Marshall Islands': '9',
  'Federal States of Micronesia': '9',
  Alaska: '10',
  Idaho: '10',
  Oregon: '10',
  Washington: '10'
};

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
    console.log(JSON.stringify({ original_user: user }));
    user.firstName = body.firstName ?? user.firstName;
    user.lastName = body.lastName ?? user.lastName;
    user.fullName = user.firstName + ' ' + user.lastName;
    user.userType = body.userType ?? user.userType;
    await User.save(user);
    console.log(JSON.stringify({ updated_user: user }));
    return {
      statusCode: 200,
      body: JSON.stringify(user)
    };
  }
  return NotFound;
});

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

  if (body.state) {
    body.regionId = REGION_STATE_MAP[body.state];
  }

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
    if (process.env.IS_LOCAL!) {
      console.log('Cannot send invite email while running on local.');
    } else {
      await sendInviteEmail(user.email, organization);
    }
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
 *
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

/**
 * @swagger
 *
 * /users/search:
 *  post:
 *    description: List users.
 *    tags:
 *    - Users
 */
export const search = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) return Unauthorized;
  await connectToDatabase(true);
  const search = await validateBody(UserSearch, event.body);
  const [result, count] = await search.getResults(event);
  return {
    statusCode: 200,
    body: JSON.stringify({ result, count })
  };
});

/**
 * @swagger
 *
 * /users/regionId/{regionId}:
 *  get:
 *    description: List users with specific regionId.
 *    parameters:
 *      - in: path
 *        name: regionId
 *        description: User regionId
 *    tags:
 *    - Users
 */
export const getByRegionId = wrapHandler(async (event) => {
  if (!isRegionalAdmin(event)) return Unauthorized;
  const regionId = event.pathParameters?.regionId;
  await connectToDatabase();
  const result = await User.find({
    where: { regionId: regionId },
    relations: ['roles', 'roles.organization']
  });
  if (result) {
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }
  return NotFound;
});

/**
 * @swagger
 *
 * /users/state/{state}:
 *  get:
 *    description: List users with specific state.
 *    parameters:
 *      - in: path
 *        name: state
 *        description: User state
 *    tags:
 *    - Users
 */
export const getByState = wrapHandler(async (event) => {
  if (!isRegionalAdmin(event)) return Unauthorized;
  const state = event.pathParameters?.state;
  await connectToDatabase();
  const result = await User.find({
    where: { state: state },
    relations: ['roles', 'roles.organization']
  });
  if (result) {
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }
  return NotFound;
});

/**
 * @swagger
 *
 * /users/register:
 *  post:
 *    description: New user registration.
 *    tags:
 *    - Users
 */
export const register = wrapHandler(async (event) => {
  const body = await validateBody(NewUser, event.body);
  const newUser = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email.toLowerCase(),
    userType: UserType.STANDARD,
    state: body.state,
    regionId: REGION_STATE_MAP[body.state],
    invitePending: true
  };
  console.log(JSON.stringify(newUser));

  await connectToDatabase();

  // Check if user already exists
  const userCheck = await User.findOne({
    where: { email: newUser.email }
  });

  let id = '';
  // Create if user does not exist
  if (userCheck) {
    console.log('User already exists.');
    return {
      statusCode: 422,
      body: 'User email already exists. Registration failed.'
    };
  }

  const createdUser = await User.create(newUser);
  await User.save(createdUser);
  id = createdUser.id;
  const savedUser = await User.findOne(id, {
    relations: ['roles', 'roles.organization']
  });
  if (!savedUser) {
    return NotFound;
  }
  // Send email notification
  await sendUserRegistrationEmail(
    savedUser.email,
    'Crossfeed Registration Pending',
    savedUser.firstName,
    savedUser.lastName,
    'crossfeed_registration_notification.html'
  );

  return {
    statusCode: 200,
    body: JSON.stringify(savedUser)
  };
});

/**
 * @swagger
 *
 * /users/{id}/register/approve:
 *  put:
 *    description: Approve a particular users registration.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: User id
 *    tags:
 *    - Users
 */
export const registrationApproval = wrapHandler(async (event) => {
  // Get the user id from the path
  const userId = event.pathParameters?.userId;

  // Confirm that the id is a valid UUID
  if (!userId || !isUUID(userId)) {
    return NotFound;
  }

  // Connect to the database
  await connectToDatabase();

  const user = await User.findOne(userId);
  if (!user) {
    return NotFound;
  }

  // Send email notification
  await sendRegistrationApprovedEmail(
    user.email,
    'Crossfeed Registration Approved',
    user.firstName,
    user.lastName,
    'crossfeed_approval_notification.html'
  );

  // TODO: Handle Response Output
  return {
    statusCode: 200,
    body: 'User registration approved.'
  };
});

/**
 * @swagger
 *
 * /users/{id}/register/deny:
 *  put:
 *    description: Deny a particular users registration.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: User id
 *    tags:
 *    - Users
 */
export const registrationDenial = wrapHandler(async (event) => {
  // Get the user id from the path
  const userId = event.pathParameters?.userId;

  // Confirm that the id is a valid UUID
  if (!userId || !isUUID(userId)) {
    return NotFound;
  }

  // Connect to the database
  await connectToDatabase();

  const user = await User.findOne(userId);
  if (!user) {
    return NotFound;
  }

  await sendRegistrationDeniedEmail(
    user.email,
    'Crossfeed Registration Denied',
    user.firstName,
    user.lastName,
    'crossfeed_denial_notification.html'
  );

  // TODO: Handle Response Output
  return {
    statusCode: 200,
    body: 'User registration denied.'
  };
});

//***************//
// V2 Endpoints  //
//***************//

/**
 * @swagger
 *
 * /v2/users:
 *  get:
 *    description: List all users with query parameters.
 *    tags:
 *    - Users
 *    parameters:
 *      - in: query
 *        name: state
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: regionId
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: invitePending
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *
 */
export const getAllV2 = wrapHandler(async (event) => {
  if (!isRegionalAdmin(event)) return Unauthorized;

  const filterParams = {};

  if (event.query && event.query.state) {
    filterParams['state'] = event.query.state;
  }
  if (event.query && event.query.regionId) {
    filterParams['regionId'] = event.query.regionId;
  }
  if (event.query && event.query.invitePending) {
    filterParams['invitePending'] = event.query.invitePending;
  }

  await connectToDatabase();
  if (Object.entries(filterParams).length === 0) {
    const result = await User.find({
      relations: ['roles', 'roles.organization']
    });
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } else {
    const result = await User.find({
      where: filterParams,
      relations: ['roles', 'roles.organization']
    });
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }
});

/**
 * @swagger
 *
 * /v2/users:
 *  post:
 *    description: Create a new user.
 *    tags:
 *    - Users
 */
export const inviteV2 = wrapHandler(async (event) => {
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
  const userEmail = body.email.toLowerCase();

  const sendRegisterEmail = async (email: string) => {
    const staging = process.env.NODE_ENV !== 'production';

    await sendEmail(
      email,
      'Crossfeed Registration',
      `Hello,
      Your Crossfeed registration is under review.
      You will receive an email when your registration is approved.
      
      Thank you!`
    );
  };

  // Check if user already exists
  let user = await User.findOne({
    email: body.email
  });

  // Handle Organization assignment if provided
  let organization: Organization | undefined;
  if (body.organization) {
    organization = await Organization.findOne(body.organization);
  }

  // Create user if not found
  if (!user) {
    // Create User object
    user = await User.create({
      invitePending: true,
      ...body
    });
    // Save User to DB
    await User.save(user);

    // Send Notification Email to user
    await sendRegisterEmail(userEmail);
  } else if (!user.firstName && !user.lastName) {
    // Only set the user first name and last name the first time the user is invited.
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    // Save User to DB
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
 * /v2/users/{id}:
 *  put:
 *    description: Update a particular user.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: User id
 *    tags:
 *    - Users
 */
export const updateV2 = wrapHandler(async (event) => {
  // Get the user id from the path
  const userId = event.pathParameters?.userId;

  // Confirm that the id is a valid UUID
  if (!userId || !isUUID(userId)) {
    return NotFound;
  }

  // Validate the body
  const body = await validateBody(UpdateUser, event.body);

  // Connect to the database
  await connectToDatabase();

  const user = await User.findOne(userId);
  if (!user) {
    return NotFound;
  }

  // Update the user
  const updatedResp = await User.update(userId, body);

  // Handle response
  if (updatedResp) {
    const updatedUser = await User.findOne(userId, {
      relations: ['roles', 'roles.organization']
    });
    return {
      statusCode: 200,
      body: JSON.stringify(updatedUser)
    };
  }
  return NotFound;
});
