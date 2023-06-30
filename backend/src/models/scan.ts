import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne
} from 'typeorm';
import { ScanTask, Organization, OrganizationTag } from '.';
import { User } from './user';

@Entity()
export class Scan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column('json')
  arguments: Object;

  /** How often the scan is run, in seconds */
  @Column()
  frequency: number;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  lastRun: Date | null;

  @OneToMany((type) => ScanTask, (scanTask) => scanTask.scan, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  scanTasks: ScanTask[];

  /** Whether the scan is granular. Granular scans
   * are only run on specified organizations.
   * Global scans cannot be granular scans.
   */
  @Column({
    type: 'boolean',
    default: false
  })
  isGranular: boolean;

  /** Whether the scan is user-modifiable. User-modifiable
   * scans are granular scans that can be viewed and toggled on/off by
   * organization admins themselves.
   */
  @Column({
    type: 'boolean',
    default: false,
    nullable: true
  })
  isUserModifiable: boolean;

  /**
   * If the scan is granular, specifies organizations that the
   * scan will run on.
   */
  @ManyToMany(
    (type) => Organization,
    (organization) => organization.granularScans,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  )
  @JoinTable()
  organizations: Organization[];

  /**
   * If the scan is granular, specifies organization tags that the
   * scan will run on.
   */
  @ManyToMany((type) => OrganizationTag, (tag) => tag.scans, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinTable()
  tags: OrganizationTag[];

  @ManyToOne((type) => User, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  createdBy: User;

  @Column({
    type: 'boolean',
    default: false
  })
  isSingleScan: boolean;

  @Column({
    type: 'boolean',
    default: false
  })
  manualRunPending: boolean;
}
