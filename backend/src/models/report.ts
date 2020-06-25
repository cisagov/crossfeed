import {
  Entity,
  Index,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn
} from 'typeorm';

@Entity()
@Index(['report_id'], { unique: true })
export class Report extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 100
  })
  report_id: string;

  @Column({
    length: 512,
    nullable: true,
    type: 'varchar'
  })
  title: string;

  @Column({
    type: 'varchar'
  })
  created: string;

  @Column({
    type: 'text'
  })
  desc: string;

  @Column({
    type: 'varchar',
    nullable: true
  })
  triaged: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  reported: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  last_program_activity: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  last_reporter_activity: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  severity: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  state: string | null;
}
