import {
  IsInt,
  IsPositive,
  IsIn,
  IsString,
  isUUID,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
  IsUUID,
  IsOptional,
  validateOrReject
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Organization,
  connectToDatabase,
  Role,
  ScanTask,
  Scan,
  User,
  OrganizationTag
} from '../models';
import {
  validateBody,
  wrapHandler,
  NotFound,
  Unauthorized,
  getAccurateManyAndCount
} from './helpers';
import {
  isOrgAdmin,
  isGlobalWriteAdmin,
  getOrgMemberships,
  isGlobalViewAdmin
} from './auth';
import { In, QueryFailedError, SelectQueryBuilder } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { privateEncrypt } from 'crypto';

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
  let ids: Array<string> = [];

  if (!isGlobalWriteAdmin(event)) return Unauthorized;

  const id = event.pathParameters?.organizationId;
  //if I got a normal, single delete id via path, add it to the collection and proceed as normal
  if (id) {
    ids.push(id);
  } //otherwise look in the body
  else {
    const body = JSON.parse(event.body ?? '{}');
    // Wrap a lone org in an array, or pass in the unchanged array
    if (Array.isArray(body)) {
      ids = body;
    }
  }
  await connectToDatabase();
  for (const id of ids) {
    //check to make sure we have a valid uuid for each entry , and fail if so
    if (!id || !isUUID(id)) {
      return NotFound;
    }
  }
  const result = await Organization.delete({ id: In(ids) });
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
});

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

    Organization.merge(org, { ...body, parent: undefined });
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

  const body = JSON.parse(event.body ?? '{}');
  // Wrap a lone org in an array, or pass in the unchanged array
  const organizations: Array<NewOrganization> = Array.isArray(body)
    ? body
    : [body];

  await validateOrReject(organizations);
  await connectToDatabase();
  let statusCode: number;
  const failedOrganizations: Array<any> = [];
  const createdOrganizations: Array<any> = [];
  for (const org of organizations) {
    await validateOrReject(org);
    try {
      console.log('Ingesting organization: ', org.name);

      if ('tags' in org) {
        org.tags = await findOrCreateTags(org.tags);
      }

      const organization = await Organization.create({
        ...org,
        createdBy: { id: event.requestContext.authorizer!.id },
        parent: { id: org.parent }
      });

      //store a successful save in the "created" list
      const res = await organization.save();
      createdOrganizations.push(res);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        //keep track of the failed updates, if we get a query update issue, we'll add it to the list
        failedOrganizations.push({ organization: org, error: err.message });
      } else {
        //we aren't going to swallow any other types of errors.
        throw err;
      }
    }
  }
  //if there were NO successful inserts, return 500, otherwise return a 200
  if (createdOrganizations.length == 0) {
    statusCode = 500;
  } else {
    statusCode = 200;
  }

  //return a summary of both successful and failed operations.

  return {
    statusCode: statusCode,
    body: JSON.stringify({
      createdOrganizations: createdOrganizations,
      failedInserts: failedOrganizations
    })
  };
});

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class OrganizationFilters {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  rootDomains?: string;

  @IsString()
  @IsOptional()
  ipBlocks?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  isPassive?: string;
}

class OrganizationSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['name', 'reverseName', 'ip', 'createdAt', 'updatedAt', 'id'])
  sort: string = 'name';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => OrganizationFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: OrganizationFilters;

  @IsInt()
  @IsOptional()
  // If set to -1, returns all results.
  pageSize?: number;

  async filterResultQueryset(qs: SelectQueryBuilder<Organization>, event) {
    if (this.filters?.name) {
      qs.andWhere('organization.name ILIKE :name', {
        name: `%${this.filters?.name}%`
      });
    }

    if (this.filters?.isPassive) {
      qs.andWhere('organization.isPassive = :passive', {
        passive: this.filters?.isPassive
      });
    }

    if (this.filters?.rootDomains) {
      qs.andWhere(
        "array_to_string(organization.rootDomains,',') LIKE :rootDomains",
        {
          rootDomains: `%${this.filters?.rootDomains}%`
        }
      );
    }

    if (this.filters?.ipBlocks) {
      qs.andWhere("array_to_string(organization.ipBlocks,',') LIKE :ipBlocks", {
        ipBlocks: `%${this.filters?.ipBlocks}%`
      });
    }

    if (this.filters?.tags) {
      qs.andHaving('COUNT(CASE WHEN tags.name ILIKE :tags THEN 1 END) >= 1', {
        tags: `%${this.filters?.tags}%`
      });
    }
    return qs;
  }

  async getResults(event) {
    const pageSize = this.pageSize || PAGE_SIZE;
    let qs = Organization.createQueryBuilder('organization')
      .leftJoinAndSelect('organization.tags', 'tags')
      .orderBy(`organization.${this.sort}`, this.order)
      .groupBy('organization.id, organization.name, tags.id');

    if (pageSize !== -1) {
      qs = qs.skip(pageSize * (this.page - 1)).take(pageSize);
    }

    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }

    qs = await this.filterResultQueryset(qs, event);
    return getAccurateManyAndCount(qs, 'organization.id');
  }
}

/**
 * @swagger
 *
 * /organizations/search:
 *    description: List organizations by specifying a filter.
 *    tags:
 *    - Organizations
 */
export const search = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: [],
        count: 0
      })
    };
  }
  await connectToDatabase();
  const search = await validateBody(OrganizationSearch, event.body);
  const [result, count] = await search.getResults(event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count
    })
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
    relations: ['userRoles', 'tags']
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
