import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Domain } from './domain';

@Entity()
@Index(['fingerprint'], { unique: true })
export class SSLInfo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany((type) => Domain, (domain) => domain.ssl, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  domain: Domain[];

  @Column({
    nullable: true,
    type: 'varchar'
  })
  issuerOrg: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  issuerCN: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  validFrom: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  validTo: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  protocol: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  altNames: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  bits: string | null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  fingerprint: string | null;
}
