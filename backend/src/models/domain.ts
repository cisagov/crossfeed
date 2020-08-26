import {
  Entity,
  Index,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  BeforeInsert,
  ManyToOne
} from 'typeorm';
import { Service } from './service';
import { Organization } from './organization';
import { Vulnerability } from './vulnerability';
import { Scan } from './scan';

@Entity()
@Index(['name', 'organization'], { unique: true })
export class Domain extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    nullable: true
  })
  ip: string;

  /** Associated root domain that led to the discovery of this domain. */
  @Column({
    nullable: true
  })
  fromRootDomain: string;

  @ManyToOne((type) => Scan, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  discoveredBy: Scan;

  @Column({
    length: 512
  })
  reverseName: string;

  @Column({
    length: 512
  })
  name: string;

  @OneToMany((type) => Service, (service) => service.domain)
  services: Service[];

  @OneToMany((type) => Vulnerability, (vulnerability) => vulnerability.domain)
  vulnerabilities: Vulnerability[];

  @ManyToOne((type) => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column({
    length: 512,
    nullable: true,
    type: 'varchar'
  })
  screenshot: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  country: string | null;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  asn: string | null;

  @Column({
    default: false
  })
  cloudHosted: boolean;

  /** Wappalyzer output */
  @Column({
    type: 'jsonb',
    default: []
  })
  webTechnologies: {
    name: string;
    slug: string;
    version: string;
    icon: string;
    website: string;
    confidence: number;
    cpe?: string;
    categories: {
      name: string;
      slug: string;
      id: number;
    }[];
  }[];

  /** SSL Certificate information  */
  @Column({
    type: 'jsonb',
    nullable: true
  })
  ssl: {
    issuerOrg: string;
    issuerCN: string;
    validFrom: string;
    validTo: string;
    protocol: string;
    altNames: string;
    bits: string;
    fingerprint: string;
  } | null;

  @BeforeInsert()
  setLowerCase() {
    this.name = this.name.toLowerCase();
  }

  @BeforeInsert()
  setReverseName() {
    this.reverseName = this.name.split('.').reverse().join('.');
  }
}
