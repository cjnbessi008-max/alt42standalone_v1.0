/**
 * 학습 진행 상황 라우트
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 간단한 메모리 저장소 (실제로는 데이터베이스 사용)
const progressStore = new Map<string, any>();

/**
 * POST /api/progress
 * 학습 진행 상황 저장
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { problemId, completed, timestamp } = req.body;

    // 임시 사용자 ID (실제로는 인증에서 가져옴)
    const userId = 'user_1';
    const key = `${userId}_${problemId}`;

    progressStore.set(key, {
      userId,
      problemId,
      completed,
      timestamp,
    });

    res.json({
      success: true,
      message: 'Progress saved successfully',
    });
  } catch (error) {
    console.error('Failed to save progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/progress/:userId
 * 사용자의 학습 진행 상황 조회
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const userProgress: any[] = [];

    progressStore.forEach((value, key) => {
      if (key.startsWith(userId)) {
        userProgress.push(value);
      }
    });

    res.json({
      success: true,
      data: userProgress,
    });
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as progressRoutes };
