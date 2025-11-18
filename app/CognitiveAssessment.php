<?php
/**
 * Cognitive Assessment Management
 * Handles assessment creation, execution, and scoring
 */

class CognitiveAssessment {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new assessment
     * @param int $userId User ID
     * @param int $assessmentTypeId Assessment type ID
     * @param string $timing Assessment timing (baseline, pre_rest, post_rest)
     * @param int|null $restSessionId Optional rest session ID
     * @param int|null $courseId Optional course ID
     * @return int Assessment ID
     */
    public function createAssessment($userId, $assessmentTypeId, $timing, $restSessionId = null, $courseId = null) {
        $sql = "INSERT INTO cognitive_assessments
                (user_id, course_id, rest_session_id, assessment_type_id, assessment_timing, started_at, status)
                VALUES (:user_id, :course_id, :rest_session_id, :assessment_type_id, :timing, NOW(), 'created')";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':course_id' => $courseId,
            ':rest_session_id' => $restSessionId,
            ':assessment_type_id' => $assessmentTypeId,
            ':timing' => $timing
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Start an assessment
     * @param int $assessmentId Assessment ID
     * @return bool Success status
     */
    public function startAssessment($assessmentId) {
        $sql = "UPDATE cognitive_assessments
                SET status = 'in_progress', started_at = NOW()
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $assessmentId]);
    }

    /**
     * Get questions for an assessment
     * @param int $assessmentTypeId Assessment type ID
     * @param int $limit Number of questions
     * @return array Questions
     */
    public function getQuestions($assessmentTypeId, $limit = 20) {
        $sql = "SELECT * FROM assessment_questions
                WHERE assessment_type_id = :type_id AND is_active = 1
                ORDER BY RAND()
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':type_id', $assessmentTypeId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Record a response to a question
     * @param int $assessmentId Assessment ID
     * @param int $questionId Question ID
     * @param string $userAnswer User's answer
     * @param int $reactionTime Reaction time in milliseconds
     * @return int Response ID
     */
    public function recordResponse($assessmentId, $questionId, $userAnswer, $reactionTime) {
        // Get correct answer
        $question = $this->db->prepare("SELECT correct_answer FROM assessment_questions WHERE id = :id");
        $question->execute([':id' => $questionId]);
        $correctAnswer = $question->fetchColumn();

        $isCorrect = strcasecmp(trim($userAnswer), trim($correctAnswer)) === 0;

        $sql = "INSERT INTO assessment_responses
                (assessment_id, question_id, user_answer, is_correct, reaction_time, response_timestamp)
                VALUES (:assessment_id, :question_id, :user_answer, :is_correct, :reaction_time, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':assessment_id' => $assessmentId,
            ':question_id' => $questionId,
            ':user_answer' => $userAnswer,
            ':is_correct' => $isCorrect ? 1 : 0,
            ':reaction_time' => $reactionTime
        ]);

        return $this->db->lastInsertId();
    }

    /**
     * Complete an assessment and calculate scores
     * @param int $assessmentId Assessment ID
     * @return array Assessment results
     */
    public function completeAssessment($assessmentId) {
        // Get all responses
        $sql = "SELECT
                    COUNT(*) as total_questions,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                    AVG(reaction_time) as avg_reaction_time,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY reaction_time) as median_reaction_time
                FROM assessment_responses
                WHERE assessment_id = :assessment_id";

        // MySQL 5.7 doesn't support PERCENTILE_CONT, so we'll calculate median differently
        $sql = "SELECT
                    COUNT(*) as total_questions,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                    AVG(reaction_time) as avg_reaction_time
                FROM assessment_responses
                WHERE assessment_id = :assessment_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':assessment_id' => $assessmentId]);
        $stats = $stmt->fetch();

        // Calculate median manually for MySQL 5.7
        $medianSql = "SELECT reaction_time FROM assessment_responses
                      WHERE assessment_id = :assessment_id
                      ORDER BY reaction_time";
        $stmt = $this->db->prepare($medianSql);
        $stmt->execute([':assessment_id' => $assessmentId]);
        $times = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $median = 0;
        if (count($times) > 0) {
            $middle = floor(count($times) / 2);
            if (count($times) % 2 == 0) {
                $median = ($times[$middle - 1] + $times[$middle]) / 2;
            } else {
                $median = $times[$middle];
            }
        }

        // Calculate scores
        $totalQuestions = $stats['total_questions'];
        $correctAnswers = $stats['correct_answers'];
        $accuracyRate = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;
        $normalizedScore = $accuracyRate; // Can be adjusted based on difficulty

        // Get assessment start time
        $startSql = "SELECT started_at FROM cognitive_assessments WHERE id = :id";
        $stmt = $this->db->prepare($startSql);
        $stmt->execute([':id' => $assessmentId]);
        $startTime = $stmt->fetchColumn();

        $duration = time() - strtotime($startTime);

        // Update assessment with results
        $updateSql = "UPDATE cognitive_assessments SET
                        status = 'completed',
                        completed_at = NOW(),
                        duration = :duration,
                        questions_attempted = :attempted,
                        questions_correct = :correct,
                        accuracy_rate = :accuracy,
                        reaction_time_avg = :avg_time,
                        reaction_time_median = :median_time,
                        normalized_score = :score
                      WHERE id = :id";

        $stmt = $this->db->prepare($updateSql);
        $stmt->execute([
            ':duration' => $duration,
            ':attempted' => $totalQuestions,
            ':correct' => $correctAnswers,
            ':accuracy' => $accuracyRate,
            ':avg_time' => $stats['avg_reaction_time'],
            ':median_time' => $median,
            ':score' => $normalizedScore,
            ':id' => $assessmentId
        ]);

        return [
            'assessment_id' => $assessmentId,
            'total_questions' => $totalQuestions,
            'correct_answers' => $correctAnswers,
            'accuracy_rate' => $accuracyRate,
            'avg_reaction_time' => $stats['avg_reaction_time'],
            'median_reaction_time' => $median,
            'normalized_score' => $normalizedScore,
            'duration' => $duration
        ];
    }

    /**
     * Get assessment details
     * @param int $assessmentId Assessment ID
     * @return array Assessment data
     */
    public function getAssessment($assessmentId) {
        $sql = "SELECT ca.*, at.type_name, at.type_code, at.configuration,
                       u.username, u.email
                FROM cognitive_assessments ca
                JOIN assessment_types at ON ca.assessment_type_id = at.id
                JOIN users u ON ca.user_id = u.id
                WHERE ca.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $assessmentId]);
        return $stmt->fetch();
    }

    /**
     * Get user's assessment history
     * @param int $userId User ID
     * @param int $limit Number of results
     * @return array Assessments
     */
    public function getUserAssessments($userId, $limit = 50) {
        $sql = "SELECT ca.*, at.type_name, at.type_code
                FROM cognitive_assessments ca
                JOIN assessment_types at ON ca.assessment_type_id = at.id
                WHERE ca.user_id = :user_id
                ORDER BY ca.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
