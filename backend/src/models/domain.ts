import {
  Entity,
  Index,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  OneToOne,
  BeforeInsert,
  ManyToOne
} from 'typeorm';
import { Service } from './service';
import { Organization } from './organization';

@Entity()
@Index(['name'], { unique: true })
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
