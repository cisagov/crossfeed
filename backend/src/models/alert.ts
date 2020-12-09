import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  ManyToOne
} from 'typeorm';
import { User } from './';

export enum AlertType {
  NEW_DOMAIN = 'newDomain',
  NEW_VULNERABILITY = 'newVulnerability'
}

@Entity()
export class Alert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Alert type. */
  @Column({
    type: 'enum',
    enum: AlertType
  })
  type: AlertType;

  /** How often the alert should be processed / notifications sent (if any), in seconds */
  @Column()
  frequency: number;

  /** When this model was last run through the notifier. */
  @Column({
    type: 'timestamp',
    nullable: true
  })
  notifiedAt: Date | null;

  /** When (the minimum time) this model should next be run through the notifier. */
  @Column({
    type: 'timestamp',
    nullable: true
  })
  nextNotifiedAt: Date | null;

  /** User associated with this alert. */
  @ManyToOne((type) => User, (user) => user.alerts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false
  })
  user: User;
}
