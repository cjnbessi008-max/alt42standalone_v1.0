import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ErrorReason } from './ErrorReason';

@Entity('error_categories')
export class ErrorCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nameKo!: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string;

  @Column({ type: 'int', default: 0 })
  @Index()
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  // Relations
  @OneToMany(() => ErrorReason, (reason) => reason.category)
  errorReasons?: ErrorReason[];
}
