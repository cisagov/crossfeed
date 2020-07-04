import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { Domain } from './domain';

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

  @OneToMany((type) => Domain, (domain) => domain.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domains: Domain[];
}
