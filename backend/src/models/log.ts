import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne
} from 'typeorm';
import { Organization, User, Role } from './';

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({})
  action:
    | 'CreateOrganization'
    | 'DeleteOrganization'
    | 'InviteUser'
    | 'DeleteUser'
    | 'ApproveRole'
    | 'RemoveRole'
    | 'CreateScan'
    | 'DeleteScan';

  // Who performed the action.
  @ManyToOne((type) => User, (user) => user.roles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  subject: User;

  // What value the action was called with.
  @Column({
    type: 'jsonb',
    default: {}
  })
  value: {
    [x: string]: any;
  };

  @ManyToOne((type) => User, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL'
  })
  targetUser: User;

  @ManyToOne((type) => Role, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL'
  })
  targetRole: Role;

  @ManyToOne((type) => Organization, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL'
  })
  targetOrganization: Organization;
}
