import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import moodleService from './moodle.service.js';
import claudeService from './claude.service.js';

/**
 * 문제 관리 서비스
 */
class ProblemService {
  /**
   * 학생 정보 저장 또는 업데이트
   * @param {object} moodleUser - Moodle 사용자 정보
   * @returns {Promise<string>} - student_id
   */
  async saveOrUpdateStudent(moodleUser) {
    const existingStudent = await query(
      'SELECT id FROM students WHERE moodle_user_id = ?',
      [moodleUser.id]
    );

    if (existingStudent.length > 0) {
      // 업데이트
      await query(
        'UPDATE students SET username = ?, full_name = ?, email = ?, updated_at = NOW() WHERE moodle_user_id = ?',
        [moodleUser.username, moodleUser.fullname, moodleUser.email, moodleUser.id]
      );
      return existingStudent[0].id;
    } else {
      // 신규 생성
      const studentId = uuidv4();
      await query(
        'INSERT INTO students (id, moodle_user_id, username, full_name, email) VALUES (?, ?, ?, ?, ?)',
        [studentId, moodleUser.id, moodleUser.username, moodleUser.fullname, moodleUser.email]
      );
      return studentId;
    }
  }

  /**
   * 문제 저장 또는 업데이트
   * @param {object} problemData - 문제 데이터
   * @returns {Promise<string>} - problem_id
   */
  async saveOrUpdateProblem(problemData) {
    const existingProblem = await query(
      'SELECT id FROM problems WHERE moodle_question_id = ?',
      [problemData.moodleQuestionId]
    );

    if (existingProblem.length > 0) {
      return existingProblem[0].id;
    } else {
      const problemId = uuidv4();
      await query(
        `INSERT INTO problems (
          id, moodle_question_id, moodle_quiz_id, question_type,
          question_text, question_html, correct_answer
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          problemId,
          problemData.moodleQuestionId,
          problemData.quizId,
          problemData.type,
          problemData.question,
          problemData.questionHtml,
          problemData.correctAnswer
        ]
      );
      return problemId;
    }
  }

  /**
   * 문제 시도 기록 저장
   * @param {string} studentId
   * @param {string} problemId
   * @param {object} attemptData
   * @returns {Promise<string>} - attempt_id
   */
  async saveProblemAttempt(studentId, problemId, attemptData) {
    const attemptId = uuidv4();
    await query(
      `INSERT INTO problem_attempts (
        id, student_id, problem_id, moodle_attempt_id,
        student_answer, is_correct, score, time_spent_seconds, attempted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        studentId,
        problemId,
        attemptData.attemptId,
        attemptData.studentAnswer,
        attemptData.isCorrect,
        attemptData.points,
        attemptData.timeSpent,
        attemptData.attemptedAt
      ]
    );
    return attemptId;
  }

  /**
   * 추론 구조 저장
   * @param {string} problemId
   * @param {string} attemptId
   * @param {object} reasoning
   * @returns {Promise<string>} - reasoning_structure_id
   */
  async saveReasoningStructure(problemId, attemptId, reasoning) {
    const reasoningId = uuidv4();
    await query(
      `INSERT INTO reasoning_structures (
        id, problem_id, attempt_id,
        concepts, difficulty_assessment, prerequisites,
        reasoning_steps, student_approach,
        common_mistakes, related_concepts, next_recommended_topics,
        ai_model, analysis_quality_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reasoningId,
        problemId,
        attemptId,
        JSON.stringify(reasoning.concepts || []),
        reasoning.difficultyAssessment || 'medium',
        JSON.stringify(reasoning.prerequisites || []),
        JSON.stringify(reasoning.reasoningSteps || []),
        JSON.stringify(reasoning.studentApproach || {}),
        JSON.stringify(reasoning.studentApproach?.commonMistakes || []),
        JSON.stringify(reasoning.relatedConcepts || []),
        JSON.stringify(reasoning.nextRecommendedTopics || []),
        reasoning.aiModel,
        reasoning.analysisQualityScore
      ]
    );
    return reasoningId;
  }

  /**
   * 오늘 푼 문제들을 Moodle에서 가져와 DB에 저장하고 추론 구조 생성
   * @param {number} moodleUserId - Moodle 사용자 ID
   * @returns {Promise<object>}
   */
  async syncTodayProblems(moodleUserId) {
    try {
      // 1. Moodle에서 사용자 정보 및 오늘 문제 조회
      const moodleUser = await moodleService.getUserById(moodleUserId);
      if (!moodleUser) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      const todayProblems = await moodleService.getTodayProblems(moodleUserId);

      if (todayProblems.length === 0) {
        return {
          success: true,
          message: '오늘 푼 문제가 없습니다',
          problemCount: 0
        };
      }

      // 2. 학생 정보 저장
      const studentId = await this.saveOrUpdateStudent(moodleUser);

      // 3. 각 문제와 시도 기록 저장 및 추론 구조 생성
      const results = [];

      for (const problemData of todayProblems) {
        try {
          // 문제 저장
          const problemId = await this.saveOrUpdateProblem(problemData);

          // 시도 기록 저장
          const attemptId = await this.saveProblemAttempt(
            studentId,
            problemId,
            problemData
          );

          // AI 추론 구조 생성
          const reasoning = await claudeService.generateReasoningStructure(
            problemData
          );

          // 추론 구조 저장
          const reasoningId = await this.saveReasoningStructure(
            problemId,
            attemptId,
            reasoning
          );

          results.push({
            problemId,
            attemptId,
            reasoningId,
            success: true
          });

          // Rate limiting
          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to process problem:`, error);
          results.push({
            problem: problemData.question,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        success: true,
        message: `${successCount}/${todayProblems.length}개 문제 처리 완료`,
        problemCount: todayProblems.length,
        successCount,
        results
      };
    } catch (error) {
      console.error('Sync today problems failed:', error);
      throw error;
    }
  }

  /**
   * 오늘 푼 문제 목록 조회 (DB에서)
   * @param {string} studentId
   * @returns {Promise<Array>}
   */
  async getTodayProblems(studentId) {
    const sql = `
      SELECT
        p.id as problem_id,
        p.question_text,
        p.question_type,
        p.difficulty_level,
        pa.id as attempt_id,
        pa.student_answer,
        pa.is_correct,
        pa.score,
        pa.time_spent_seconds,
        pa.attempted_at,
        rs.concepts,
        rs.difficulty_assessment,
        rs.reasoning_steps,
        rs.student_approach,
        rs.related_concepts
      FROM problem_attempts pa
      JOIN problems p ON pa.problem_id = p.id
      LEFT JOIN reasoning_structures rs ON pa.id = rs.attempt_id
      WHERE pa.student_id = ?
        AND DATE(pa.attempted_at) = CURDATE()
      ORDER BY pa.attempted_at DESC
    `;

    const results = await query(sql, [studentId]);

    return results.map(row => ({
      problemId: row.problem_id,
      questionText: row.question_text,
      questionType: row.question_type,
      difficultyLevel: row.difficulty_level,
      attemptId: row.attempt_id,
      studentAnswer: row.student_answer,
      isCorrect: row.is_correct === 1,
      score: row.score,
      timeSpentSeconds: row.time_spent_seconds,
      attemptedAt: row.attempted_at,
      reasoning: {
        concepts: this.parseJSON(row.concepts),
        difficultyAssessment: row.difficulty_assessment,
        reasoningSteps: this.parseJSON(row.reasoning_steps),
        studentApproach: this.parseJSON(row.student_approach),
        relatedConcepts: this.parseJSON(row.related_concepts)
      }
    }));
  }

  /**
   * 특정 날짜의 문제 목록 조회
   * @param {string} studentId
   * @param {Date} date
   * @returns {Promise<Array>}
   */
  async getProblemsByDate(studentId, date) {
    const sql = `
      SELECT
        p.id as problem_id,
        p.question_text,
        p.question_type,
        p.difficulty_level,
        pa.id as attempt_id,
        pa.student_answer,
        pa.is_correct,
        pa.score,
        pa.time_spent_seconds,
        pa.attempted_at,
        rs.concepts,
        rs.difficulty_assessment,
        rs.reasoning_steps,
        rs.student_approach,
        rs.related_concepts
      FROM problem_attempts pa
      JOIN problems p ON pa.problem_id = p.id
      LEFT JOIN reasoning_structures rs ON pa.id = rs.attempt_id
      WHERE pa.student_id = ?
        AND DATE(pa.attempted_at) = ?
      ORDER BY pa.attempted_at DESC
    `;

    const dateStr = date.toISOString().split('T')[0];
    const results = await query(sql, [studentId, dateStr]);

    return results.map(row => ({
      problemId: row.problem_id,
      questionText: row.question_text,
      questionType: row.question_type,
      difficultyLevel: row.difficulty_level,
      attemptId: row.attempt_id,
      studentAnswer: row.student_answer,
      isCorrect: row.is_correct === 1,
      score: row.score,
      timeSpentSeconds: row.time_spent_seconds,
      attemptedAt: row.attempted_at,
      reasoning: {
        concepts: this.parseJSON(row.concepts),
        difficultyAssessment: row.difficulty_assessment,
        reasoningSteps: this.parseJSON(row.reasoning_steps),
        studentApproach: this.parseJSON(row.student_approach),
        relatedConcepts: this.parseJSON(row.related_concepts)
      }
    }));
  }

  /**
   * 학습 패턴 생성 및 저장
   * @param {string} studentId
   * @param {Date} date
   * @returns {Promise<object>}
   */
  async generateLearningPattern(studentId, date = new Date()) {
    const problems = await this.getProblemsByDate(studentId, date);

    if (problems.length === 0) {
      return null;
    }

    // AI로 학습 인사이트 생성
    const reasoningStructures = problems.map(p => p.reasoning);
    const insights = await claudeService.generateLearningInsights(
      problems,
      reasoningStructures
    );

    // 통계 계산
    const totalProblems = problems.length;
    const correctProblems = problems.filter(p => p.isCorrect).length;
    const accuracyRate = (correctProblems / totalProblems) * 100;
    const totalTimeMinutes = Math.round(
      problems.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0) / 60
    );

    // 개념 분석
    const conceptStats = this.analyzeConceptPerformance(problems);

    // 학습 패턴 저장
    const patternId = uuidv4();
    const dateStr = date.toISOString().split('T')[0];

    await query(
      `INSERT INTO learning_patterns (
        id, student_id, analysis_date,
        total_problems_attempted, problems_correct, problems_incorrect,
        accuracy_rate, total_time_spent_minutes,
        strong_concepts, weak_concepts, improving_concepts,
        learning_insights, recommended_focus_areas, study_tips
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_problems_attempted = VALUES(total_problems_attempted),
        problems_correct = VALUES(problems_correct),
        problems_incorrect = VALUES(problems_incorrect),
        accuracy_rate = VALUES(accuracy_rate),
        total_time_spent_minutes = VALUES(total_time_spent_minutes),
        strong_concepts = VALUES(strong_concepts),
        weak_concepts = VALUES(weak_concepts),
        learning_insights = VALUES(learning_insights),
        recommended_focus_areas = VALUES(recommended_focus_areas),
        study_tips = VALUES(study_tips),
        generated_at = NOW()
      `,
      [
        patternId,
        studentId,
        dateStr,
        totalProblems,
        correctProblems,
        totalProblems - correctProblems,
        accuracyRate,
        totalTimeMinutes,
        JSON.stringify(conceptStats.strong),
        JSON.stringify(conceptStats.weak),
        JSON.stringify(conceptStats.improving),
        insights.overallPerformance?.summary || '',
        JSON.stringify(insights.recommendations?.nextTopics || []),
        insights.recommendations?.studyTips || ''
      ]
    );

    return {
      patternId,
      date: dateStr,
      statistics: {
        totalProblems,
        correctProblems,
        accuracyRate,
        totalTimeMinutes
      },
      conceptStats,
      insights
    };
  }

  /**
   * 개념별 성취도 분석
   * @param {Array} problems
   * @returns {object}
   */
  analyzeConceptPerformance(problems) {
    const conceptMap = new Map();

    problems.forEach(problem => {
      const concepts = problem.reasoning?.concepts || [];
      concepts.forEach(concept => {
        if (!conceptMap.has(concept)) {
          conceptMap.set(concept, { correct: 0, total: 0 });
        }
        const stats = conceptMap.get(concept);
        stats.total++;
        if (problem.isCorrect) {
          stats.correct++;
        }
      });
    });

    const strong = [];
    const weak = [];
    const improving = [];

    conceptMap.forEach((stats, concept) => {
      const accuracy = (stats.correct / stats.total) * 100;
      if (accuracy >= 80) {
        strong.push(concept);
      } else if (accuracy < 50) {
        weak.push(concept);
      } else {
        improving.push(concept);
      }
    });

    return { strong, weak, improving };
  }

  /**
   * JSON 파싱 헬퍼
   * @param {string} jsonString
   * @returns {any}
   */
  parseJSON(jsonString) {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }

  /**
   * 딜레이 헬퍼
   * @param {number} ms
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ProblemService();
