import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToMany
} from 'typeorm';
import { ScanTask } from './scan-task';

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
}
