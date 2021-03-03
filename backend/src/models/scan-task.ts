import {
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Column,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Scan, Organization } from '.';

@Entity()
export class ScanTask extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Organization that this specific ScanTask runs on.
   * Deprecated, replaced by "organizations" property.
   */
  @ManyToOne((type) => Organization, (organization) => organization.scanTasks, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  organization: Organization;

  /**
   * Organizations that this specific ScanTask runs on.
   */
  @ManyToMany(
    (type) => Organization,
    (organization) => organization.allScanTasks,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  )
  @JoinTable()
  organizations: Organization[];

  @ManyToOne((type) => Scan, (scan) => scan.scanTasks, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  scan: Scan;

  /**
   * created: model is created
   * queued: Fargate capacity has been reached, so the task will run whenever there is available capacity.
   * requested: a request to Fargate has been sent to start the task
   * started: the Fargate container has started running the task
   * finished: the Fargate container has finished running the task
   * failed: any of the steps above have failed
   */
  @Column('text')
  status:
    | 'created'
    | 'queued'
    | 'requested'
    | 'started'
    | 'finished'
    | 'failed';

  @Column('text')
  type: 'fargate' | 'lambda';

  /**
   * ARN of the associated fargate task.
   */
  @Column({
    type: 'text',
    nullable: true
  })
  fargateTaskArn: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  input: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  output: string | null;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  requestedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  startedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  finishedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  queuedAt: Date | null;
}
