import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne
} from 'typeorm';
import { Organization, User } from './';

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

  @ManyToOne((type) => User, (user) => user.roles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  subject: User;

  @ManyToOne((type) => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: User;

  @ManyToOne((type) => Organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  organization: Organization;
}
