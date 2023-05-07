import {
  IsString,
  isUUID,
  IsArray,
  IsBoolean,
  IsUUID,
  IsOptional,
  IsNotEmpty
} from 'class-validator';
import {
  Organization,
  connectToDatabase,
  Role,
  ScanTask,
  Scan,
  User,
  OrganizationTag,
  PendingDomain
} from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import {
  isOrgAdmin,
  isGlobalWriteAdmin,
  getOrgMemberships,
  isGlobalViewAdmin
} from './auth';
import { In } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import { resolveTxt } from 'dns';

/**
 * @swagger
 *
 * /organizations/{id}:
 *  delete:
 *    description: Delete a particular organization.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *    tags:
 *    - Organizations
 */
export const del = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  if (!isGlobalWriteAdmin(event)) return Unauthorized;

  await connectToDatabase();
  const result = await Organization.delete(id);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

// Used exclusively for deleting pending domains
class PendingDomainBody {
  @IsArray()
  @IsOptional()
  pendingDomains: PendingDomain[];
}

class NewOrganizationNonGlobalAdmins {
  @IsString()
  name: string;

  @IsBoolean()
  isPassive: boolean;
}

class NewOrganization extends NewOrganizationNonGlobalAdmins {
  @IsArray()
  rootDomains: string[];

  @IsArray()
  ipBlocks: string[];

  @IsArray()
  tags: OrganizationTag[];

  @IsUUID()
  @IsOptional()
  parent?: string;
}

class NewDomain {
  @IsString()
  @IsNotEmpty()
  domain: string;
}

const findOrCreateTags = async (
  tags: OrganizationTag[]
): Promise<OrganizationTag[]> => {
  const finalTags: OrganizationTag[] = [];
  for (const tag of tags) {
    if (!tag.id) {
      // If no id is supplied, first check to see if a tag with this name exists
      const found = await OrganizationTag.findOne({
        where: { name: tag.name }
      });
      if (found) {
        finalTags.push(found);
      } else {
        // If not, create it
        const created = OrganizationTag.create({ name: tag.name });
        await created.save();
        finalTags.push(created);
      }
    } else {
      finalTags.push(tag);
    }
  }
  return finalTags;
};

/**
 * @swagger
 *
 * /organizations/{id}:
 *  put:
 *    description: Update a particular organization.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *    tags:
 *    - Organizations
 */
export const update = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, id)) return Unauthorized;
  const body = await validateBody<
    NewOrganization | NewOrganizationNonGlobalAdmins
  >(
    isGlobalWriteAdmin(event)
      ? NewOrganization
      : NewOrganizationNonGlobalAdmins,
    event.body
  );
  const pendingBody = await validateBody<PendingDomainBody>(
    PendingDomainBody,
    event.body
  );

  await connectToDatabase();
  const org = await Organization.findOne(
    {
      id
    },
    {
      relations: ['userRoles', 'granularScans']
    }
  );
  if (org) {
    if ('tags' in body) {
      body.tags = await findOrCreateTags(body.tags);
    }

    let newPendingDomains: PendingDomain[] = [];
    if (pendingBody.pendingDomains) {
      for (const domain of org.pendingDomains) {
        if (pendingBody.pendingDomains.find((d) => d.name === domain.name)) {
          // Don't delete
          newPendingDomains.push(domain);
        }
      }
    } else {
      newPendingDomains = org.pendingDomains;
    }

    Organization.merge(org, {
      ...body,
      pendingDomains: newPendingDomains,
      parent: undefined
    });
    await Organization.save(org);
    return {
      statusCode: 200,
      body: JSON.stringify(org)
    };
  }
  return NotFound;
});

/**
 * @swagger
 *
 * /organizations:
 *  post:
 *    description: Create a new organization.
 *    tags:
 *    - Organizations
 */
export const create = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) return Unauthorized;
  const body = await validateBody(NewOrganization, event.body);
  await connectToDatabase();

  if ('tags' in body) {
    body.tags = await findOrCreateTags(body.tags);
  }
  const organization = await Organization.create({
    ...body,
    createdBy: { id: event.requestContext.authorizer!.id },
    parent: { id: body.parent }
  });
  const res = await organization.save();
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

/**
 * @swagger
 *
 * /organizations:
 *  get:
 *    description: List organizations that the user is a member of or has access to.
 *    tags:
 *    - Organizations
 */
