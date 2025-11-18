<?php
/**
 * 집합 문제 관리 클래스
 */
class SetProblem {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * 문제 ID로 집합 문제 가져오기
     */
    public function getProblem($problemId) {
        // Moodle quiz question 테이블에서 문제 정보 가져오기
        $tableName = Database::getInstance()->getTableName('question');

        $stmt = $this->db->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.defaultmark,
                qa.answer as correct_answer,
                qh.hint
            FROM {$tableName} q
            LEFT JOIN " . Database::getInstance()->getTableName('question_answers') . " qa
                ON q.id = qa.question AND qa.fraction = 1.0
            LEFT JOIN " . Database::getInstance()->getTableName('question_hints') . " qh
                ON q.id = qh.questionid
            WHERE q.id = :problem_id
            LIMIT 1
        ");

        $stmt->execute(['problem_id' => $problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            return null;
        }

        // 문제 텍스트에서 집합 정보 파싱
        return $this->parseSetProblem($problem);
    }

    /**
     * 무작위 집합 문제 가져오기
     */
    public function getRandomProblem($categoryId = null) {
        $tableName = Database::getInstance()->getTableName('question');

        $where = "q.qtype = 'shortanswer' OR q.qtype = 'multichoice'";
        if ($categoryId) {
            $where .= " AND q.category = :category_id";
        }

        $stmt = $this->db->prepare("
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.defaultmark
            FROM {$tableName} q
            WHERE {$where}
            ORDER BY RAND()
            LIMIT 1
        ");

        if ($categoryId) {
            $stmt->execute(['category_id' => $categoryId]);
        } else {
            $stmt->execute();
        }

        $problem = $stmt->fetch();

        if (!$problem) {
            // 데이터가 없으면 샘플 문제 반환
            return $this->getSampleProblem();
        }

        return $this->parseSetProblem($problem);
    }

    /**
     * 문제 텍스트에서 집합 정보 파싱
     */
    private function parseSetProblem($problem) {
        // 문제 텍스트에서 집합 A, B 정보 추출
        // 예: "집합 A = {1,2,3,4,5}, 집합 B = {3,4,5,6,7}"

        $questionText = strip_tags($problem['questiontext']);

        // 기본값
        $setA = [1, 2, 3, 4, 5];
        $setB = [3, 4, 5, 6, 7];

        // 집합 A 파싱
        if (preg_match('/집합\s*A\s*=\s*\{([^}]+)\}/u', $questionText, $matches)) {
            $setA = array_map('trim', explode(',', $matches[1]));
        } elseif (preg_match('/Set\s*A\s*=\s*\{([^}]+)\}/i', $questionText, $matches)) {
            $setA = array_map('trim', explode(',', $matches[1]));
        }

        // 집합 B 파싱
        if (preg_match('/집합\s*B\s*=\s*\{([^}]+)\}/u', $questionText, $matches)) {
            $setB = array_map('trim', explode(',', $matches[1]));
        } elseif (preg_match('/Set\s*B\s*=\s*\{([^}]+)\}/i', $questionText, $matches)) {
            $setB = array_map('trim', explode(',', $matches[1]));
        }

        return [
            'id' => $problem['id'],
            'name' => $problem['name'],
            'questionText' => $questionText,
            'setA' => $setA,
            'setB' => $setB,
            'union' => array_values(array_unique(array_merge($setA, $setB))),
            'intersection' => array_values(array_intersect($setA, $setB)),
            'diffAB' => array_values(array_diff($setA, $setB)),
            'diffBA' => array_values(array_diff($setB, $setA)),
            'correctAnswer' => $problem['correct_answer'] ?? null,
            'points' => $problem['defaultmark'] ?? 1.0
        ];
    }

    /**
     * 샘플 문제 반환 (Moodle 연동 없이 테스트용)
     */
    public function getSampleProblem() {
        return [
            'id' => 'sample_1',
            'name' => '집합의 교집합',
            'questionText' => '집합 A와 집합 B의 교집합을 구하세요.',
            'setA' => [1, 2, 3, 4, 5],
            'setB' => [3, 4, 5, 6, 7],
            'union' => [1, 2, 3, 4, 5, 6, 7],
            'intersection' => [3, 4, 5],
            'diffAB' => [1, 2],
            'diffBA' => [6, 7],
            'correctAnswer' => '{3, 4, 5}',
            'points' => 1.0
        ];
    }

    /**
     * 답안 제출 및 검증
     */
    public function submitAnswer($problemId, $studentId, $answer) {
        $problem = $this->getProblem($problemId);

        if (!$problem) {
            return [
                'success' => false,
                'message' => '문제를 찾을 수 없습니다.'
            ];
        }

        // 답안 검증 (간단한 비교)
        $isCorrect = $this->validateAnswer($problem, $answer);

        // Moodle question_attempts 테이블에 기록
        // (실제 구현시 Moodle API 사용 권장)

        return [
            'success' => true,
            'correct' => $isCorrect,
            'correctAnswer' => $problem['correctAnswer'],
            'points' => $isCorrect ? $problem['points'] : 0
        ];
    }

    private function validateAnswer($problem, $answer) {
        // 간단한 문자열 비교 (실제로는 더 정교한 비교 필요)
        $answer = trim(strtolower($answer));
        $correctAnswer = trim(strtolower($problem['correctAnswer'] ?? ''));

        return $answer === $correctAnswer;
    }
}
