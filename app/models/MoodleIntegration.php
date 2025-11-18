<?php
/**
 * Moodle Integration Model
 * Moodle 3.7과 연동하여 문제 정보를 가져오는 모델
 */

class MoodleIntegration {
    private $db;
    private $moodle_db;

    public function __construct() {
        $this->db = getDBConnection();
        $this->moodle_db = getMoodleDBConnection();
    }

    /**
     * Moodle에서 퀴즈 문제 가져오기
     * @param int $quiz_id Moodle 퀴즈 ID
     * @return array 문제 목록
     */
    public function getQuizQuestions($quiz_id) {
        if (!$this->moodle_db) {
            return [];
        }

        try {
            $prefix = MOODLE_DB_PREFIX;
            $sql = "
                SELECT
                    q.id,
                    q.qtype,
                    q.name,
                    q.questiontext,
                    q.defaultmark,
                    qa.slot,
                    qa.maxmark
                FROM {$prefix}question q
                INNER JOIN {$prefix}quiz_slots qa ON q.id = qa.questionid
                WHERE qa.quizid = :quiz_id
                ORDER BY qa.slot
            ";

            $stmt = $this->moodle_db->prepare($sql);
            $stmt->execute(['quiz_id' => $quiz_id]);

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error fetching quiz questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 특정 문제의 상세 정보 가져오기
     * @param int $question_id Moodle 문제 ID
     * @return array|null 문제 상세 정보
     */
    public function getQuestionDetail($question_id) {
        if (!$this->moodle_db) {
            return null;
        }

        try {
            $prefix = MOODLE_DB_PREFIX;
            $sql = "
                SELECT
                    q.*,
                    qc.name as category_name
                FROM {$prefix}question q
                LEFT JOIN {$prefix}question_categories qc ON q.category = qc.id
                WHERE q.id = :question_id
            ";

            $stmt = $this->moodle_db->prepare($sql);
            $stmt->execute(['question_id' => $question_id]);

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error fetching question detail: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Moodle 문제를 로컬 데이터베이스에 동기화
     * @param int $moodle_question_id Moodle 문제 ID
     * @return int|bool 로컬 문제 ID 또는 실패 시 false
     */
    public function syncQuestion($moodle_question_id) {
        $question_detail = $this->getQuestionDetail($moodle_question_id);

        if (!$question_detail) {
            return false;
        }

        try {
            // 문제 데이터 준비
            $question_data = json_encode([
                'defaultmark' => $question_detail['defaultmark'],
                'penalty' => $question_detail['penalty'] ?? 0,
                'qtype' => $question_detail['qtype'],
            ]);

            // 기본 패턴 설정 (문제 타입에 따라)
            $pattern_config = $this->getDefaultPatternConfig($question_detail['qtype']);

            // 이미 존재하는지 확인
            $check_sql = "SELECT id FROM moodle_questions WHERE moodle_question_id = :moodle_qid";
            $stmt = $this->db->prepare($check_sql);
            $stmt->execute(['moodle_qid' => $moodle_question_id]);
            $existing = $stmt->fetch();

            if ($existing) {
                // 업데이트
                $sql = "
                    UPDATE moodle_questions
                    SET question_type = :qtype,
                        question_text = :qtext,
                        question_data = :qdata,
                        pattern_config = :pconfig,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE moodle_question_id = :moodle_qid
                ";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    'qtype' => $question_detail['qtype'],
                    'qtext' => $question_detail['questiontext'],
                    'qdata' => $question_data,
                    'pconfig' => $pattern_config,
                    'moodle_qid' => $moodle_question_id
                ]);

                return $existing['id'];
            } else {
                // 삽입
                $sql = "
                    INSERT INTO moodle_questions
                    (moodle_question_id, question_type, question_text, question_data, pattern_config)
                    VALUES (:moodle_qid, :qtype, :qtext, :qdata, :pconfig)
                ";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    'moodle_qid' => $moodle_question_id,
                    'qtype' => $question_detail['qtype'],
                    'qtext' => $question_detail['questiontext'],
                    'qdata' => $question_data,
                    'pconfig' => $pattern_config
                ]);

                return $this->db->lastInsertId();
            }
        } catch (PDOException $e) {
            error_log("Error syncing question: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 문제 타입에 따른 기본 패턴 설정 생성
     * @param string $question_type 문제 타입
     * @return string JSON 형식의 패턴 설정
     */
    private function getDefaultPatternConfig($question_type) {
        $configs = [
            'multichoice' => [
                'patterns' => [1], // Sine Wave
                'animation_enabled' => true,
                'show_grid' => true
            ],
            'numerical' => [
                'patterns' => [1, 2], // Sine + Cosine
                'animation_enabled' => true,
                'show_grid' => true,
                'show_values' => true
            ],
            'calculated' => [
                'patterns' => [3], // Fast Sine
                'animation_enabled' => true,
                'show_grid' => true,
                'show_formula' => true
            ],
            'essay' => [
                'patterns' => [],
                'animation_enabled' => false
            ],
            'default' => [
                'patterns' => [1],
                'animation_enabled' => true,
                'show_grid' => false
            ]
        ];

        $config = $configs[$question_type] ?? $configs['default'];
        return json_encode($config);
    }

    /**
     * Moodle 퀴즈 전체 동기화
     * @param int $quiz_id Moodle 퀴즈 ID
     * @return array 동기화 결과
     */
    public function syncQuiz($quiz_id) {
        $questions = $this->getQuizQuestions($quiz_id);
        $results = [
            'success' => 0,
            'failed' => 0,
            'total' => count($questions)
        ];

        foreach ($questions as $question) {
            if ($this->syncQuestion($question['id'])) {
                $results['success']++;
            } else {
                $results['failed']++;
            }
        }

        return $results;
    }
}
