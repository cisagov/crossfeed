import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Domain } from './domain';

@Entity()
export class SSLInfo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne((type) => Domain, (domain) => domain.ssl, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  domain: Domain | null;

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
