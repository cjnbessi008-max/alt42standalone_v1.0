import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { QuestionError } from './QuestionError';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index()
  moodleQuizId!: number;

  @Column({ type: 'int', unique: true, nullable: true })
  @Index()
  moodleAttemptId?: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  quizName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gradeLevel?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  completedAt?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore?: number;

  @CreateDateColumn({ type: 'timestamp' })
  syncedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => QuestionError, (error) => error.attempt)
  questionErrors?: QuestionError[];
}
