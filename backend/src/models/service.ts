import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity
} from 'typeorm';
import { Domain } from './domain';

@Entity()
@Index(['port', 'domain'], { unique: true })
export class Service extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Domain, (domain) => domain.services, {
    onDelete: 'CASCADE'
  })
  domain: Domain;

  @Column()
  port: string;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  service: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  lastSeen: string | null;

  @Column({
    nullable: true,
    type: 'text'
  })
  banner: string | null;
}
