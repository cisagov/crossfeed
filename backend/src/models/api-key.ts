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
    // length based on hex formatted sha256
    length: 64,
    type: 'varchar'
  })
  hashedKey: string;

  @Column({
    length: 4,
    type: 'varchar'
  })
  lastFour: string;
}
