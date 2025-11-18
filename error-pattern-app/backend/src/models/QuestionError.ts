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
import { QuizAttempt } from './QuizAttempt';
import { User } from './User';
import { ErrorReason } from './ErrorReason';

@Entity('question_errors')
export class QuestionError {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @Index()
  attemptId!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  @Index()
  moodleQuestionId!: number;

  @Column({ type: 'text', nullable: true })
  questionText?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  questionType?: string;

  @Column({ type: 'text', nullable: true })
  correctAnswer?: string;

  @Column({ type: 'text', nullable: true })
  studentAnswer?: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isCorrect!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => QuizAttempt, (attempt) => attempt.questionErrors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt!: QuizAttempt;

  @ManyToOne(() => User, (user) => user.questionErrors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => ErrorReason, (reason) => reason.questionError)
  errorReasons?: ErrorReason[];
}
