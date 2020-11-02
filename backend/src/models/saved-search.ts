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
import { Domain, Role, Scan, ScanTask } from '.';
import { User } from './user';

@Entity()
export class SavedSearch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column()
  searchTerm: string;

  @Column()
  count: number;

  @Column({ type: 'jsonb', default: '[]' })
  filters: { field: string; values: any[]; type: string }[];

  @Column()
  searchPath: string;

  @ManyToOne((type) => User, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  createdBy: User;
}
