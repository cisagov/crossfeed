import {
  Entity,
  Index,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToMany,
  PrimaryColumn,
  BeforeInsert,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Role } from './';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({
    nullable: true
  })
  loginGovId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  /** Whether the user's invite is pending */
  @Column({ default: false })
  invitePending: boolean;

  /** The user's type. globalView allows access to all organizations
   * while globalAdmin allows universally administering Crossfeed */
  @Column('text', { default: 'standard' })
  userType: 'standard' | 'globalView' | 'globalAdmin';

  /** The roles for organizations which the user belongs to */
  @OneToMany((type) => Role, (role) => role.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  roles: Role[];

  @BeforeInsert()
  setFullName() {
    this.fullName = this.firstName + ' ' + this.lastName;
  }
}
