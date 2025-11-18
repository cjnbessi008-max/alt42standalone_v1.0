<?php
/**
 * 요약 관리 서비스
 * 1문장 핵심 요약 생성, 조회, 수정, 삭제 기능
 */

class SummaryService {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * 요약 저장
     *
     * @param array $data 요약 데이터
     * @return int 생성된 요약 ID
     */
    public function createSummary($data) {
        // 유효성 검사
        $this->validateSummary($data);

        // 단어 수 계산
        $wordCount = mb_strlen(preg_replace('/\s+/', '', $data['summary_text']));

        $sql = "INSERT INTO summaries
                (moodle_user_id, moodle_course_id, moodle_activity_id,
                 activity_type, activity_name, summary_text, word_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $data['moodle_user_id'],
            $data['moodle_course_id'],
            $data['moodle_activity_id'],
            $data['activity_type'],
            $data['activity_name'],
            $data['summary_text'],
            $wordCount
        ];

        $this->db->execute($sql, $params);
        $summaryId = $this->db->lastInsertId();

        // 활동 로그 기록
        $this->logActivity($data['moodle_user_id'], 'submit', 'summary', $summaryId);

        return $summaryId;
    }

    /**
     * 요약 수정
     *
     * @param int $summaryId 요약 ID
     * @param string $summaryText 수정된 요약 텍스트
     * @param int $userId 사용자 ID (권한 체크용)
     * @return bool 성공 여부
     */
    public function updateSummary($summaryId, $summaryText, $userId) {
        // 권한 체크
        $summary = $this->getSummaryById($summaryId);
        if (!$summary || $summary['moodle_user_id'] != $userId) {
            throw new Exception("수정 권한이 없습니다.");
        }

        // 길이 검증
        $this->validateSummaryText($summaryText);

        $wordCount = mb_strlen(preg_replace('/\s+/', '', $summaryText));

        $sql = "UPDATE summaries SET summary_text = ?, word_count = ?, updated_at = NOW() WHERE id = ?";
        $this->db->execute($sql, [$summaryText, $wordCount, $summaryId]);

        // 활동 로그 기록
        $this->logActivity($userId, 'update', 'summary', $summaryId);

        return true;
    }

    /**
     * 요약 조회 (ID로)
     *
     * @param int $summaryId 요약 ID
     * @return array|null 요약 데이터
     */
    public function getSummaryById($summaryId) {
        $sql = "SELECT s.*,
                       af.feedback_text, af.overall_score,
                       tc.comment_text as teacher_comment, tc.rating as teacher_rating
                FROM summaries s
                LEFT JOIN ai_feedback af ON s.id = af.summary_id
                LEFT JOIN teacher_comments tc ON s.id = tc.summary_id
                WHERE s.id = ?";

        return $this->db->queryOne($sql, [$summaryId]);
    }

    /**
     * 사용자의 요약 목록 조회
     *
     * @param int $userId Moodle 사용자 ID
     * @param int $limit 조회 개수
     * @param int $offset 시작 위치
     * @return array 요약 목록
     */
    public function getSummariesByUser($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT s.*,
                       af.overall_score,
                       tc.rating as teacher_rating
                FROM summaries s
                LEFT JOIN ai_feedback af ON s.id = af.summary_id
                LEFT JOIN teacher_comments tc ON s.id = tc.summary_id
                WHERE s.moodle_user_id = ?
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?";

        return $this->db->query($sql, [$userId, $limit, $offset]);
    }

    /**
     * 활동별 요약 목록 조회
     *
     * @param int $activityId 활동 ID
     * @param int $limit 조회 개수
     * @return array 요약 목록
     */
    public function getSummariesByActivity($activityId, $limit = 100) {
        $sql = "SELECT s.*,
                       af.overall_score
                FROM summaries s
                LEFT JOIN ai_feedback af ON s.id = af.summary_id
                WHERE s.moodle_activity_id = ?
                ORDER BY s.created_at DESC
                LIMIT ?";

        return $this->db->query($sql, [$activityId, $limit]);
    }

