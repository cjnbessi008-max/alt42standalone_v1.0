<?php
/**
 * Moodle 3.7 Connector
 * Moodle 데이터베이스에서 퀴즈/문제 정보 가져오기
 */

require_once __DIR__ . '/../config/database.php';

class MoodleConnector {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 퀴즈 문제 정보 가져오기
     * @param int $quizId Moodle 퀴즈 ID
     * @return array|null 문제 정보
     */
    public function getQuizProblem($quizId) {
        try {
            // Moodle 3.7 테이블 구조에 맞춰 쿼리
            $sql = "
                SELECT
                    q.id,
                    q.name as question_name,
                    q.questiontext,
                    qa.id as answer_id,
                    qa.answer,
                    qa.fraction,
                    qo.value as option_value,
                    qo.name as option_name
                FROM mdl_question q
                LEFT JOIN mdl_question_answers qa ON q.id = qa.question
                LEFT JOIN mdl_quiz_slots qs ON qs.questionid = q.id
                LEFT JOIN mdl_question_numerical_options qo ON q.id = qo.question
                WHERE qs.quizid = :quiz_id
                LIMIT 1
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['quiz_id' => $quizId]);
            $result = $stmt->fetch();

            if (!$result) {
                return null;
            }

            // 문제 텍스트에서 함수식 추출
            return $this->parseProblemData($result);

        } catch (PDOException $e) {
            error_log("Moodle Query Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 문제 데이터 파싱 (함수식, 점근선 정보 추출)
     */
    private function parseProblemData($rawData) {
        // questiontext에서 함수식 추출
        $questionText = strip_tags($rawData['questiontext']);

        // 함수식 패턴 매칭 (예: f(x) = 1/x, f(x) = 1/(x-2), etc.)
        $functionPattern = '/f\(x\)\s*=\s*([^,\n]+)/i';
        preg_match($functionPattern, $questionText, $matches);

        $function = isset($matches[1]) ? trim($matches[1]) : '1/x'; // 기본값

        // 점근선 자동 계산
        $asymptotes = $this->calculateAsymptotes($function);

        return [
            'id' => $rawData['id'],
            'question_name' => $rawData['question_name'],
            'function' => $function,
            'asymptotes' => $asymptotes,
            'domain' => [-10, 10],
            'range' => [-10, 10],
            'animation_duration' => 2000 // ms
        ];
    }

    /**
     * 함수식에서 점근선 계산
     * 간단한 케이스만 처리 (1/x, 1/(x-a), etc.)
     */
    private function calculateAsymptotes($function) {
        $asymptotes = [
            'vertical' => [],
            'horizontal' => [],
            'oblique' => []
        ];

        // 수직 점근선: 분모가 0이 되는 x 값
        // 패턴: 1/(x-a) 형태
        if (preg_match('/1\s*\/\s*\(\s*x\s*-\s*(\d+)\s*\)/i', $function, $matches)) {
            $asymptotes['vertical'][] = (float)$matches[1];
        } elseif (preg_match('/1\s*\/\s*\(\s*x\s*\+\s*(\d+)\s*\)/i', $function, $matches)) {
            $asymptotes['vertical'][] = -(float)$matches[1];
        } elseif (preg_match('/1\s*\/\s*x/i', $function)) {
            $asymptotes['vertical'][] = 0;
        }

        // 수평 점근선: 유리함수의 차수 비교
        // 간단한 케이스: 1/x -> y=0
        if (preg_match('/^\s*1\s*\//', $function)) {
            $asymptotes['horizontal'][] = 0;
        }

        return $asymptotes;
    }

    /**
     * 사용자 정의 함수 문제 가져오기
     * @param int $customId 커스텀 문제 ID
     */
    public function getCustomProblem($customId) {
        // 커스텀 문제 테이블에서 가져오기
        try {
            $sql = "
                SELECT
                    id,
                    function_expression,
                    vertical_asymptotes,
                    horizontal_asymptotes,
                    domain_min,
                    domain_max,
                    range_min,
                    range_max
                FROM alt42_custom_problems
                WHERE id = :id
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $customId]);
            $result = $stmt->fetch();

            if (!$result) {
                return null;
            }

            return [
                'id' => $result['id'],
                'function' => $result['function_expression'],
                'asymptotes' => [
                    'vertical' => json_decode($result['vertical_asymptotes'], true) ?? [],
                    'horizontal' => json_decode($result['horizontal_asymptotes'], true) ?? [],
                    'oblique' => []
                ],
                'domain' => [$result['domain_min'], $result['domain_max']],
                'range' => [$result['range_min'], $result['range_max']],
                'animation_duration' => 2000
            ];

        } catch (PDOException $e) {
            error_log("Custom Problem Query Error: " . $e->getMessage());
            return null;
        }
    }
}
