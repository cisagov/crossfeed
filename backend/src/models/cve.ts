import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  BaseEntity,
  JoinTable,
  Unique
} from 'typeorm';
import { Cpe } from './cpe';

//TODO: Refactor column names to camelCase to match the rest of the codebase?
@Entity()
@Unique(['name'])
export class Cve extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  cvssV2Source: string;

  @Column({ nullable: true })
  cvssV2Type: string;

  @Column({ nullable: true })
  cvssV2Version: string;

  @Column({ nullable: true })
  cvssV2VectorString: string;

  @Column({ nullable: true })
  cvssV2BaseScore: string;

  @Column({ nullable: true })
  cvssV2BaseSeverity: string;

  @Column({ nullable: true })
  cvssV2ExploitabilityScore: string;

  @Column({ nullable: true })
  cvssV2ImpactScore: string;

  @Column({ nullable: true })
  cvssV3Source: string;

  @Column({ nullable: true })
  cvssV3Type: string;

  @Column({ nullable: true })
  cvssV3Version: string;

  @Column({ nullable: true })
  cvssV3VectorString: string;

  @Column({ nullable: true })
  cvssV3BaseScore: string;

  @Column({ nullable: true })
  cvssV3BaseSeverity: string;

  @Column({ nullable: true })
  cvssV3ExploitabilityScore: string;

  @Column({ nullable: true })
  cvssV3ImpactScore: string;

  @Column({ nullable: true })
  cvssV4Source: string;

  @Column({ nullable: true })
  cvssV4Type: string;

  @Column({ nullable: true })
  cvssV4Version: string;

  @Column({ nullable: true })
  cvssV4VectorString: string;

  @Column({ nullable: true })
  cvssV4BaseScore: string;

  @Column({ nullable: true })
  cvssV4BaseSeverity: string;

  @Column({ nullable: true })
  cvssV4ExploitabilityScore: string;

  @Column({ nullable: true })
  cvssV4ImpactScore: string;

  @Column('simple-array', { nullable: true })
  weaknesses: string[];

  @Column('simple-array', { nullable: true })
  references: string[];

  @ManyToMany(() => Cpe, (cpe) => cpe.cves, {
    cascade: true
  })
  @JoinTable()
  cpes: Cpe[];
}
