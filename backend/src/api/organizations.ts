import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  isUUID,
  IsObject,
  IsArray,
  IsBoolean
} from 'class-validator';
import { Organization, connectToDatabase, Role, ScanTask } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import {
  isOrgAdmin,
  isGlobalWriteAdmin,
  getOrgMemberships,
  isGlobalViewAdmin
} from './auth';
import { In } from 'typeorm';

export const del = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, id)) return Unauthorized;

  await connectToDatabase();
  const result = await Organization.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const update = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, id)) return Unauthorized;

  const body = await validateBody(NewOrganization, event.body);
  await connectToDatabase();
  const org = await Organization.findOne(
    {
      id
    },
    {
      relations: ['userRoles']
    }
  );
  if (org) {
    Organization.merge(org, body);
    await Organization.save(org);
    return {
      statusCode: 200,
      body: JSON.stringify(org)
    };
  }
  return NotFound;
});

class NewOrganization {
  @IsString()
  name: string;

  @IsArray()
  rootDomains: string[];

  @IsArray()
  ipBlocks: string[];

  @IsBoolean()
  isPassive: boolean;

  @IsBoolean()
  inviteOnly: boolean;
}

export const create = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  const body = await validateBody(NewOrganization, event.body);
  await connectToDatabase();
  const scan = await Organization.create(body);
  const res = await Organization.save(scan);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

export const list = wrapHandler(async (event) => {
  if (getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
  await connectToDatabase();
  let where = {};
  if (isGlobalViewAdmin(event)) {
    where = {};
  } else {
    where = { id: In(getOrgMemberships(event)) };
  }
  const result = await Organization.find({
    where
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const get = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!isOrgAdmin(event, id)) return Unauthorized;

  await connectToDatabase();
  const result = await Organization.findOne(id, {
    relations: ['userRoles', 'userRoles.user']
  });

  if (result) {
    result.scanTasks = await ScanTask.find({
      where: {
        organization: { id }
      },
      take: 10,
      order: {
        createdAt: 'DESC'
      }
    });
  }

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});

export const approveRole = wrapHandler(async (event) => {
  const organizationId = event.pathParameters?.organizationId;
  if (!isOrgAdmin(event, organizationId)) return Unauthorized;

  const id = event.pathParameters?.roleId;
  if (!isUUID(id)) {
    return NotFound;
  }

  await connectToDatabase();
  const role = await Role.findOne({
    organization: { id: organizationId },
    id
  });
  if (role) {
    role.approved = true;
    const result = await role.save();
    return {
      statusCode: result ? 200 : 404,
      body: JSON.stringify({})
    };
  }

  return NotFound;
});

export const removeRole = wrapHandler(async (event) => {
  const organizationId = event.pathParameters?.organizationId;
  if (!isOrgAdmin(event, organizationId)) return Unauthorized;

  const id = event.pathParameters?.roleId;
  if (!id || !isUUID(id)) {
    return NotFound;
  }

  await connectToDatabase();
  const result = await Role.delete({
    organization: { id: organizationId },
    id
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

export const listPublicNames = wrapHandler(async (event) => {
  await connectToDatabase();
  const result = await Organization.find({
    select: ['name', 'id'],
    where: {
      inviteOnly: false
    }
  });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});
