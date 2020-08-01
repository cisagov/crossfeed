import {
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Column
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

  @ManyToOne((type) => Organization, (organization) => organization.scanTasks, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  organization: Organization;

  @ManyToOne((type) => Scan, (scan) => scan.scanTasks, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  scan: Scan;

  /**
   * created: model is created
   * requested: a request to Fargate has been sent to start the task
   * started: the Fargate container has started running the task
   * finished: the Fargate container has finished running the task
   * failed: any of the steps above have failed
   */
  @Column('text')
  status: 'created' | 'requested' | 'started' | 'finished' | 'failed';

  @Column('text')
  type: 'fargate' | 'lambda';

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
}
