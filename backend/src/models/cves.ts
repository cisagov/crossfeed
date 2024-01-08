import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  BaseEntity,
  JoinTable,
  Unique
} from 'typeorm';
import { Cpes } from './cpes';

@Entity()
@Unique(['cve_name'])
export class Cves extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  cve_uid: string;

  @Column({ nullable: true })
  cve_name: string;

  @CreateDateColumn()
  published_date: Date;

  @UpdateDateColumn()
  last_modified_date: Date;

  @Column({ nullable: true })
  vuln_status: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  cvss_v2_source: string;

  @Column({ nullable: true })
  cvss_v2_type: string;

  @Column({ nullable: true })
  cvss_v2_version: string;

  @Column({ nullable: true })
  cvss_v2_vector_string: string;

  @Column({ nullable: true })
  cvss_v2_base_score: string;

  @Column({ nullable: true })
  cvss_v2_base_severity: string;

  @Column({ nullable: true })
  cvss_v2_exploitability_score: string;

  @Column({ nullable: true })
  cvss_v2_impact_score: string;

  @Column({ nullable: true })
  cvss_v3_source: string;

  @Column({ nullable: true })
  cvss_v3_type: string;

  @Column({ nullable: true })
  cvss_v3_version: string;

  @Column({ nullable: true })
  cvss_v3_vector_string: string;

  @Column({ nullable: true })
  cvss_v3_base_score: string;

  @Column({ nullable: true })
  cvss_v3_base_severity: string;

  @Column({ nullable: true })
  cvss_v3_exploitability_score: string;

  @Column({ nullable: true })
  cvss_v3_impact_score: string;

  @Column({ nullable: true })
  cvss_v4_source: string;

  @Column({ nullable: true })
  cvss_v4_type: string;

  @Column({ nullable: true })
  cvss_v4_version: string;

  @Column({ nullable: true })
  cvss_v4_vector_string: string;

  @Column({ nullable: true })
  cvss_v4_base_score: string;

  @Column({ nullable: true })
  cvss_v4_base_severity: string;

  @Column({ nullable: true })
  cvss_v4_exploitability_score: string;

  @Column({ nullable: true })
  cvss_v4_impact_score: string;

  @Column('simple-array', { nullable: true })
  weaknesses: string[];

  @Column('simple-array', { nullable: true })
  reference_urls: string[];

  @Column('simple-array', { nullable: true })
  cpe_list: string[];

  @ManyToMany(() => Cpes, (cpes) => cpes.cves, { cascade: true })
  @JoinTable()
  cpes: Cpes[];
}
