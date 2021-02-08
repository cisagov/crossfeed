import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  UpdateDateColumn
} from 'typeorm';
import { Domain } from './domain';
import { Scan } from './scan';
import { CpeParser } from '@thefaultvault/tfv-cpe-parser';

const filterProducts = (product: Product) => {
  // Filter out false positives.
  const { cpe, version } = product;
  if (cpe?.includes('apache:tomcat') && version === '1.1') {
    // Wappalyzer incorrectly detects "Apache Tomcat 1.1"
    // https://github.com/AliasIO/wappalyzer/issues/3305
    return false;
  }
  if (cpe?.includes('apache:coyote') && version === '1.1') {
    // Intrigue Ident incorrectly detects "Apache Coyote 1.1"
    // https://github.com/intrigueio/intrigue-ident/issues/51
    return false;
  }
  if (cpe?.includes('generic:unauthorized')) {
    // Intrigue Ident sometimes detects "Unauthorized" CPEs
    return false;
  }
  if (
    cpe?.includes('f5:big-ip_application_security_manager:14.0.0_and_later')
  ) {
    // Intrigue Ident returns an invalid CPE version. TODO: ignore all invalid versions in CPEs.
    return false;
  }
  return true;
};

export interface Product {
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

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne((type) => Domain, (domain) => domain.services, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  domain: Domain;

  @ManyToOne((type) => Scan, {
    onDelete: 'SET NULL',
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

  @Column({
    type: 'jsonb',
    default: {}
  })
  intrigueIdentResults: {
    fingerprint: {
      type: string;
      vendor: string;
      product: string;
      version: string;
      update: string;
      tags: string[];
      match_type: string;
      match_details: string;
      hide: boolean;
      cpe: string;
      issue?: string;
      task?: string;
      inference: boolean;
    }[];
    content: {
      type: string;
      name: string;
      hide?: boolean;
      issue?: boolean;
      task?: boolean;
      result?: boolean;
    }[];
  };

  /** Shodan results */
  @Column({
    type: 'jsonb',
    default: {}
  })
  shodanResults: {
    product: string;
    version: string;
    cpe?: string[];
  } | null;

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
    const products: Product[] = [];
    if (this.wappalyzerResults) {
      for (const wappalyzerResult of this.wappalyzerResults) {
        const product = {
          name: wappalyzerResult.name,
          version: wappalyzerResult.version,
          cpe: wappalyzerResult.cpe,
          icon: wappalyzerResult.icon,
          tags: wappalyzerResult.categories.map((cat) => cat.name)
        };
        products.push(product);
      }
    }

    if (this.intrigueIdentResults?.fingerprint) {
      for (const result of this.intrigueIdentResults.fingerprint) {
        const product = {
          name: result.product,
          version: result.version,
          // Convert "cpe:2.3:" to "cpe:/"
          cpe: result.cpe?.replace(/^cpe:2\.3:/, 'cpe:/'),
          tags: result.tags,
          vendor: result.vendor,
          revision: result.update
        };
        products.push(product);
      }
    }

    // Shodan stores all CPEs in the cpe array,
    // but stores product name / version in the product and version
    // keys for only one of those CPEs, so those two keys
    // are not useful for our purposes.
    if (this.shodanResults?.cpe && this.shodanResults.cpe.length > 0) {
      for (const cpe of this.shodanResults.cpe) {
        const parser = new CpeParser();
        const parsed = parser.parse(cpe);
        const product: Product = {
          name: parsed.product,
          version: parsed.version,
          vendor: parsed.vendor,
          cpe,
          tags: []
        };
        products.push(product);
      }
    }

    if (this.censysMetadata && Object.values(this.censysMetadata).length > 0) {
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
      products.push(product);
    }

    const productDict: { [cpe: string]: Product } = {};
    const misc: Product[] = [];

    for (const product of products) {
      for (const prop in product) {
        if (!product[prop]) delete product[prop];
      }
      if (product.cpe && productDict[product.cpe])
        productDict[product.cpe] = { ...productDict[product.cpe], ...product };
      else if (product.cpe) productDict[product.cpe] = product;
      else misc.push(product);
    }

    this.products = Object.values(productDict)
      .concat(misc)
      .filter(filterProducts);
  }
}
