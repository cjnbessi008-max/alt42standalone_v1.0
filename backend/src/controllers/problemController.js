/**
 * Problem Controller
 * Unfolding Net 문제 API 컨트롤러
 */

import { ProblemModel } from '../models/ProblemModel.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 문제 조회
 */
export async function getProblem(req, res) {
  try {
    const { courseId, moduleId } = req.query;

    if (!courseId || !moduleId) {
      return res.status(400).json({
        success: false,
        error: 'courseId and moduleId are required',
      });
    }

    let problem = await ProblemModel.findByModuleId(courseId, moduleId);

    // 문제가 없으면 더미 데이터 반환 (개발용)
    if (!problem) {
      problem = getDummyProblem(courseId, moduleId);
    }

    // TypeScript 타입에 맞게 변환
    const response = {
      id: problem.id,
      type: problem.type,
      difficulty: problem.difficulty,
      title: problem.title,
      description: problem.description,
      ...(problem.config && typeof problem.config === 'string'
        ? JSON.parse(problem.config)
        : problem.config),
    };

    return res.json({
      success: true,
      data: response,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in getProblem:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
      timestamp: Date.now(),
    });
  }
}

/**
 * 코스의 모든 문제 조회
 */
export async function getProblems(req, res) {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: 'courseId is required',
      });
    }

    const problems = await ProblemModel.findByCourseId(courseId);

    // 데이터가 없으면 더미 데이터 반환
    const results = problems.length > 0
      ? problems.map(p => ({
          id: p.id,
          type: p.type,
          difficulty: p.difficulty,
          title: p.title,
          description: p.description,
          ...(p.config && typeof p.config === 'string'
            ? JSON.parse(p.config)
            : p.config),
        }))
      : [getDummyProblem(courseId, 'default')];

    return res.json({
      success: true,
      data: results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in getProblems:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
      timestamp: Date.now(),
    });
  }
}

/**
 * 학생 진행 상황 저장
 */
export async function saveProgress(req, res) {
  try {
    const { problemId, progress, interactionData } = req.body;

    if (!problemId || progress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'problemId and progress are required',
      });
    }

    // TODO: 실제 DB에 저장하는 로직 구현
    // 현재는 성공 응답만 반환
    console.log('Progress saved:', { problemId, progress, interactionData });

    return res.json({
      success: true,
      data: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in saveProgress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save progress',
      timestamp: Date.now(),
    });
  }
}

/**
 * 새 문제 생성 (관리자용)
 */
export async function createProblem(req, res) {
  try {
    const { courseId, moduleId, type, difficulty, title, description, config } = req.body;

    if (!courseId || !moduleId || !type || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const problemData = {
      id: uuidv4(),
      courseId,
      moduleId,
      type,
      difficulty: difficulty || 1,
      title,
      description: description || '',
      config: config || {},
    };

    const newProblem = await ProblemModel.create(problemData);

    return res.status(201).json({
      success: true,
      data: newProblem,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in createProblem:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create problem',
      timestamp: Date.now(),
    });
  }
}

/**
 * 개발용 더미 데이터
 */
function getDummyProblem(courseId, moduleId) {
  return {
    id: `dummy-${courseId}-${moduleId}`,
    course_id: courseId,
    module_id: moduleId,
    type: 'cube',
    difficulty: 1,
    title: '정육면체 전개도',
    description: '정육면체를 펼쳐서 전개도를 관찰해보세요.',
    config: {
      initialViewAngle: {
        azimuth: 45,
        polar: 30,
      },
    },
  };
}
