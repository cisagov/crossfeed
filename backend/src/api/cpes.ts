import {
  IsInt,
  IsPositive,
  IsString,
  ValidateNested,
  IsOptional,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductInfo, connectToDatabase } from '../models';
import { wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder } from 'typeorm';

class CpeFilters {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  cpe_product_name?: string;

  @IsOptional()
  @IsString()
  version_number?: string;

  @IsOptional()
  @IsString()
  vender?: string;
}

class CpeSearch {
  @ValidateNested()
  @Type(() => CpeFilters)
  filters: CpeFilters;

  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pageSize?: number;

  constructor(filters: CpeFilters, page?: number, pageSize?: number) {
    this.filters = filters;
    this.page = page;
    this.pageSize = pageSize;
  }

  async filterResultQueryset(qs: SelectQueryBuilder<ProductInfo>) {
    if (this.filters.id) {
      qs = qs.andWhere('product_info.id = :id', { id: this.filters.id });
    }
    if (this.filters.cpe_product_name) {
      qs = qs.andWhere('product_info.cpe_product_name = :cpe_product_name', {
        cpe_product_name: this.filters.cpe_product_name
      });
    }
    if (this.filters.version_number) {
      qs = qs.andWhere('product_info.version_number = :version_number', {
        version_number: this.filters.version_number
      });
    }
    if (this.filters.vender) {
      qs = qs.andWhere('product_info.vender = :vender', {
        vender: this.filters.vender
      });
    }
    return qs;
  }

  async getResults(): Promise<[ProductInfo[], number]> {
    const connection = await connectToDatabase();
    let qs = connection
      .getRepository(ProductInfo)
      .createQueryBuilder('product_info');
    qs = await this.filterResultQueryset(qs);

    const total = await qs.getCount();

    if (this.page && this.pageSize) {
      qs = qs.skip((this.page - 1) * this.pageSize).take(this.pageSize);
    }

    const results = await qs.getMany();

    return [results, total];
  }
}

/**
 * @swagger
 * /cpes/{id}:
 *   get:
 *     summary: Retrieve a CPE by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A CPE object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductInfo'
 *       404:
 *         description: CPE not found
 */
export const get = wrapHandler(async (event) => {
  const connection = await connectToDatabase();
  const repository = connection.getRepository(ProductInfo);

  const id = event.pathParameters?.id;
  if (!id) {
    return NotFound;
  }

  const productInfo = await repository.findOne(id);
  if (!productInfo) {
    return NotFound;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(productInfo)
  };
});
