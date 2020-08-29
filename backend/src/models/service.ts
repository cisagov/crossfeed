import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity,
  CreateDateColumn
} from 'typeorm';
import { Domain } from './domain';
import { Scan } from './scan';

@Entity()
@Index(['port', 'domain'], { unique: true })
export class Service extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne((type) => Domain, (domain) => domain.services, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domain: Domain;

  @ManyToOne((type) => Scan, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  discoveredBy: Scan;

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

  /** Censys Ipv4 results */
  @Column({
    type: 'jsonb',
    default: {}
  })
  censysIpv4Results: {
    [x: string]: any;
  };

  @Column({
    type: 'jsonb',
    default: {}
  })
  intrigueIdentResults: {
    fingerprint: {
      type: string;
      vendor: string;
      product: string;
      version: string;
      update: string;
      tags: string[];
      match_type: string;
      match_details: string;
      hide: boolean;
      cpe: string;
      issue?: string;
      task?: string;
      inference: boolean;
    }[];
    content: {
      type: string;
      name: string;
      hide?: boolean;
      issue?: boolean;
      task?: boolean;
      result?: boolean;
    }[];
  };
}
