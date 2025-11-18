<?php
/**
 * Graph Problem Model
 */

class GraphProblem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 문제 생성 또는 업데이트
     */
    public function createOrUpdate($data) {
        $sql = "INSERT INTO graph_problems
                (moodle_question_id, problem_type, equation, slope, y_intercept,
                 x_intercept, difficulty_level, title, description)
                VALUES
                (:moodle_question_id, :problem_type, :equation, :slope, :y_intercept,
                 :x_intercept, :difficulty_level, :title, :description)
                ON DUPLICATE KEY UPDATE
                problem_type = VALUES(problem_type),
                equation = VALUES(equation),
                slope = VALUES(slope),
                y_intercept = VALUES(y_intercept),
                x_intercept = VALUES(x_intercept),
                difficulty_level = VALUES(difficulty_level),
                title = VALUES(title),
                description = VALUES(description)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':moodle_question_id' => $data['moodle_question_id'],
            ':problem_type' => $data['problem_type'] ?? 'linear',
            ':equation' => $data['equation'],
            ':slope' => $data['slope'] ?? null,
            ':y_intercept' => $data['y_intercept'] ?? null,
            ':x_intercept' => $data['x_intercept'] ?? null,
            ':difficulty_level' => $data['difficulty_level'] ?? 1,
            ':title' => $data['title'] ?? '',
            ':description' => $data['description'] ?? ''
        ]);
    }

    /**
     * Moodle 문제 ID로 문제 가져오기
     */
    public function getByMoodleId($moodleQuestionId) {
        $sql = "SELECT * FROM graph_problems WHERE moodle_question_id = :moodle_question_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':moodle_question_id' => $moodleQuestionId]);
        return $stmt->fetch();
    }

    /**
     * ID로 문제 가져오기
     */
    public function getById($id) {
        $sql = "SELECT * FROM graph_problems WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    /**
     * 일차함수 방정식 파싱 (예: y = 2x + 3)
     */
    public static function parseLinearEquation($equation) {
        // 공백 제거
        $equation = str_replace(' ', '', $equation);

        // y = mx + b 형태 파싱
        if (preg_match('/y=([+-]?\d*\.?\d*)x([+-]\d+\.?\d*)/', $equation, $matches)) {
            $slope = $matches[1] === '' || $matches[1] === '+' ? 1 :
                     ($matches[1] === '-' ? -1 : floatval($matches[1]));
            $yIntercept = floatval($matches[2]);

            // x절편 계산: x = -b/m (y=0일 때)
            $xIntercept = $slope != 0 ? -$yIntercept / $slope : null;

            return [
                'slope' => $slope,
                'y_intercept' => $yIntercept,
                'x_intercept' => $xIntercept
            ];
        }

        return false;
    }

    /**
     * 절편에 해당하는 음향 설정 가져오기
     */
    public function getAudioSettings($interceptType, $value) {
        $sql = "SELECT * FROM audio_settings
                WHERE intercept_type = :intercept_type
                AND :value >= value_min AND :value < value_max
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':intercept_type' => $interceptType,
            ':value' => $value
        ]);

        return $stmt->fetch();
    }
}
