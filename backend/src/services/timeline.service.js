const TimelineModel = require('../models/timeline.model');
const StepModel = require('../models/step.model');

class TimelineService {
  // 새 타임라인 생성 및 시작
  async startTimeline(data) {
    try {
      const timeline = await TimelineModel.create({
        student_id: data.student_id,
        student_name: data.student_name,
        module_id: data.module_id,
        problem_id: data.problem_id,
        equation: data.equation,
        initial_equation: data.equation,
        difficulty_level: data.difficulty_level
      });

      return {
        success: true,
        timeline
      };
    } catch (error) {
      console.error('Error starting timeline:', error);
      throw error;
    }
  }

  // 풀이 단계 추가
  async addStep(timelineId, stepData) {
    try {
      // 타임라인 존재 확인
      const timeline = await TimelineModel.findById(timelineId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }

      // 이미 완료된 타임라인인지 확인
      if (timeline.completed_at) {
        throw new Error('Timeline already completed');
      }

      // 다음 단계 번호 가져오기
      const lastStepNumber = await StepModel.getLastStepNumber(timelineId);

      const step = await StepModel.create({
        timeline_id: timelineId,
        step_number: lastStepNumber + 1,
        action_type: stepData.action_type,
        from_expression: stepData.from_expression,
        to_expression: stepData.to_expression,
        rule_applied: stepData.rule_applied,
        rule_category: stepData.rule_category,
        explanation: stepData.explanation,
        is_correct: stepData.is_correct,
        hint_used: stepData.hint_used,
        duration_ms: stepData.duration_ms,
        user_input: stepData.user_input
      });

      return {
        success: true,
        step
      };
    } catch (error) {
      console.error('Error adding step:', error);
      throw error;
    }
  }

  // 타임라인 완료
  async completeTimeline(timelineId, finalAnswer, isCorrect) {
    try {
      const timeline = await TimelineModel.complete(
        timelineId,
        finalAnswer,
        isCorrect
      );

      // 학생 진행 상황 업데이트
      await this.updateStudentProgress(timeline.student_id);

      return {
        success: true,
        timeline
      };
    } catch (error) {
      console.error('Error completing timeline:', error);
      throw error;
    }
  }

  // 타임라인 상세 정보 조회 (단계 포함)
  async getTimelineWithSteps(timelineId) {
    try {
      const timeline = await TimelineModel.findById(timelineId);
      if (!timeline) {
        throw new Error('Timeline not found');
      }

      const steps = await StepModel.findByTimelineId(timelineId);

      return {
        success: true,
        data: {
          ...timeline,
          steps
        }
      };
    } catch (error) {
      console.error('Error getting timeline:', error);
      throw error;
    }
  }

  // 학생별 타임라인 목록 조회
  async getStudentTimelines(studentId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const timelines = await TimelineModel.findByStudentId(
        studentId,
        limit,
        offset
      );

      return {
        success: true,
        data: timelines,
        pagination: {
          page,
          limit,
          total: timelines.length
        }
      };
    } catch (error) {
      console.error('Error getting student timelines:', error);
      throw error;
    }
  }

  // 학생 통계 조회
  async getStudentStats(studentId) {
    try {
      const stats = await TimelineModel.getStatsByStudentId(studentId);

      return {
        success: true,
        stats: stats || {
          total_attempts: 0,
          correct_count: 0,
          avg_steps: 0,
          avg_time: 0,
          success_rate: 0
        }
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      throw error;
    }
  }

  // 학생 진행 상황 업데이트 (내부 메서드)
  async updateStudentProgress(studentId) {
    try {
      const stats = await TimelineModel.getStatsByStudentId(studentId);

      const db = require('../config/database');
      await db.query(
        `INSERT INTO student_progress
         (id, student_id, total_problems_attempted, total_problems_solved,
          total_time_spent_seconds, average_steps_per_problem, success_rate, last_activity)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         total_problems_attempted = VALUES(total_problems_attempted),
         total_problems_solved = VALUES(total_problems_solved),
         total_time_spent_seconds = VALUES(total_time_spent_seconds),
         average_steps_per_problem = VALUES(average_steps_per_problem),
         success_rate = VALUES(success_rate),
         last_activity = NOW()`,
        [
          studentId,
          stats.total_attempts,
          stats.correct_count,
          Math.floor(stats.avg_time * stats.total_attempts),
          stats.avg_steps,
          stats.success_rate
        ]
      );
    } catch (error) {
      console.error('Error updating student progress:', error);
      // 진행 상황 업데이트 실패는 치명적이지 않으므로 에러를 throw하지 않음
    }
  }
}

module.exports = new TimelineService();
