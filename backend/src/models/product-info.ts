import { mapping } from 'src/tasks/censys/mapping';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  BaseEntity,
  Unique
} from 'typeorm';
import { Cve } from './cve';

@Entity()
@Unique(['cpe_product_name', 'version_number', 'vender'])
export class ProductInfo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; //TODO: change this to something else??

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