    /**
     * 코스별 요약 목록 조회 (교사용)
     *
     * @param int $courseId 코스 ID
     * @param int $limit 조회 개수
     * @return array 요약 목록
     */
    public function getSummariesByCourse($courseId, $limit = 100) {
        $sql = "SELECT s.*,
                       af.overall_score,
                       tc.rating as teacher_rating
                FROM summaries s
                LEFT JOIN ai_feedback af ON s.id = af.summary_id
                LEFT JOIN teacher_comments tc ON s.id = tc.summary_id
                WHERE s.moodle_course_id = ?
                ORDER BY s.created_at DESC
                LIMIT ?";

        return $this->db->query($sql, [$courseId, $limit]);
    }

    /**
     * 요약 삭제
     *
     * @param int $summaryId 요약 ID
     * @param int $userId 사용자 ID
     * @return bool 성공 여부
     */
    public function deleteSummary($summaryId, $userId) {
        // 권한 체크
        $summary = $this->getSummaryById($summaryId);
        if (!$summary || $summary['moodle_user_id'] != $userId) {
            throw new Exception("삭제 권한이 없습니다.");
        }

        $sql = "DELETE FROM summaries WHERE id = ?";
        $this->db->execute($sql, [$summaryId]);

        // 활동 로그 기록
        $this->logActivity($userId, 'delete', 'summary', $summaryId);

        return true;
    }

    /**
     * 요약 통계 조회
     *
     * @param int $userId 사용자 ID (선택)
     * @param int $courseId 코스 ID (선택)
     * @return array 통계 데이터
     */
    public function getStatistics($userId = null, $courseId = null) {
        $conditions = [];
        $params = [];

        if ($userId !== null) {
            $conditions[] = "moodle_user_id = ?";
            $params[] = $userId;
        }

        if ($courseId !== null) {
            $conditions[] = "moodle_course_id = ?";
            $params[] = $courseId;
        }

        $whereClause = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        $sql = "SELECT
                    COUNT(*) as total_summaries,
                    AVG(word_count) as avg_word_count,
                    COUNT(DISTINCT moodle_user_id) as total_users,
                    COUNT(DISTINCT moodle_activity_id) as total_activities
                FROM summaries
                $whereClause";

        return $this->db->queryOne($sql, $params);
    }

    /**
     * 요약 유효성 검사
     *
     * @param array $data 요약 데이터
     * @throws Exception 유효성 검사 실패시
     */
    private function validateSummary($data) {
        $required = ['moodle_user_id', 'moodle_course_id', 'moodle_activity_id',
                     'activity_type', 'activity_name', 'summary_text'];

        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("필수 항목이 누락되었습니다: " . $field);
            }
        }

        $this->validateSummaryText($data['summary_text']);
    }

    /**
     * 요약 텍스트 유효성 검사
     *
     * @param string $text 요약 텍스트
     * @throws Exception 유효성 검사 실패시
     */
    private function validateSummaryText($text) {
        $db = Database::getInstance();

        $minLength = $db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'min_summary_length'");
        $maxLength = $db->queryOne("SELECT setting_value FROM settings WHERE setting_key = 'max_summary_length'");

        $minLen = $minLength ? (int)$minLength['setting_value'] : 10;
        $maxLen = $maxLength ? (int)$maxLength['setting_value'] : 200;

        $length = mb_strlen($text);

        if ($length < $minLen) {
            throw new Exception("요약문은 최소 {$minLen}자 이상이어야 합니다. (현재: {$length}자)");
        }

        if ($length > $maxLen) {
            throw new Exception("요약문은 최대 {$maxLen}자를 초과할 수 없습니다. (현재: {$length}자)");
        }
    }

    /**
     * 활동 로그 기록
     *
     * @param int $userId 사용자 ID
     * @param string $action 액션
     * @param string $targetType 대상 타입
     * @param int $targetId 대상 ID
     */
    private function logActivity($userId, $action, $targetType, $targetId) {
        $sql = "INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?)";

        $params = [
            $userId,
            $action,
            $targetType,
            $targetId,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ];

        $this->db->execute($sql, $params);
    }
}
