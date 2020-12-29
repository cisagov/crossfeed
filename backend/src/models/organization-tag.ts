import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  Column
} from 'typeorm';
import { Organization, Scan } from '.';

@Entity()
@Index(['name'], { unique: true })
export class OrganizationTag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @ManyToMany((type) => Organization, (organization) => organization.tags, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinTable()
  organizations: Organization[];

  @ManyToMany((type) => Scan, (scan) => scan.tags, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinTable()
  scans: Scan[];
}
