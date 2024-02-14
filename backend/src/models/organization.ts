import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToMany,
  ManyToMany,
  ManyToOne
} from 'typeorm';
import { Domain, Role, Scan, ScanTask, OrganizationTag } from '.';
import { User } from './user';

export interface PendingDomain {
  name: string;
  token: string;
}

@Entity()
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index({ unique: true })
  @Column({
    nullable: true,
    unique: true
  })
  acronym: string;

  @Column()
  name: string;

  @Column('varchar', { array: true })
  rootDomains: string[];

  @Column('varchar', { array: true })
  ipBlocks: string[];

  @Column()
  isPassive: boolean;

  @OneToMany((type) => Domain, (domain) => domain.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domains: Domain[];

  @Column('json', { default: '[]' })
  pendingDomains: PendingDomain[];

  @OneToMany((type) => Role, (role) => role.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  userRoles: Role[];

  /**
   * Corresponds to "organization" property of ScanTask.
   * Deprecated, replaced by "allScanTasks" property.
   */
  @OneToMany((type) => ScanTask, (scanTask) => scanTask.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  scanTasks: ScanTask[];

  /**
   * Corresponds to "organizations" property of ScanTask.
   */
  @ManyToMany((type) => ScanTask, (scanTask) => scanTask.organizations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  allScanTasks: ScanTask[];

  @ManyToMany((type) => Scan, (scan) => scan.organizations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  granularScans: Scan[];

  @ManyToMany((type) => OrganizationTag, (tag) => tag.organizations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  tags: OrganizationTag[];

  /**
   * The organization's parent organization, if any.
   * Organizations without a parent organization are
   * shown to users as 'Organizations', while organizations
   * with a parent organization are shown to users as 'Teams'
   */
  @ManyToOne((type) => Organization, (org) => org.children, {
    onDelete: 'CASCADE',
    nullable: true
  })
  parent: Organization;

  @OneToMany((type) => Organization, (org) => org.parent, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  children: Organization[];

  @ManyToOne((type) => User, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  createdBy: User;

  @Column({
    nullable: true
  })
  country: string;

  @Column({
    nullable: true
  })
  state: string;

  @Column({
    nullable: true
  })
  regionId: string;

  @Column({
    nullable: true
  })
  stateFips: number;

  @Column({
    nullable: true
  })
  stateName: string;

  @Column({
    nullable: true
  })
  county: string;

  @Column({
    nullable: true
  })
  countyFips: number;

  @Column({
    nullable: true
  })
  type: string;
}
