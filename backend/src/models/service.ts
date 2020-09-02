import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Domain } from './domain';
import { Scan } from './scan';

interface Product {
  // Common name
  name: string;
  // Product name
  product?: string;
  // Product vendor
  vendor?: string;
  // Product version
  version: string;
  // Product version revision
  revision?: string;
  // CPE without version (unique identifier)
  cpe?: string;
  // Optional icon
  icon?: string;
  // Optional description
  description?: string;
  // Tags
  tags: string[];
}

@Entity()
@Index(['port', 'domain'], { unique: true })
export class Service extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne((type) => Domain, (domain) => domain.services, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domain: Domain;

  @ManyToOne((type) => Scan, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  discoveredBy: Scan;

  @Column()
  port: number;

  @Column({
    nullable: true,
    type: 'varchar'
  })
  service: string | null;

  @Column({
    nullable: true,
    type: 'timestamp'
  })
  lastSeen: Date | null;

  @Column({
    nullable: true,
    type: 'text'
  })
  banner: string | null;

  @Column({
    type: 'jsonb',
    default: []
  })
  products: Product[];

  /** Censys Metadata */
  @Column({
    type: 'jsonb',
    default: {}
  })
  censysMetadata: {
    product: string;
    revision: string;
    description: string;
    version: string;
    manufacturer: string;
  } | null;

  /** Censys Ipv4 results */
  @Column({
    type: 'jsonb',
    default: {}
  })
  censysIpv4Results: {
    [x: string]: any;
  };

  /** Wappalyzer output */
  @Column({
    type: 'jsonb',
    default: []
  })
  wappalyzerResults: {
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

  @BeforeInsert()
  @BeforeUpdate()
  setProducts() {
    const products: { [cpe: string]: Product } = {};
    const misc: Product[] = [];
    if (this.wappalyzerResults) {
      for (const wappalyzerResult of this.wappalyzerResults) {
        const product = {
          name: wappalyzerResult.name,
          version: wappalyzerResult.version,
          cpe: wappalyzerResult.cpe,
          icon: wappalyzerResult.icon,
          tags: wappalyzerResult.categories.map((cat) => cat.name)
        };
        if (wappalyzerResult.cpe) products[wappalyzerResult.cpe] = product;
        else misc.push(product);
      }
    }

    if (this.censysMetadata) {
      let cpe;

      if (this.censysMetadata.manufacturer && this.censysMetadata.product) {
        // TODO: Improve methods for getting CPEs from Censys
        // See https://www.napier.ac.uk/~/media/worktribe/output-1500093/identifying-vulnerabilities-using-internet-wide-scanning-data.pdf
        // and https://github.com/TheHairyJ/Scout
        cpe = `cpe:/a:${this.censysMetadata.manufacturer}:${this.censysMetadata.product}`.toLowerCase();
      }
      const product = {
        name: this.censysMetadata.product,
        version: this.censysMetadata.version,
        description: this.censysMetadata.description,
        product: this.censysMetadata.product,
        revision: this.censysMetadata.revision,
        cpe,
        tags: []
      };
      if (cpe) products[cpe] = product;
      else misc.push(product);
    }

    this.products = Object.values(products);
  }
}
