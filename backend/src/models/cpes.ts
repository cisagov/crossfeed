import { mapping } from 'src/tasks/censys/mapping';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    BaseEntity,
    Unique
} from 'typeorm';
import { Cves } from './cves';

@Entity()
@Unique(['cpe_product_name', 'version_number', 'vender'])
export class Cpes extends BaseEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string; //TODO: change this to something else??

    @Column()
    cpe_product_name: string;

    @Column()
    version_number: string;

    @Column()
    vender: string;

    @Column()
    last_seen: Date;

    @ManyToMany((type) => Cves, (cves) => cves.cpes)
    cves: Cves[];
}