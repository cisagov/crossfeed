import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Domain } from "./domain";

@Entity()
export class WebInfo extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne((type) => Domain, (domain) => domain.ssl, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  domain: Domain | null;

  @Column({
    nullable: true,
    type: "varchar",
    length: 512,
  })
  frameworks: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  cms: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  widgets: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  fonts: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  analytics: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  webServers: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  operatingSystems: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  socialUrls: string | null;

  @Column({
    nullable: true,
    type: "varchar",
  })
  gaKeys: string | null;
}
