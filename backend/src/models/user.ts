import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  OneToOne
} from 'typeorm';
import { Role } from './';

@Entity()
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column()
  email: string;

  @OneToMany((type) => Role, (role) => role.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  roles: Role[];
}
