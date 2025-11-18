import { AppDataSource } from '../config/database';
import { ErrorReason, QuestionError, ErrorCategory, ConfidenceLevel } from '../models';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

interface CreateErrorReasonDTO {
  questionErrorId: number;
  categoryId: number;
  userId: number;
  confidenceLevel?: ConfidenceLevel;
  studentNote?: string;
}

interface UpdateErrorReasonDTO {
  categoryId?: number;
  confidenceLevel?: ConfidenceLevel;
  studentNote?: string;
}

export class ErrorReasonService {
  private errorReasonRepo = AppDataSource.getRepository(ErrorReason);
  private questionErrorRepo = AppDataSource.getRepository(QuestionError);
  private categoryRepo = AppDataSource.getRepository(ErrorCategory);

  async createErrorReason(data: CreateErrorReasonDTO): Promise<ErrorReason> {
    try {
      // Verify question error exists
      const questionError = await this.questionErrorRepo.findOne({
        where: { id: data.questionErrorId },
      });

      if (!questionError) {
        throw new AppError('Question error not found', 404);
      }

      // Verify category exists
      const category = await this.categoryRepo.findOne({
        where: { id: data.categoryId, isActive: true },
      });

      if (!category) {
        throw new AppError('Error category not found or inactive', 404);
      }

      // Check if reason already exists for this question error
      const existing = await this.errorReasonRepo.findOne({
        where: {
          questionErrorId: data.questionErrorId,
          categoryId: data.categoryId,
        },
      });

      if (existing) {
        throw new AppError('Error reason already exists for this category', 400);
      }

      const errorReason = this.errorReasonRepo.create({
        questionErrorId: data.questionErrorId,
        categoryId: data.categoryId,
        userId: data.userId,
        confidenceLevel: data.confidenceLevel || ConfidenceLevel.PROBABLY,
        studentNote: data.studentNote,
      });

      await this.errorReasonRepo.save(errorReason);

      logger.info(`Error reason created: ${errorReason.id} by user ${data.userId}`);

      return await this.getErrorReasonById(errorReason.id);
    } catch (error) {
      logger.error('Error creating error reason:', error);
      throw error;
    }
  }

  async getErrorReasonById(id: number): Promise<ErrorReason> {
    const errorReason = await this.errorReasonRepo.findOne({
      where: { id },
      relations: ['category', 'questionError', 'user'],
    });

    if (!errorReason) {
      throw new AppError('Error reason not found', 404);
    }

    return errorReason;
  }

  async getErrorReasonsByUser(userId: number): Promise<ErrorReason[]> {
    return await this.errorReasonRepo.find({
      where: { userId },
      relations: ['category', 'questionError'],
      order: { createdAt: 'DESC' },
    });
  }

  async getErrorReasonsByQuestionError(
    questionErrorId: number
  ): Promise<ErrorReason[]> {
    return await this.errorReasonRepo.find({
      where: { questionErrorId },
      relations: ['category', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateErrorReason(
    id: number,
    userId: number,
    data: UpdateErrorReasonDTO
  ): Promise<ErrorReason> {
    const errorReason = await this.errorReasonRepo.findOne({
      where: { id, userId },
    });

    if (!errorReason) {
      throw new AppError('Error reason not found or unauthorized', 404);
    }

    if (data.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: data.categoryId, isActive: true },
      });

      if (!category) {
        throw new AppError('Error category not found or inactive', 404);
      }

      errorReason.categoryId = data.categoryId;
    }

    if (data.confidenceLevel) {
      errorReason.confidenceLevel = data.confidenceLevel;
    }

    if (data.studentNote !== undefined) {
      errorReason.studentNote = data.studentNote;
    }

    await this.errorReasonRepo.save(errorReason);

    logger.info(`Error reason updated: ${id} by user ${userId}`);

    return await this.getErrorReasonById(id);
  }

  async deleteErrorReason(id: number, userId: number): Promise<void> {
    const errorReason = await this.errorReasonRepo.findOne({
      where: { id, userId },
    });

    if (!errorReason) {
      throw new AppError('Error reason not found or unauthorized', 404);
    }

    await this.errorReasonRepo.remove(errorReason);

    logger.info(`Error reason deleted: ${id} by user ${userId}`);
  }

  async getUserErrorStats(userId: number, daysBack: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const query = this.errorReasonRepo
      .createQueryBuilder('er')
      .select('ec.nameKo', 'categoryName')
      .addSelect('ec.nameEn', 'categoryNameEn')
      .addSelect('COUNT(er.id)', 'count')
      .addSelect(
        `AVG(CASE
          WHEN er.confidenceLevel = '확실함' THEN 3
          WHEN er.confidenceLevel = '아마도' THEN 2
          ELSE 1
        END)`,
        'avgConfidence'
      )
      .innerJoin('er.category', 'ec')
      .where('er.userId = :userId', { userId })
      .andWhere('er.createdAt >= :startDate', { startDate })
      .groupBy('ec.id')
      .addGroupBy('ec.nameKo')
      .addGroupBy('ec.nameEn')
      .orderBy('count', 'DESC');

    return await query.getRawMany();
  }
}
