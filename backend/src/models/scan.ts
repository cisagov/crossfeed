import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity
} from 'typeorm';

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
}
