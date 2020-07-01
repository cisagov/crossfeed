import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity
} from 'typeorm';

@Entity()
@Index(['name'], { unique: true })
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column('varchar', { array: true })
  rootDomains: string[];

  @Column('varchar', { array: true })
  ipBlocks: string[];

  @Column()
  isPassive: boolean;
}
