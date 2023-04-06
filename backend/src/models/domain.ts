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
import { Webpage } from './webpage';

@Entity()
@Index(['name', 'organization'], { unique: true })
export class Domain extends BaseEntity {
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

  @Column({
    nullable: true
  })
  ip: string;

  /** Associated root domain that led to the discovery of this domain. */
  @Column({
    nullable: true
  })
  fromRootDomain: string;

  /** Scan that discovered this domain (findomain, amass) */
  @Column({
    nullable: true
  })
  subdomainSource: string;

  /** Set to true if the domain only has an associated IP address, but not a domain name. In this case, the `name` field is set to the IP address. */
  @Column({
    nullable: true,
    default: false
  })
  ipOnly: boolean;

  @ManyToOne((type) => Scan, {
    onDelete: 'SET NULL',
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

  @OneToMany((type) => Webpage, (webpage) => webpage.domain)
  webpages: Service[];

  @ManyToOne((type) => Organization, { onDelete: 'CASCADE', nullable: false })
  organization: Organization;

  @Column({
    length: 512,
    nullable: true,
    type: 'varchar'
  })
  screenshot: string | null;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 64
  })
  country: string | null;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 16
  })
  asn: string | null;

  @Column({
    default: false
  })
  cloudHosted: boolean;

  /** SSL Certificate information  */
  @Column({
    type: 'jsonb',
    nullable: true
  })
  ssl: {
    issuerOrg?: string;
    issuerCN?: string;
    validFrom?: string;
    validTo?: string;
    protocol?: string;
    altNames?: string[];
    bits?: string;
    fingerprint?: string;
    valid?: boolean;
  } | null;

  /** Censys Certificates results */
  @Column({
    type: 'jsonb',
    default: {}
  })
  censysCertificatesResults: {
    [x: string]: any;
  };

  @BeforeInsert()
  setLowerCase() {
    this.name = this.name.toLowerCase();
  }

  @BeforeInsert()
  setReverseName() {
    this.reverseName = this.name.split('.').reverse().join('.');
  }
}
