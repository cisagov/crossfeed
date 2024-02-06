import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  BaseEntity,
  Unique
} from 'typeorm';
import { Cve } from './cve';

//TODO: Refactor column names to camelCase to match the rest of the codebase?
//TODO: Refactor table name to product for brevity?
@Entity()
@Unique(['cpe_product_name', 'version_number', 'vender'])
export class ProductInfo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cpe_product_name: string;

  @Column()
  version_number: string;

  @Column()
  vender: string;

  @Column()
  last_seen: Date;

  @ManyToMany((type) => Cve, (cve) => cve.product_info)
  cve: Cve[];
}
