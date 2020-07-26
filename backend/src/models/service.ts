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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => Domain, (domain) => domain.services, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domain: Domain;

  @Column()
  port: number;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  service: string | null;

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  lastSeen: Date | null;

  @Column({
    nullable: true,
    type: 'text'
  })
  banner: string | null;

  /** Censys Metadata */
  @Column({
    type: 'jsonb',
    default: {}
  })
  censysMetadata: {
    product: string;
    revision: string;
    description: string;
    version: string;
    manufacturer: string;
  } | null;
}
