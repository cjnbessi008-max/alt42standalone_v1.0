import axios from 'axios';
import { AppDataSource } from '../config/database';
import { User, QuizAttempt, QuestionError, UserRole } from '../models';
import logger from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

interface MoodleConfig {
  url: string;
  token: string;
  serviceName: string;
}

interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface MoodleQuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  sumgrades: number;
  timestart: number;
  timefinish: number;
  state: string;
}

interface MoodleQuestion {
  slot: number;
  type: string;
  page: number;
  questionid: number;
  sequencecheck: number;
  questionsummary: string;
  rightanswer: string;
  responsesummary: string;
  mark: number;
  maxmark: number;
}

export class MoodleService {
  private config: MoodleConfig;
  private userRepo = AppDataSource.getRepository(User);
  private quizAttemptRepo = AppDataSource.getRepository(QuizAttempt);
  private questionErrorRepo = AppDataSource.getRepository(QuestionError);

  constructor() {
    this.config = {
      url: process.env.MOODLE_URL || '',
      token: process.env.MOODLE_WS_TOKEN || '',
      serviceName: process.env.MOODLE_SERVICE_NAME || 'moodle_mobile_app',
    };
  }

  /**
   * Call Moodle Web Service API
   */
  private async callMoodleWS(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await axios.get(`${this.config.url}/webservice/rest/server.php`, {
        params: {
          wstoken: this.config.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error');
      }

      return response.data;
    } catch (error: any) {
      logger.error(`Moodle WS Error (${wsfunction}):`, error.message);
      throw error;
    }
  }

  /**
   * Sync users from Moodle
   */
  async syncUsers(userIds?: number[]): Promise<number> {
    try {
      const criteria = userIds
        ? userIds.map((id) => ({ key: 'id', value: id.toString() }))
        : [{ key: 'id', value: '%' }];

      const moodleUsers: MoodleUser[] = await this.callMoodleWS(
        'core_user_get_users',
        { criteria }
      );

      let syncedCount = 0;

      for (const moodleUser of moodleUsers) {
        let user = await this.userRepo.findOne({
          where: { moodleUserId: moodleUser.id },
        });

        if (!user) {
          user = this.userRepo.create({
            moodleUserId: moodleUser.id,
            username: moodleUser.username,
            email: moodleUser.email,
            fullName: `${moodleUser.firstname} ${moodleUser.lastname}`,
            role: UserRole.STUDENT,
          });
        } else {
          user.email = moodleUser.email;
          user.fullName = `${moodleUser.firstname} ${moodleUser.lastname}`;
        }

        await this.userRepo.save(user);
        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} users from Moodle`);
      return syncedCount;
    } catch (error) {
      logger.error('Error syncing users from Moodle:', error);
      throw error;
    }
  }

  /**
   * Sync quiz attempts from Moodle
   */
  async syncQuizAttempts(quizId: number): Promise<number> {
    try {
      const attempts: MoodleQuizAttempt[] = await this.callMoodleWS(
        'mod_quiz_get_user_attempts',
        { quizid: quizId }
      );

      let syncedCount = 0;

      for (const attempt of attempts) {
        if (attempt.state !== 'finished') continue;

        // Get or create user
        let user = await this.userRepo.findOne({
          where: { moodleUserId: attempt.userid },
        });

        if (!user) {
          // Sync this user
          await this.syncUsers([attempt.userid]);
          user = await this.userRepo.findOne({
            where: { moodleUserId: attempt.userid },
          });
        }

        if (!user) continue;

        // Check if attempt already synced
        const existing = await this.quizAttemptRepo.findOne({
          where: { moodleAttemptId: attempt.id },
        });

        if (existing) continue;

        // Create quiz attempt record
        const quizAttempt = this.quizAttemptRepo.create({
          moodleQuizId: attempt.quiz,
          moodleAttemptId: attempt.id,
          userId: user.id,
          startedAt: new Date(attempt.timestart * 1000),
          completedAt: new Date(attempt.timefinish * 1000),
          score: attempt.sumgrades,
        });

        await this.quizAttemptRepo.save(quizAttempt);

        // Sync questions for this attempt
        await this.syncAttemptQuestions(quizAttempt.id, attempt.id, user.id);

        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} quiz attempts from Moodle`);
      return syncedCount;
    } catch (error) {
      logger.error('Error syncing quiz attempts from Moodle:', error);
      throw error;
    }
  }

  /**
   * Sync questions for a specific attempt
   */
  private async syncAttemptQuestions(
    attemptId: number,
    moodleAttemptId: number,
    userId: number
  ): Promise<void> {
    try {
      const attemptReview = await this.callMoodleWS('mod_quiz_get_attempt_review', {
        attemptid: moodleAttemptId,
      });

      const questions: MoodleQuestion[] = attemptReview.questions || [];

      for (const question of questions) {
        const isCorrect = question.mark === question.maxmark;

        // Only save incorrect answers
        if (isCorrect) continue;

        const questionError = this.questionErrorRepo.create({
          attemptId,
          userId,
          moodleQuestionId: question.questionid,
          questionText: question.questionsummary,
          questionType: question.type,
          correctAnswer: question.rightanswer,
          studentAnswer: question.responsesummary,
          isCorrect: false,
        });

        await this.questionErrorRepo.save(questionError);
      }
    } catch (error) {
      logger.error('Error syncing attempt questions:', error);
    }
  }

  /**
   * Get pending errors (errors without reasons)
   */
  async getPendingErrors(userId: number): Promise<QuestionError[]> {
    const errors = await this.questionErrorRepo
      .createQueryBuilder('qe')
      .leftJoinAndSelect('qe.errorReasons', 'er')
      .where('qe.userId = :userId', { userId })
      .andWhere('qe.isCorrect = false')
      .andWhere('er.id IS NULL')
      .orderBy('qe.createdAt', 'DESC')
      .getMany();

    return errors;
  }

  /**
   * Manual sync trigger for all quizzes
   */
  async syncAllQuizzes(): Promise<{ totalAttempts: number; totalUsers: number }> {
    try {
      // This is a simplified version - you would need to get quiz IDs from Moodle
      // For now, we'll return a placeholder

      logger.info('Manual sync triggered for all quizzes');

      return {
        totalAttempts: 0,
        totalUsers: 0,
      };
    } catch (error) {
      logger.error('Error in manual sync:', error);
      throw error;
    }
  }
}
