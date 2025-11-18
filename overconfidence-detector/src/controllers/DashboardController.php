<?php
/**
 * Dashboard Controller
 * 교사 대시보드 컨트롤러
 */

namespace OverconfidenceDetector\Controllers;

use OverconfidenceDetector\Utils\Database;
use OverconfidenceDetector\Services\DetectionEngine;

class DashboardController
{
    private $db;
    private $detectionEngine;

    public function __construct()
    {
        $this->db = Database::getInstance('main');
        $this->detectionEngine = new DetectionEngine();
    }

    /**
     * 대시보드 요약 통계
     *
     * @return array 통계 데이터
     */
    public function getSummaryStats()
    {
        // 전체 플래그 통계
        $totalStats = $this->db->selectOne("
            SELECT
                COUNT(*) as total_flags,
                SUM(CASE WHEN flag_level = 'caution' THEN 1 ELSE 0 END) as caution_count,
                SUM(CASE WHEN flag_level = 'warning' THEN 1 ELSE 0 END) as warning_count,
                SUM(CASE WHEN flag_level = 'danger' THEN 1 ELSE 0 END) as danger_count,
                SUM(CASE WHEN is_reviewed = 0 THEN 1 ELSE 0 END) as unreviewed_count,
                COUNT(DISTINCT student_id) as affected_students,
                COUNT(DISTINCT quiz_id) as affected_quizzes
            FROM overconfidence_flags
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");

        // 오늘의 플래그
        $todayStats = $this->db->selectOne("
            SELECT COUNT(*) as today_flags
            FROM overconfidence_flags
            WHERE DATE(created_at) = CURDATE()
        ");

        return array_merge($totalStats ?: [], $todayStats ?: []);
    }

    /**
     * 최근 위험 플래그 목록
     *
     * @param int $limit 제한 개수
     * @return array 플래그 목록
     */
    public function getRecentDangerFlags($limit = 20)
    {
        return $this->db->select("
            SELECT * FROM v_overconfidence_summary
            WHERE flag_level = 'danger'
                AND is_reviewed = 0
            ORDER BY created_at DESC
            LIMIT ?
        ", [$limit]);
    }

    /**
     * 위험 학생 목록
     *
     * @param int $limit 제한 개수
     * @return array 학생 목록
     */
    public function getHighRiskStudents($limit = 20)
    {
        return $this->db->select("
            SELECT * FROM v_student_overconfidence_stats
            WHERE danger_count > 0
            ORDER BY danger_count DESC, total_flags DESC
            LIMIT ?
        ", [$limit]);
    }

    /**
     * 문제별 과신 오류 통계
     *
     * @return array 문제 목록
     */
    public function getQuizStatistics()
    {
        return $this->db->select("
            SELECT * FROM v_quiz_overconfidence_stats
            WHERE total_flags > 0
            ORDER BY danger_count DESC, total_flags DESC
            LIMIT 50
        ");
    }

    /**
     * 시간대별 플래그 발생 통계 (차트용)
     *
     * @param int $days 조회 일수
     * @return array 시간대별 데이터
     */
    public function getFlagTrendData($days = 7)
    {
        return $this->db->select("
            SELECT
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN flag_level = 'caution' THEN 1 ELSE 0 END) as caution,
                SUM(CASE WHEN flag_level = 'warning' THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN flag_level = 'danger' THEN 1 ELSE 0 END) as danger
            FROM overconfidence_flags
            WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ", [$days]);
    }

    /**
     * 특정 퀴즈의 상세 통계
     *
     * @param int $quizId 퀴즈 ID
     * @return array 상세 통계
     */
    public function getQuizDetails($quizId)
    {
        $quiz = $this->db->selectOne("
            SELECT * FROM quizzes WHERE id = ?
        ", [$quizId]);

        $stats = $this->detectionEngine->getQuizStats($quizId);

        $flagsByQuestion = $this->db->select("
            SELECT
                q.moodle_question_id,
                q.question_type,
                LEFT(q.question_text, 100) as question_preview,
                COUNT(f.id) as flag_count,
                AVG(f.z_score) as avg_z_score,
                SUM(CASE WHEN f.flag_level = 'danger' THEN 1 ELSE 0 END) as danger_count
            FROM questions q
            LEFT JOIN overconfidence_flags f ON q.id = f.question_id
            WHERE q.quiz_id = ?
            GROUP BY q.id
            ORDER BY flag_count DESC
        ", [$quizId]);

        return [
            'quiz' => $quiz,
            'stats' => $stats,
            'flags_by_question' => $flagsByQuestion,
        ];
    }

    /**
     * 특정 학생의 상세 정보
     *
     * @param int $studentId 학생 ID
     * @return array 상세 정보
     */
    public function getStudentDetails($studentId)
    {
        $student = $this->db->selectOne("
            SELECT * FROM students WHERE id = ?
        ", [$studentId]);

        $stats = $this->detectionEngine->getStudentStats($studentId);

        $recentFlags = $this->db->select("
            SELECT * FROM v_overconfidence_summary
            WHERE student_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ", [$studentId]);

        $quizStats = $this->db->select("
            SELECT
                q.quiz_name,
                COUNT(f.id) as flag_count,
                AVG(f.z_score) as avg_z_score,
                SUM(CASE WHEN f.flag_level = 'danger' THEN 1 ELSE 0 END) as danger_count
            FROM overconfidence_flags f
            INNER JOIN quizzes q ON f.quiz_id = q.id
            WHERE f.student_id = ?
            GROUP BY q.id, q.quiz_name
            ORDER BY flag_count DESC
        ", [$studentId]);

        return [
            'student' => $student,
            'stats' => $stats,
            'recent_flags' => $recentFlags,
            'quiz_stats' => $quizStats,
        ];
    }

    /**
     * 플래그 검토 완료 처리
     *
     * @param int $flagId 플래그 ID
     * @param int $reviewerId 검토자 ID
     * @param string $notes 검토 노트
     * @return bool 성공 여부
     */
    public function reviewFlag($flagId, $reviewerId, $notes = '')
    {
        $updated = $this->db->updateArray('overconfidence_flags', [
            'is_reviewed' => 1,
            'reviewed_by' => $reviewerId,
            'review_notes' => $notes,
            'reviewed_at' => date('Y-m-d H:i:s'),
        ], ['id' => $flagId]);

        return $updated > 0;
    }

    /**
     * 검색 기능
     *
     * @param array $filters 검색 필터
     * @return array 검색 결과
     */
    public function searchFlags(array $filters)
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['student_id'])) {
            $where[] = 'student_id = ?';
            $params[] = $filters['student_id'];
        }

        if (!empty($filters['quiz_id'])) {
            $where[] = 'quiz_id = ?';
            $params[] = $filters['quiz_id'];
        }

        if (!empty($filters['flag_level'])) {
            $where[] = 'flag_level = ?';
            $params[] = $filters['flag_level'];
        }

        if (isset($filters['is_reviewed'])) {
            $where[] = 'is_reviewed = ?';
            $params[] = $filters['is_reviewed'] ? 1 : 0;
        }

        if (!empty($filters['date_from'])) {
            $where[] = 'created_at >= ?';
            $params[] = $filters['date_from'];
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'created_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = implode(' AND ', $where);

        return $this->db->select("
            SELECT * FROM v_overconfidence_summary
            WHERE {$whereClause}
            ORDER BY created_at DESC
            LIMIT 100
        ", $params);
    }
}
