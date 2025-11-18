<?php
/**
 * Pattern Loop Model
 * 주기함수 패턴 관리 모델
 */

class PatternLoop {
    private $db;

    public function __construct() {
        $this->db = getDBConnection();
    }

    /**
     * 모든 활성 패턴 가져오기
     * @return array 패턴 목록
     */
    public function getAllActivePatterns() {
        try {
            $sql = "SELECT * FROM pattern_loops WHERE is_active = 1 ORDER BY id";
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching patterns: " . $e->getMessage());
            return [];
        }
    }

    /**
     * ID로 패턴 가져오기
     * @param int $pattern_id 패턴 ID
     * @return array|null 패턴 정보
     */
    public function getPatternById($pattern_id) {
        try {
            $sql = "SELECT * FROM pattern_loops WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $pattern_id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error fetching pattern: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 문제에 연결된 패턴들 가져오기
     * @param int $question_id 문제 ID
     * @return array 패턴 목록
     */
    public function getPatternsByQuestion($question_id) {
        try {
            $sql = "
                SELECT p.*, qpm.display_order
                FROM pattern_loops p
                INNER JOIN question_pattern_mapping qpm ON p.id = qpm.pattern_id
                WHERE qpm.question_id = :qid AND p.is_active = 1
                ORDER BY qpm.display_order, p.id
            ";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['qid' => $question_id]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching question patterns: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 새 패턴 생성
     * @param array $data 패턴 데이터
     * @return int|bool 생성된 패턴 ID 또는 실패 시 false
     */
    public function createPattern($data) {
        try {
            $sql = "
                INSERT INTO pattern_loops
                (name, function_type, amplitude, frequency, phase, color, animation_speed, is_active)
                VALUES (:name, :ftype, :amplitude, :frequency, :phase, :color, :speed, :active)
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'name' => $data['name'],
                'ftype' => $data['function_type'],
                'amplitude' => $data['amplitude'] ?? 1.0,
                'frequency' => $data['frequency'] ?? 1.0,
                'phase' => $data['phase'] ?? 0.0,
                'color' => $data['color'] ?? '#3498db',
                'speed' => $data['animation_speed'] ?? 1.0,
                'active' => $data['is_active'] ?? 1
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error creating pattern: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 문제와 패턴 연결
     * @param int $question_id 문제 ID
     * @param int $pattern_id 패턴 ID
     * @param int $display_order 표시 순서
     * @return bool 성공 여부
     */
    public function linkPatternToQuestion($question_id, $pattern_id, $display_order = 0) {
        try {
            $sql = "
                INSERT INTO question_pattern_mapping
                (question_id, pattern_id, display_order)
                VALUES (:qid, :pid, :order)
                ON DUPLICATE KEY UPDATE display_order = :order
            ";

            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'qid' => $question_id,
                'pid' => $pattern_id,
                'order' => $display_order
            ]);
        } catch (PDOException $e) {
            error_log("Error linking pattern to question: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 패턴 업데이트
     * @param int $pattern_id 패턴 ID
     * @param array $data 업데이트할 데이터
     * @return bool 성공 여부
     */
    public function updatePattern($pattern_id, $data) {
        try {
            $fields = [];
            $params = ['id' => $pattern_id];

            $allowed_fields = ['name', 'function_type', 'amplitude', 'frequency', 'phase', 'color', 'animation_speed', 'is_active'];

            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE pattern_loops SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating pattern: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 패턴 삭제
     * @param int $pattern_id 패턴 ID
     * @return bool 성공 여부
     */
    public function deletePattern($pattern_id) {
        try {
            $sql = "DELETE FROM pattern_loops WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute(['id' => $pattern_id]);
        } catch (PDOException $e) {
            error_log("Error deleting pattern: " . $e->getMessage());
            return false;
        }
    }
}
