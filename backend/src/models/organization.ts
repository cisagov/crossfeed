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

  @Column({ default: true })
  inviteOnly: boolean;

  @OneToMany((type) => Domain, (domain) => domain.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domains: Domain[];

  @OneToMany((type) => Role, (role) => role.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  userRoles: Role[];

  @OneToMany((type) => ScanTask, (scanTask) => scanTask.organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  scanTasks: ScanTask[];

  @ManyToMany((type) => Scan, (scan) => scan.organizations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  granularScans: Scan[];

  @ManyToOne((type) => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  createdBy: User;
}
