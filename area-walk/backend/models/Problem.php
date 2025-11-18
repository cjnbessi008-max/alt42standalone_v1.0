<?php
/**
 * Problem Model
 * 적분 문제 데이터 관리
 */

require_once __DIR__ . '/../utils/Database.php';

class Problem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * ID로 문제 조회
     */
    public function getById($id) {
        $sql = "SELECT p.*, f.name as function_name, f.latex_notation, f.category
                FROM area_walk_problems p
                LEFT JOIN area_walk_functions f ON p.function_id = f.id
                WHERE p.id = ? AND p.is_active = 1";

        $problem = $this->db->fetchOne($sql, [$id]);

        if ($problem) {
            // JSON 데이터 파싱
            $problem['hints'] = $this->getHints($problem);
            $problem['visualization'] = $this->getVisualization($problem);
            unset($problem['hint_1'], $problem['hint_2'], $problem['hint_3']);
        }

        return $problem;
    }

    /**
     * Moodle 문제 ID로 조회
     */
    public function getByMoodleQuestionId($moodleQuestionId) {
        $sql = "SELECT p.*, f.name as function_name, f.latex_notation, f.category
                FROM area_walk_problems p
                LEFT JOIN area_walk_functions f ON p.function_id = f.id
                WHERE p.moodle_question_id = ? AND p.is_active = 1";

        return $this->db->fetchOne($sql, [$moodleQuestionId]);
    }

    /**
     * 모든 활성 문제 조회
     */
    public function getAll($filters = []) {
        $sql = "SELECT p.*, f.name as function_name
                FROM area_walk_problems p
                LEFT JOIN area_walk_functions f ON p.function_id = f.id
                WHERE p.is_active = 1";

        $params = [];

        // 필터 적용
        if (isset($filters['difficulty'])) {
            $sql .= " AND p.difficulty_level = ?";
            $params[] = $filters['difficulty'];
        }

        if (isset($filters['created_by'])) {
            $sql .= " AND p.created_by = ?";
            $params[] = $filters['created_by'];
        }

        $sql .= " ORDER BY p.created_at DESC";

        if (isset($filters['limit'])) {
            $sql .= " LIMIT ?";
            $params[] = (int)$filters['limit'];
        }

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * 난이도별 문제 조회
     */
    public function getByDifficulty($difficulty) {
        return $this->getAll(['difficulty' => $difficulty]);
    }

    /**
     * 문제 생성
     */
    public function create($data) {
        $requiredFields = [
            'moodle_question_id', 'title', 'function_expr',
            'lower_bound', 'upper_bound', 'correct_answer'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // 기본값 설정
        $defaults = [
            'tolerance' => 0.01,
            'difficulty_level' => 'medium',
            'character_sprite' => 'default.png',
            'background_image' => 'default_bg.png',
            'graph_color' => '#3498db',
            'area_color' => 'rgba(52, 152, 219, 0.3)',
            'success_message' => '정답입니다!',
            'failure_message' => '다시 시도해보세요.',
            'max_attempts' => 0,
            'time_limit_seconds' => 0,
            'is_active' => 1
        ];

        $data = array_merge($defaults, $data);

        return $this->db->insert('area_walk_problems', $data);
    }

    /**
     * 문제 수정
     */
    public function update($id, $data) {
        return $this->db->update('area_walk_problems', $data, 'id = ?', [$id]);
    }

    /**
     * 문제 삭제 (soft delete)
     */
    public function delete($id) {
        return $this->db->update('area_walk_problems', ['is_active' => 0], 'id = ?', [$id]);
    }

    /**
     * 문제 통계 조회
     */
    public function getStats($problemId) {
        $sql = "SELECT * FROM area_walk_problem_stats WHERE problem_id = ?";
        return $this->db->fetchOne($sql, [$problemId]);
    }

    /**
     * 힌트 배열 반환
     */
    private function getHints($problem) {
        $hints = [];
        if (!empty($problem['hint_1'])) $hints[] = $problem['hint_1'];
        if (!empty($problem['hint_2'])) $hints[] = $problem['hint_2'];
        if (!empty($problem['hint_3'])) $hints[] = $problem['hint_3'];
        return $hints;
    }

    /**
     * 시각화 설정 반환
     */
    private function getVisualization($problem) {
        return [
            'character_sprite' => $problem['character_sprite'],
            'background_image' => $problem['background_image'],
            'graph_color' => $problem['graph_color'],
            'area_color' => $problem['area_color']
        ];
    }

    /**
     * 문제 검증 (적분 계산이 올바른지)
     */
    public function validate($id) {
        $problem = $this->getById($id);
        if (!$problem) {
            return ['valid' => false, 'error' => 'Problem not found'];
        }

        require_once __DIR__ . '/../utils/IntegralCalculator.php';
        $calculator = new IntegralCalculator();

        $calculated = $calculator->calculate(
            $problem['function_expr'],
            $problem['lower_bound'],
            $problem['upper_bound']
        );

        $error = abs($calculated['result'] - $problem['correct_answer']);
        $isValid = $error <= $problem['tolerance'];

        return [
            'valid' => $isValid,
            'stored_answer' => $problem['correct_answer'],
            'calculated_answer' => $calculated['result'],
            'error' => $error,
            'tolerance' => $problem['tolerance']
        ];
    }

    /**
     * 문제 복제
     */
    public function duplicate($id, $newMoodleQuestionId) {
        $problem = $this->getById($id);
        if (!$problem) {
            throw new Exception('Problem not found');
        }

        // ID와 타임스탬프 제거
        unset($problem['id'], $problem['created_at'], $problem['updated_at']);

        // 새 Moodle 문제 ID 설정
        $problem['moodle_question_id'] = $newMoodleQuestionId;
        $problem['title'] .= ' (복사본)';

        return $this->create($problem);
    }
}
