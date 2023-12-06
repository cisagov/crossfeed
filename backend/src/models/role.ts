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

  @ManyToOne((type) => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  createdBy: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    default: 'user'
  })
  role: 'user' | 'admin';

  @Column({
    default: false
  })
  approved: boolean;

  @ManyToOne((type) => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  approvedBy: User;

  @ManyToOne((type) => User, (user) => user.roles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: User;

  // @ManyToOne((type) => User, (user) => user.organizations, {
  //   onDelete: 'CASCADE',
  //   onUpdate: 'CASCADE'
  // })
  // userOrgs: User;

  @ManyToOne((type) => Organization, (organization) => organization.userRoles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  organization: Organization;
}