export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
  await connectToDatabase();
  let where: any = { parent: null };
  if (!isGlobalViewAdmin(event)) {
    where = { id: In(getOrgMemberships(event)), parent: null };
  }
  const result = await Organization.find({
    where,
    relations: ['userRoles', 'tags'],
    order: { name: 'ASC' }
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

/**
 * @swagger
 *
 * /organizations/tags:
 *  get:
 *    description: Fetchs all possible organization tags (must be global admin)
 *    tags:
 *    - Organizations
 */
export const getTags = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }
  await connectToDatabase();
  const result = await OrganizationTag.find({
    select: ['id', 'name']
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

/**
 * @swagger
 *
 * /organizations/{id}:
 *  get:
 *    description: Get information about a particular organization.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *    tags:
 *    - Organizations
 */
export const get = wrapHandler(async (event) => {
  const id = event.pathParameters?.organizationId;

  if (!isOrgAdmin(event, id)) return Unauthorized;

  await connectToDatabase();
  const result = await Organization.findOne(id, {
    relations: [
      'userRoles',
      'userRoles.user',
      'granularScans',
      'tags',
      'parent',
      'children'
    ]
  });

  if (result) {
    result.scanTasks = await ScanTask.find({
      where: {
        organization: { id }
      },
      take: 10,
      order: {
        createdAt: 'DESC'
      },
      relations: ['scan']
    });
  }

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});

class UpdateBody {
  @IsBoolean()
  enabled: boolean;
}

/**
 * @swagger
 *
 * /organizations/{id}/granularScans/{scanId}/update:
 *  post:
 *    description: Enable or disable a scan for a particular organization; this endpoint can be called by organization admins and only works for user-modifiable scans.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *      - in: path
 *        name: scanId
 *        description: Role id
 *    tags:
 *    - Organizations
 */
export const updateScan = wrapHandler(async (event) => {
  const organizationId = event.pathParameters?.organizationId;

  if (!organizationId || !isUUID(organizationId)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, organizationId) && !isGlobalWriteAdmin(event))
    return Unauthorized;

  await connectToDatabase();
  const scanId = event.pathParameters?.scanId;
  if (!scanId || !isUUID(scanId)) {
    return NotFound;
  }
  const scan = await Scan.findOne({
    id: scanId,
    isGranular: true,
    isUserModifiable: true
  });
  const organization = await Organization.findOne(
    {
      id: organizationId
    },
    {
      relations: ['granularScans']
    }
  );
  if (!scan || !organization) {
    return NotFound;
  }
  const body = await validateBody(UpdateBody, event.body);
  if (body.enabled) {
    organization?.granularScans.push();
  }
  const existing = organization?.granularScans.find((s) => s.id === scanId);
  if (body.enabled && !existing) {
    organization.granularScans.push(plainToClass(Scan, { id: scanId }));
  } else if (!body.enabled && existing) {
    organization.granularScans = organization.granularScans.filter(
      (s) => s.id !== scanId
    );
  }
  const res = await Organization.save(organization);
  return {
    statusCode: 200,
    body: JSON.stringify(res)
  };
});

/**
 * @swagger
 *
 * /organizations/{id}/initiateDomainVerification:
 *  post:
 *    description: Generates a token to verify a new domain via a DNS record
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *    tags:
 *    - Organizations
 */
export const initiateDomainVerification = wrapHandler(async (event) => {
  const organizationId = event.pathParameters?.organizationId;

  if (!organizationId || !isUUID(organizationId)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, organizationId) && !isGlobalWriteAdmin(event))
    return Unauthorized;
  const body = await validateBody<NewDomain>(NewDomain, event.body);

  await connectToDatabase();
  const token = randomBytes(16).toString('hex');

  const organization = await Organization.findOne({
    id: organizationId
  });
  if (!organization) {
    return NotFound;
  }
  if (organization.rootDomains.find((domain) => domain === body.domain)) {
    return {
      statusCode: 422,
      body: 'Domain already exists.'
    };
  }
  if (
    !organization.pendingDomains.find(
      (domain) => domain['name'] === body.domain
    )
  ) {
    const domain: PendingDomain = {
      name: body.domain,
      token: token
    };
    organization.pendingDomains.push(domain);

    const res = await Organization.save(organization);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(organization.pendingDomains)
  };
});

// Helper function to turn resolveTxt into an async function
const resolveTxtAsync = async (name): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    resolveTxt(name, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp);
      }
    });
  });
};

/**
 * @swagger
 *
 * /organizations/{id}/checkDomainVerification:
 *  post:
 *    description: Checks whether the DNS record has been created for the supplied domain
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *    tags:
 *    - Organizations
 */
export const checkDomainVerification = wrapHandler(async (event) => {
  const organizationId = event.pathParameters?.organizationId;

  if (!organizationId || !isUUID(organizationId)) {
    return NotFound;
  }

  if (!isOrgAdmin(event, organizationId) && !isGlobalWriteAdmin(event))
    return Unauthorized;
  const body = await validateBody<NewDomain>(NewDomain, event.body);

  await connectToDatabase();

  const organization = await Organization.findOne({
    id: organizationId
  });
  if (!organization) {
    return NotFound;
  }
  const pendingDomain = organization.pendingDomains.find(
    (domain) => domain['name'] === body.domain
  );
  if (!pendingDomain) {
    return {
      statusCode: 422,
      body: 'Please initiate the domain verification first.'
    };
  }
  try {
    const res = await resolveTxtAsync(pendingDomain.name);
    for (const record of res) {
      for (const val of record) {
        console.log(val);
        if (val === 'crossfeed-verification=' + pendingDomain.token) {
          // Success!
          organization.rootDomains.push(pendingDomain.name);
          organization.pendingDomains = organization.pendingDomains.filter(
            (domain) => domain.name !== pendingDomain.name
          );
          organization.save();
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true, organization })
          };
        }
      }
    }
  } catch (e) {}

  return {
    statusCode: 200,
    body: JSON.stringify({ success: false })
  };
});

/**
 * @swagger
 *
 * /organizations/{id}/roles/{roleId}/approve:
 *  post:
 *    description: Approve a role within an organization.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *      - in: path
 *        name: roleId
 *        description: Role id
 *    tags:
 *    - Organizations
 */
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
    role.approvedBy = plainToClass(User, {
      id: event.requestContext.authorizer!.id
    });
    const result = await role.save();
    return {
      statusCode: result ? 200 : 404,
      body: JSON.stringify({})
    };
  }

  return NotFound;
});

/**
 * @swagger
 *
 * /organizations/{id}/roles/{roleId}/remove:
 *  post:
 *    description: Remove a role within an organization.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Organization id
 *      - in: path
 *        name: roleId
 *        description: Role id
 *    tags:
 *    - Organizations
 */
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
