import {
  Entity,
  Index,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToMany,
  PrimaryColumn,
  BeforeInsert
} from 'typeorm';
import { Role } from './';

@Entity()
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string;

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

  @Column()
  email: string;

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
