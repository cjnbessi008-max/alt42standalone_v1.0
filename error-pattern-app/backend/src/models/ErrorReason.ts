import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QuestionError } from './QuestionError';
import { ErrorCategory } from './ErrorCategory';
import { User } from './User';

export enum ConfidenceLevel {
  CERTAIN = '확실함',
  PROBABLY = '아마도',
  UNCERTAIN = '잘 모르겠음',
}

@Entity('error_reasons')
export class ErrorReason {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index()
  questionErrorId!: number;

  @Column({ type: 'int' })
  categoryId!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.PROBABLY,
  })
  confidenceLevel!: ConfidenceLevel;

  @Column({ type: 'text', nullable: true })
  studentNote?: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => QuestionError, (error) => error.errorReasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionErrorId' })
  questionError!: QuestionError;

  @ManyToOne(() => ErrorCategory, (category) => category.errorReasons)
  @JoinColumn({ name: 'categoryId' })
  category!: ErrorCategory;

  @ManyToOne(() => User, (user) => user.errorReasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
