import {
  IsString,
  isUUID,
  IsBoolean,
  IsOptional,
  IsEmail
} from 'class-validator';
import { User, connectToDatabase, Role, Organization } from '../models';
import {
  validateBody,
  wrapHandler,
  NotFound,
  Unauthorized,
  sendEmail
} from './helpers';
import {
  getUserId,
  canAccessUser,
  isGlobalViewAdmin,
  isOrgAdmin,
  isGlobalWriteAdmin
} from './auth';

export const del = wrapHandler(async (event) => {
  if (!canAccessUser(event, event.pathParameters?.userId)) return Unauthorized;
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

export const update = wrapHandler(async (event) => {
  if (!canAccessUser(event, event.pathParameters?.userId)) return Unauthorized;
  await connectToDatabase();
  const id = event.pathParameters?.userId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }
  const body = await validateBody(NewUser, event.body);
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
    await User.save(user);

    if (body.organization) {
      // Create pending role if organization supplied
      await Role.insert({
        user: user,
        organization: { id: body.organization },
        approved: false,
        role: 'user'
      });
    }
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
}

export const invite = wrapHandler(async (event) => {
  const body = await validateBody(NewUser, event.body);
  // Invoker must be either an organization or global admin
  if (body.organization) {
    if (!isOrgAdmin(event, body.organization)) return Unauthorized;
  } else {
    if (!isGlobalWriteAdmin(event)) return Unauthorized;
  }

  await connectToDatabase();

  // Check if user already exists
  let user = await User.findOne({
    email: body.email
  });

  if (!user) {
    user = await User.create({
      invitePending: true,
      ...body
    });
    await User.save(user);
  } else if (!user.firstName && !user.lastName) {
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    await User.save(user);
  }

  if (body.organization) {
    const organization = await Organization.findOne(body.organization);

    // Create approved role if organization supplied
    await Role.createQueryBuilder()
      .insert()
      .values({
        user: user,
        organization: { id: body.organization },
        approved: true,
        role: body.organizationAdmin ? 'admin' : 'user'
      })
      .onConflict(
        `
      ("userId", "organizationId") DO UPDATE
      SET "role" = excluded."role",
          "approved" = excluded."approved"
    `
      )
      .execute();

    const staging = process.env.NODE_ENV !== 'production';

    const url = `https://${staging ? 'staging.' : ''}crossfeed.cyber.dhs.gov`;

    await sendEmail(
      user.email,
      'Crossfeed Invitation',
      `Hi there,

You've been invite to join the ${
        organization?.name
      } organization on Crossfeed. To accept the invitation and start using Crossfeed, sign on at ${url}.

Crossfeed access instructions:

1. Visit ${url}
2. Select to register with Login.gov
3. Select to create a new Login.gov ${staging ? 'sandbox ' : ''}account${
        staging
          ? '. Note that as Crossfeed staging uses the Login.gov sandbox, this will be a different account from your normal Login.gov account'
          : ''
      }
4. After configuring your account, you will be redirected to Crossfeed
  
On the "Dashboard" tab, you can view information about each subdomain and the associated ports and services detected on each one. The "Scans" tab has a list of enabled scans and the schedule that they run on. The "Risk Summary" tab has a visual summary of identified assets, and the "Vulnerabilities" tab lists discovered vulnerabilities.

For more information on using Crossfeed, view the Crossfeed user guide at https://cisagov.github.io/crossfeed/usage.

If you encounter any difficulties, please feel free to reply to this email (support@crossfeed.cyber.dhs.gov).`
    );
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

export const me = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await User.findOne(getUserId(event), {
    relations: ['roles', 'roles.organization']
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

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
