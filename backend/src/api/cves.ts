import {
  IsInt,
  IsPositive,
  IsString,
  ValidateNested,
  IsOptional,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { Cve, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';

class CveFilters {
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @IsOptional()
  @IsString()
  cve_name?: string;

  @IsOptional()
  @IsString()
  vuln_status?: string;
}

class CveSearch {
  @IsUUID()
  @IsOptional()
  uuid?: string;

  @IsOptional()
  @IsString()
  cve_name?: string;

  @IsOptional()
  @IsString()
  vuln_status?: string;

  @Type(() => CveFilters)
  @ValidateNested()
  @IsOptional()
  filters?: CveFilters;

  @IsInt()
  @IsPositive()
  @IsOptional()
  pageSize?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number;

  async getResults(event): Promise<[Cve[], number]> {
    const filters = this.filters || new CveFilters();
    const query = Cve.createQueryBuilder('cve');

    if (filters.cve_name) {
      query.andWhere('cve.cve_name = :cve_name', {
        cve_name: filters.cve_name
      });
    }
    if (filters.vuln_status) {
      query.andWhere('cve.vuln_status = :vuln_status', {
        vuln_status: filters.vuln_status
      });
    }

    // Apply pagination to the query
    const pageSize = this.pageSize || 25;
    const skip = ((this.page || 1) - 1) * pageSize;
    query.skip(skip).take(pageSize);

    // Execute the query
    const [result, count] = await query.getManyAndCount();

    return [result, count];
  }
}

//TODO: Refactor the get endpoint to search by id instead of cve_name.
// This requires creating a relationship between the cve and vulnerability tables.
/**
 * @swagger
 *
 * /cves/{cve_name}:
 *  get:
 *    description: Retrieve a single CVE record by its name.
 *    tags:
 *    - CVE
 *    parameters:
 *    - name: cve_name
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 */
export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const cve_name = event.pathParameters?.cve_name;
  console.log('cve_name:', cve_name);

  const cve = await Cve.findOne({ where: { cve_name } });
  console.log('Cve.findOne result:', cve);

  if (!cve) {
    return {
      statusCode: 404,
      body: JSON.stringify(Error)
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(cve)
  };
});
