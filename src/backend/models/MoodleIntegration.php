<?php
/**
 * Moodle LMS 연동 클래스
 * Moodle 3.7 Web Services API 활용
 */

class MoodleIntegration {
    private $db;
    private $moodleDb;
    private $webServiceToken;
    private $moodleUrl;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->moodleDb = Database::getInstance()->getMoodleConnection();
        $this->webServiceToken = MOODLE_API_TOKEN;
        $this->moodleUrl = MOODLE_URL;
    }

    /**
     * Moodle 카테고리에서 개념 가져오기
     */
    public function syncConceptsFromCategories() {
        try {
            $prefix = MOODLE_DB_PREFIX;
            $sql = "SELECT
                        id,
                        name,
                        description,
                        parent,
                        depth
                    FROM {$prefix}question_categories
                    WHERE parent > 0
                    ORDER BY depth, parent, name";

            $stmt = $this->moodleDb->prepare($sql);
            $stmt->execute();
            $categories = $stmt->fetchAll();

            $syncedCount = 0;
            foreach ($categories as $category) {
                $this->createOrUpdateConcept([
                    'name' => $category['name'],
                    'description' => $category['description'] ?? '',
                    'category' => $this->determineCategoryType($category['name']),
                    'difficulty_level' => $this->estimateDifficulty($category['depth']),
                    'parent_concept_id' => $this->findParentConceptId($category['parent']),
                    'moodle_category_id' => $category['id']
                ]);
                $syncedCount++;
            }

            Logger::info("Synced {$syncedCount} concepts from Moodle categories");
            return ['success' => true, 'count' => $syncedCount];

        } catch (Exception $e) {
            Logger::error("Failed to sync concepts: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Moodle 문제 가져오기
     */
    public function syncProblemsFromQuestions() {
        try {
            $prefix = MOODLE_DB_PREFIX;
            $sql = "SELECT
                        q.id,
                        q.category as category_id,
                        q.name,
                        q.questiontext,
                        q.qtype,
                        q.defaultmark,
                        qc.name as category_name
                    FROM {$prefix}question q
                    JOIN {$prefix}question_categories qc ON q.category = qc.id
                    WHERE q.parent = 0
                    ORDER BY q.category, q.name";

            $stmt = $this->moodleDb->prepare($sql);
            $stmt->execute();
            $questions = $stmt->fetchAll();

            $syncedCount = 0;
            foreach ($questions as $question) {
                $problemId = $this->createOrUpdateProblem([
                    'title' => $question['name'],
                    'description' => strip_tags($question['questiontext']),
                    'problem_type' => $question['qtype'],
                    'difficulty_level' => $this->estimateProblemDifficulty($question['defaultmark']),
                    'points' => (int)$question['defaultmark'],
                    'moodle_question_id' => $question['id']
                ]);

                // 개념-문제 자동 매칭
                $conceptId = $this->findConceptByMoodleCategoryId($question['category_id']);
                if ($conceptId && $problemId) {
                    $this->createConceptProblemMapping($conceptId, $problemId, 1.00, true);
                }

                $syncedCount++;
            }

            Logger::info("Synced {$syncedCount} problems from Moodle questions");
            return ['success' => true, 'count' => $syncedCount];

        } catch (Exception $e) {
            Logger::error("Failed to sync problems: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 학생 진도 동기화
     */
    public function syncStudentProgress($studentId) {
        try {
            $prefix = MOODLE_DB_PREFIX;
            $sql = "SELECT
                        qa.questionid,
                        qa.responsesummary,
                        qa.rightanswer,
                        qa.maxmark,
                        qa.minfraction,
                        qas.fraction,
                        qas.timecreated
                    FROM {$prefix}question_attempts qa
                    JOIN {$prefix}question_attempt_steps qas ON qa.id = qas.questionattemptid
                    JOIN {$prefix}quiz_attempts quiza ON qa.questionusageid = quiza.uniqueid
                    WHERE quiza.userid = :student_id
                    ORDER BY qa.questionid, qas.timecreated";

            $stmt = $this->moodleDb->prepare($sql);
            $stmt->execute(['student_id' => $studentId]);
            $attempts = $stmt->fetchAll();

            $processedProblems = [];
            foreach ($attempts as $attempt) {
                $problemId = $this->findProblemByMoodleQuestionId($attempt['questionid']);
                if (!$problemId) continue;

                if (!isset($processedProblems[$problemId])) {
                    $processedProblems[$problemId] = [
                        'attempts' => 0,
                        'correct' => 0,
                        'scores' => [],
                        'time_spent' => 0
                    ];
                }

                $processedProblems[$problemId]['attempts']++;
                if ($attempt['fraction'] >= 0.99) {
                    $processedProblems[$problemId]['correct']++;
                }
                $processedProblems[$problemId]['scores'][] = $attempt['fraction'] * $attempt['maxmark'];
            }

            // 진도 업데이트
            foreach ($processedProblems as $problemId => $data) {
                $conceptId = $this->findPrimaryConceptForProblem($problemId);
                if ($conceptId) {
                    $this->updateStudentProgress($studentId, $problemId, $conceptId, $data);
                }
            }

            Logger::info("Synced progress for student {$studentId}");
            return ['success' => true, 'problems_synced' => count($processedProblems)];

        } catch (Exception $e) {
            Logger::error("Failed to sync student progress: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 개념 생성 또는 업데이트
     */
    private function createOrUpdateConcept($data) {
        $sql = "INSERT INTO concepts
                (name, description, category, difficulty_level, parent_concept_id, moodle_category_id)
                VALUES (:name, :description, :category, :difficulty_level, :parent_concept_id, :moodle_category_id)
                ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                category = VALUES(category),
                difficulty_level = VALUES(difficulty_level),
                parent_concept_id = VALUES(parent_concept_id)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $this->db->lastInsertId();
    }

    /**
     * 문제 생성 또는 업데이트
     */
    private function createOrUpdateProblem($data) {
        $sql = "INSERT INTO problems
                (title, description, problem_type, difficulty_level, points, moodle_question_id)
                VALUES (:title, :description, :problem_type, :difficulty_level, :points, :moodle_question_id)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                problem_type = VALUES(problem_type),
                difficulty_level = VALUES(difficulty_level),
                points = VALUES(points)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $this->db->lastInsertId();
    }

    /**
     * 개념-문제 매핑 생성
     */
    private function createConceptProblemMapping($conceptId, $problemId, $relevanceScore, $isPrimary) {
        $sql = "INSERT IGNORE INTO concept_problem_mapping
                (concept_id, problem_id, relevance_score, is_primary, mapping_type)
                VALUES (:concept_id, :problem_id, :relevance_score, :is_primary, 'direct')";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'concept_id' => $conceptId,
            'problem_id' => $problemId,
            'relevance_score' => $relevanceScore,
            'is_primary' => $isPrimary ? 1 : 0
        ]);
    }

    /**
     * 학생 진도 업데이트
     */
    private function updateStudentProgress($studentId, $problemId, $conceptId, $data) {
        $lastScore = end($data['scores']);
        $bestScore = max($data['scores']);
        $status = $this->determineStatus($data['correct'], $data['attempts'], $bestScore);

        $sql = "INSERT INTO student_progress
                (student_id, problem_id, concept_id, attempts, correct_attempts, last_score, best_score, status, last_attempt_at)
                VALUES (:student_id, :problem_id, :concept_id, :attempts, :correct_attempts, :last_score, :best_score, :status, NOW())
                ON DUPLICATE KEY UPDATE
                attempts = VALUES(attempts),
                correct_attempts = VALUES(correct_attempts),
                last_score = VALUES(last_score),
                best_score = GREATEST(best_score, VALUES(best_score)),
                status = VALUES(status),
                last_attempt_at = NOW()";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'student_id' => $studentId,
            'problem_id' => $problemId,
            'concept_id' => $conceptId,
            'attempts' => $data['attempts'],
            'correct_attempts' => $data['correct'],
            'last_score' => $lastScore,
            'best_score' => $bestScore,
            'status' => $status
        ]);
    }

    // 헬퍼 메서드들
    private function determineCategoryType($name) {
        if (preg_match('/분수|fraction/i', $name)) return '수학-분수';
        if (preg_match('/소수|decimal/i', $name)) return '수학-소수';
        if (preg_match('/도형|geometry/i', $name)) return '수학-도형';
        return '수학-일반';
    }

    private function estimateDifficulty($depth) {
        if ($depth <= 1) return 'beginner';
        if ($depth <= 2) return 'intermediate';
        return 'advanced';
    }

    private function estimateProblemDifficulty($points) {
        if ($points < 5) return 'easy';
        if ($points < 15) return 'medium';
        return 'hard';
    }

    private function determineStatus($correct, $attempts, $bestScore) {
        if ($attempts == 0) return 'not_started';
        if ($bestScore >= 90) return 'mastered';
        if ($correct > 0) return 'completed';
        return 'in_progress';
    }

    private function findParentConceptId($moodleParentId) {
        $sql = "SELECT id FROM concepts WHERE moodle_category_id = :moodle_id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['moodle_id' => $moodleParentId]);
        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }

    private function findConceptByMoodleCategoryId($categoryId) {
        $sql = "SELECT id FROM concepts WHERE moodle_category_id = :category_id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['category_id' => $categoryId]);
        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }

    private function findProblemByMoodleQuestionId($questionId) {
        $sql = "SELECT id FROM problems WHERE moodle_question_id = :question_id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['question_id' => $questionId]);
        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }

    private function findPrimaryConceptForProblem($problemId) {
        $sql = "SELECT concept_id FROM concept_problem_mapping
                WHERE problem_id = :problem_id AND is_primary = 1 LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['problem_id' => $problemId]);
        $result = $stmt->fetch();
        return $result ? $result['concept_id'] : null;
    }
}
