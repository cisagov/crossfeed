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
import { SSLInfo } from './sslinfo';
import { WebInfo } from './webinfo';
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

  @OneToOne((type) => SSLInfo, (sslinfo) => sslinfo.domain, {
    nullable: true
  })
  ssl: SSLInfo;

  @OneToOne((type) => WebInfo, (webinfo) => webinfo.domain, {
    nullable: true
  })
  web: WebInfo;

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

  @BeforeInsert()
  setLowerCase() {
    this.name = this.name.toLowerCase();
  }

  @BeforeInsert()
  setReverseName() {
    this.reverseName = this.name.split('.').reverse().join('.');
  }
}
