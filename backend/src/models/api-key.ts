import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne
} from 'typeorm';
import { User } from './';

@Entity()
export class ApiKey extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne((type) => User, (user) => user.apiKeys, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: User;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  lastUsed: Date | null;

  @Column({
    type: 'text',
    length: 64
  })
  hashedKey: string;

  @Column({
    type: 'text',
    length: 4
  })
  lastFour: string;
}
