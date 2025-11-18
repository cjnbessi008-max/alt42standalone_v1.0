<?php
/**
 * Moodle Questions API
 * Moodle 3.7 문제 정보 조회 및 관리
 */

require_once __DIR__ . '/database.php';

class QuestionsAPI {
    private $db;
    private $prefix;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->prefix = $database->getPrefix();
    }

    /**
     * 문제 목록 조회
     * @param int $categoryId 문제 카테고리 ID (선택적)
     * @param int $limit 조회 개수
     * @return array 문제 목록
     */
    public function getQuestions($categoryId = null, $limit = 10) {
        try {
            $sql = "SELECT
                        q.id,
                        q.category,
                        q.name,
                        q.questiontext,
                        q.qtype,
                        q.defaultmark,
                        q.timecreated,
                        q.timemodified,
                        qc.name as category_name
                    FROM {$this->prefix}question q
                    LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                    WHERE q.hidden = 0";

            if ($categoryId !== null) {
                $sql .= " AND q.category = :category_id";
            }

            $sql .= " ORDER BY q.timecreated DESC LIMIT :limit";

            $stmt = $this->db->prepare($sql);

            if ($categoryId !== null) {
                $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            }
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);

            $stmt->execute();
            $questions = $stmt->fetchAll();

            // HTML 태그 제거 및 텍스트 정리
            foreach ($questions as &$question) {
                $question['questiontext'] = $this->cleanHtml($question['questiontext']);
            }

            return $questions;
        } catch (PDOException $e) {
            error_log("Failed to fetch questions: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 특정 문제 상세 정보 조회
     * @param int $questionId 문제 ID
     * @return array|null 문제 상세 정보
     */
    public function getQuestionById($questionId) {
        try {
            $sql = "SELECT
                        q.*,
                        qc.name as category_name,
                        qc.contextid
                    FROM {$this->prefix}question q
                    LEFT JOIN {$this->prefix}question_categories qc ON q.category = qc.id
                    WHERE q.id = :question_id";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
            $stmt->execute();

            $question = $stmt->fetch();

            if ($question) {
                $question['questiontext'] = $this->cleanHtml($question['questiontext']);
                $question['answers'] = $this->getAnswers($questionId);
            }

            return $question;
        } catch (PDOException $e) {
            error_log("Failed to fetch question: " . $e->getMessage());
            return null;
        }
    }

    /**
     * 문제의 답변 선택지 조회
     * @param int $questionId 문제 ID
     * @return array 답변 목록
     */
    public function getAnswers($questionId) {
        try {
            $sql = "SELECT
                        id,
                        answer,
                        fraction,
                        feedback
                    FROM {$this->prefix}question_answers
                    WHERE question = :question_id
                    ORDER BY id";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
            $stmt->execute();

            $answers = $stmt->fetchAll();

            foreach ($answers as &$answer) {
                $answer['answer'] = $this->cleanHtml($answer['answer']);
                $answer['feedback'] = $this->cleanHtml($answer['feedback']);
            }

            return $answers;
        } catch (PDOException $e) {
            error_log("Failed to fetch answers: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 문제 카테고리 목록 조회
     * @return array 카테고리 목록
     */
    public function getCategories() {
        try {
            $sql = "SELECT
                        id,
                        name,
                        contextid,
                        info,
                        parent
                    FROM {$this->prefix}question_categories
                    WHERE parent > 0
                    ORDER BY name";

            $stmt = $this->db->prepare($sql);
            $stmt->execute();

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Failed to fetch categories: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Edge Melody용 문제 데이터 변환
     * 3D 시각화를 위한 메타데이터 추가
     * @param int $questionId 문제 ID
     * @return array Edge Melody 형식 데이터
     */
    public function getQuestionForEdgeMelody($questionId) {
        $question = $this->getQuestionById($questionId);

        if (!$question) {
            return null;
        }

        // 3D 시각화를 위한 메타데이터 생성
        $edgeMelodyData = [
            'question' => $question,
            'visualization' => [
                'type' => '3d_cube',
                'edges' => $this->generateEdgePattern($question),
                'animation' => [
                    'speed' => $this->calculateAnimationSpeed($question['defaultmark']),
                    'pattern' => 'melodic',
                    'color_scheme' => $this->getColorScheme($question['category'])
                ]
            ],
            'metadata' => [
                'difficulty' => $this->calculateDifficulty($question),
                'question_type' => $question['qtype'],
                'points' => $question['defaultmark']
            ]
        ];

        return $edgeMelodyData;
    }

    /**
     * 문제 난이도에 따른 Edge 패턴 생성
     */
    private function generateEdgePattern($question) {
        $answerCount = count($question['answers'] ?? []);
        $edges = [];

        // 정육면체의 12개 모서리
        $edgeDefinitions = [
            ['start' => [0,0,0], 'end' => [1,0,0]],
            ['start' => [1,0,0], 'end' => [1,1,0]],
            ['start' => [1,1,0], 'end' => [0,1,0]],
            ['start' => [0,1,0], 'end' => [0,0,0]],
            ['start' => [0,0,1], 'end' => [1,0,1]],
            ['start' => [1,0,1], 'end' => [1,1,1]],
            ['start' => [1,1,1], 'end' => [0,1,1]],
            ['start' => [0,1,1], 'end' => [0,0,1]],
            ['start' => [0,0,0], 'end' => [0,0,1]],
            ['start' => [1,0,0], 'end' => [1,0,1]],
            ['start' => [1,1,0], 'end' => [1,1,1]],
            ['start' => [0,1,0], 'end' => [0,1,1]],
        ];

        // 답변 개수에 따라 점등할 모서리 선택
        $activateCount = min($answerCount, 12);

        for ($i = 0; $i < 12; $i++) {
            $edges[] = [
                'id' => $i,
                'coordinates' => $edgeDefinitions[$i],
                'active' => $i < $activateCount,
                'intensity' => $i < $activateCount ? (1.0 - ($i * 0.08)) : 0.3,
                'delay' => $i * 0.15 // 음악적 딜레이
            ];
        }

        return $edges;
    }

    /**
     * 배점에 따른 애니메이션 속도 계산
     */
    private function calculateAnimationSpeed($points) {
        // 배점이 높을수록 느리게 (신중하게)
        return max(0.5, min(2.0, 1.0 + ($points / 10)));
    }

    /**
     * 카테고리별 색상 스킴
     */
    private function getColorScheme($categoryId) {
        $schemes = [
            'default' => ['#00ff88', '#00ccff', '#ff00ff'],
            'math' => ['#ffaa00', '#ff6600', '#ff0066'],
            'science' => ['#00ffff', '#0088ff', '#0044ff'],
            'language' => ['#ff00aa', '#aa00ff', '#6600ff']
        ];

        // 카테고리 ID를 기반으로 색상 선택
        $index = $categoryId % count($schemes);
        $keys = array_keys($schemes);

        return $schemes[$keys[$index]];
    }

    /**
     * 문제 난이도 계산
     */
    private function calculateDifficulty($question) {
        $points = $question['defaultmark'];
        $answerCount = count($question['answers'] ?? []);

        if ($points >= 3 || $answerCount >= 5) {
            return 'hard';
        } elseif ($points >= 2 || $answerCount >= 3) {
            return 'medium';
        } else {
            return 'easy';
        }
    }

    /**
     * HTML 태그 제거 및 텍스트 정리
     */
    private function cleanHtml($html) {
        if (empty($html)) {
            return '';
        }

        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = trim($text);

        return $text;
    }
}
