import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Domain } from './domain';
import { Scan } from './scan';

@Entity()
@Index(['url', 'domain'], { unique: true })
export class Webpage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** When this model was last synced with Elasticsearch. */
  @Column({
    type: 'timestamp',
    nullable: true
  })
  syncedAt: Date | null;

  @ManyToOne((type) => Domain, (domain) => domain.webpages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domain: Domain;

  @ManyToOne((type) => Scan, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  })
  discoveredBy: Scan;

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  lastSeen: Date | null;

  /** S3 key that corresponds to this webpage's contents. */
  @Column({
    nullable: true,
    type: 'varchar'
  })
  s3Key: string | null;

  @Column({
    type: 'varchar'
  })
  url: string;

  @Column({
    type: 'numeric'
  })
  status: number;

  @Column({
    type: 'numeric',
    nullable: true
  })
  responseSize: number | null;

  @Column({
    type: 'jsonb',
    default: []
  })
  headers: { name: string; value: string }[];
}
