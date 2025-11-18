import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { QuizAttempt } from './QuizAttempt';
import { QuestionError } from './QuestionError';
import { ErrorReason } from './ErrorReason';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true, unique: true })
  @Index()
  moodleUserId?: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  @Index()
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
  quizAttempts?: QuizAttempt[];

  @OneToMany(() => QuestionError, (error) => error.user)
  questionErrors?: QuestionError[];

  @OneToMany(() => ErrorReason, (reason) => reason.user)
  errorReasons?: ErrorReason[];
}
