import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne
} from 'typeorm';
import { Organization, User } from './';

@Entity()
@Index(['user', 'organization'], { unique: true })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  role: string;

  @ManyToOne((type) => User, (user) => user.roles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: User;

  @ManyToOne((type) => Organization, (organization) => organization.userRoles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  organization: Organization;
}
