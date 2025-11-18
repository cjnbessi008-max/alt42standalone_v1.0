import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface CreateRoutineRecordDto {
  userId: string;
  routineTypeId: string;
  moodleQuizId?: number;
  moodleAttemptId?: number;
  triggerReason: string;
}

export interface CompleteRoutineDto {
  routineRecordId: string;
  rating?: number;
  feedback?: string;
  duration?: number;
}

class RoutineService {
  /**
   * 모든 활성 루틴 타입 가져오기
   */
  async getAllRoutineTypes() {
    try {
      return await prisma.routineType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('Error fetching routine types:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 루틴 타입 가져오기
   */
  async getRoutineTypesByCategory(category: string) {
    try {
      return await prisma.routineType.findMany({
        where: {
          category,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('Error fetching routine types by category:', error);
      throw error;
    }
  }

  /**
   * 사용자에게 추천 루틴 선택
   */
  async recommendRoutine(userId: string): Promise<any> {
    try {
      // 사용자 통계 가져오기
      const stats = await prisma.userStatistics.findUnique({
        where: { userId },
      });

      // 사용자의 최근 루틴 기록 가져오기
      const recentRoutines = await prisma.routineRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { routineType: true },
      });

      // 각 카테고리별 사용 빈도 계산
      const categoryFrequency: Record<string, number> = {};
      recentRoutines.forEach((record) => {
        const category = record.routineType.category;
        categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
      });

      // 가장 적게 사용한 카테고리 찾기 (다양성 증가)
      const allCategories = ['breathing', 'meditation', 'stretching', 'break', 'message'];
      let leastUsedCategory = allCategories[0];
      let minFrequency = Infinity;

      allCategories.forEach((category) => {
        const frequency = categoryFrequency[category] || 0;
        if (frequency < minFrequency) {
          minFrequency = frequency;
          leastUsedCategory = category;
        }
      });

      // 해당 카테고리에서 루틴 선택
      const routines = await this.getRoutineTypesByCategory(leastUsedCategory);

      if (routines.length === 0) {
        // 카테고리에 루틴이 없으면 전체에서 랜덤 선택
        const allRoutines = await this.getAllRoutineTypes();
        return allRoutines[Math.floor(Math.random() * allRoutines.length)];
      }

      // 가장 높은 평점을 받은 루틴 우선 선택
      const routineIds = routines.map((r) => r.id);
      const ratings = await prisma.routineRecord.groupBy({
        by: ['routineTypeId'],
        where: {
          userId,
          routineTypeId: { in: routineIds },
          rating: { not: null },
        },
        _avg: {
          rating: true,
        },
      });

      // 평점이 높은 순으로 정렬
      const routineWithRatings = routines.map((routine) => {
        const ratingData = ratings.find((r) => r.routineTypeId === routine.id);
        return {
          ...routine,
          avgRating: ratingData?._avg.rating || 0,
        };
      });

      routineWithRatings.sort((a, b) => b.avgRating - a.avgRating);

      // 상위 3개 중 랜덤 선택 (다양성 유지)
      const topRoutines = routineWithRatings.slice(0, 3);
      return topRoutines[Math.floor(Math.random() * topRoutines.length)];
    } catch (error) {
      logger.error('Error recommending routine:', error);
      throw error;
    }
  }

  /**
   * 루틴 실행 기록 생성
   */
  async createRoutineRecord(data: CreateRoutineRecordDto) {
    try {
      const record = await prisma.routineRecord.create({
        data: {
          userId: data.userId,
          routineTypeId: data.routineTypeId,
          moodleQuizId: data.moodleQuizId,
          moodleAttemptId: data.moodleAttemptId,
          triggerReason: data.triggerReason,
        },
        include: {
          routineType: true,
        },
      });

      // 사용자 통계 업데이트
      await this.updateUserStatistics(data.userId);

      return record;
    } catch (error) {
      logger.error('Error creating routine record:', error);
      throw error;
    }
  }

  /**
   * 루틴 완료 처리
   */
  async completeRoutine(data: CompleteRoutineDto) {
    try {
      const record = await prisma.routineRecord.update({
        where: { id: data.routineRecordId },
        data: {
          completed: true,
          completedAt: new Date(),
          rating: data.rating,
          feedback: data.feedback,
          duration: data.duration,
        },
        include: {
          routineType: true,
        },
      });

      // 사용자 통계 업데이트
      await this.updateUserStatistics(record.userId);

      return record;
    } catch (error) {
      logger.error('Error completing routine:', error);
      throw error;
    }
  }

  /**
   * 사용자 통계 업데이트
   */
  async updateUserStatistics(userId: string) {
    try {
      const records = await prisma.routineRecord.findMany({
        where: { userId },
      });

      const completedRecords = records.filter((r) => r.completed);
      const totalDuration = completedRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
      const ratingsRecords = completedRecords.filter((r) => r.rating !== null);
      const averageRating =
        ratingsRecords.length > 0
          ? ratingsRecords.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsRecords.length
          : null;

      // 가장 많이 사용한 루틴 타입 찾기
      const routineTypeCount: Record<string, number> = {};
      completedRecords.forEach((record) => {
        routineTypeCount[record.routineTypeId] =
          (routineTypeCount[record.routineTypeId] || 0) + 1;
      });

      let favoriteRoutineTypeId: string | null = null;
      let maxCount = 0;
      Object.entries(routineTypeCount).forEach(([typeId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteRoutineTypeId = typeId;
        }
      });

      const lastRoutine = records.length > 0 ? records[records.length - 1].createdAt : null;

      await prisma.userStatistics.upsert({
        where: { userId },
        create: {
          userId,
          totalRoutines: records.length,
          completedRoutines: completedRecords.length,
          totalDuration,
          averageRating,
          favoriteRoutineTypeId,
          lastRoutineAt: lastRoutine,
        },
        update: {
          totalRoutines: records.length,
          completedRoutines: completedRecords.length,
          totalDuration,
          averageRating,
          favoriteRoutineTypeId,
          lastRoutineAt: lastRoutine,
        },
      });

      logger.info(`Updated statistics for user ${userId}`);
    } catch (error) {
      logger.error('Error updating user statistics:', error);
      throw error;
    }
  }

  /**
   * 사용자의 루틴 기록 가져오기
   */
  async getUserRoutineRecords(userId: string, limit: number = 20) {
    try {
      return await prisma.routineRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          routineType: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching user routine records:', error);
      throw error;
    }
  }

  /**
   * 사용자 통계 가져오기
   */
  async getUserStatistics(userId: string) {
    try {
      return await prisma.userStatistics.findUnique({
        where: { userId },
      });
    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      throw error;
    }
  }
}

export default new RoutineService();
