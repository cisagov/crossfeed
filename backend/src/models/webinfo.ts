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
export class WebInfo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne((type) => Domain, (domain) => domain.ssl, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  domain: Domain | null;

  // Wappalyzer output
  @Column({
    type: 'jsonb'
  })
  technologies: {
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
}
