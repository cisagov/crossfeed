import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    BaseEntity,
    Unique
} from 'typeorm';

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
}