<?php
/**
 * StudentProgress Model
 * Handles student progress tracking
 */

class StudentProgress {
    private $conn;
    private $table = 'student_progress';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create new progress entry
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table . "
                  (student_id, question_id, session_id, attempt_number, answer_data)
                  VALUES
                  (:student_id, :question_id, :session_id, :attempt_number, :answer_data)";

        $stmt = $this->conn->prepare($query);

        $answer_json = json_encode($data['answer_data'], JSON_UNESCAPED_UNICODE);

        $stmt->bindParam(':student_id', $data['student_id']);
        $stmt->bindParam(':question_id', $data['question_id']);
        $stmt->bindParam(':session_id', $data['session_id']);
        $stmt->bindParam(':attempt_number', $data['attempt_number']);
        $stmt->bindParam(':answer_data', $answer_json);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update progress entry
     */
    public function update($id, $data) {
        $fields = [];
        $params = [':id' => $id];

        if (isset($data['is_correct'])) {
            $fields[] = "is_correct = :is_correct";
            $params[':is_correct'] = $data['is_correct'];
        }

        if (isset($data['time_spent_seconds'])) {
            $fields[] = "time_spent_seconds = :time_spent_seconds";
            $params[':time_spent_seconds'] = $data['time_spent_seconds'];
        }

        if (isset($data['interaction_count'])) {
            $fields[] = "interaction_count = :interaction_count";
            $params[':interaction_count'] = $data['interaction_count'];
        }

        if (isset($data['completed_at'])) {
            $fields[] = "completed_at = :completed_at";
            $params[':completed_at'] = $data['completed_at'];
        }

        if (isset($data['answer_data'])) {
            $fields[] = "answer_data = :answer_data";
            $params[':answer_data'] = json_encode($data['answer_data'], JSON_UNESCAPED_UNICODE);
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE " . $this->table . "
                  SET " . implode(', ', $fields) . "
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        return $stmt->execute();
    }

    /**
     * Get progress by ID
     */
    public function getById($id) {
        $query = "SELECT sp.*,
                  s.username, s.full_name,
                  q.title as question_title, q.question_type
                  FROM " . $this->table . " sp
                  LEFT JOIN students s ON sp.student_id = s.id
                  LEFT JOIN questions q ON sp.question_id = q.id
                  WHERE sp.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $result = $stmt->fetch();
        if ($result && !empty($result['answer_data'])) {
            $result['answer_data'] = json_decode($result['answer_data'], true);
        }

        return $result;
    }

    /**
     * Get student progress for a question
     */
    public function getStudentQuestionProgress($student_id, $question_id) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE student_id = :student_id
                  AND question_id = :question_id
                  ORDER BY attempt_number DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':question_id', $question_id);
        $stmt->execute();

        $results = $stmt->fetchAll();
        foreach ($results as &$result) {
            if (!empty($result['answer_data'])) {
                $result['answer_data'] = json_decode($result['answer_data'], true);
            }
        }

        return $results;
    }

    /**
     * Get student statistics
     */
    public function getStudentStats($student_id) {
        $query = "SELECT
                  COUNT(*) as total_attempts,
                  SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                  SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_answers,
                  AVG(time_spent_seconds) as avg_time_spent,
                  AVG(interaction_count) as avg_interactions,
                  COUNT(DISTINCT question_id) as unique_questions
                  FROM " . $this->table . "
                  WHERE student_id = :student_id
                  AND completed_at IS NOT NULL";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        $stats = $stmt->fetch();

        if ($stats && $stats['total_attempts'] > 0) {
            $stats['accuracy_rate'] = round(
                ($stats['correct_answers'] / $stats['total_attempts']) * 100,
                2
            );
        } else {
            $stats['accuracy_rate'] = 0;
        }

        return $stats;
    }

    /**
     * Get next attempt number for a question
     */
    public function getNextAttemptNumber($student_id, $question_id) {
        $query = "SELECT MAX(attempt_number) as max_attempt
                  FROM " . $this->table . "
                  WHERE student_id = :student_id
                  AND question_id = :question_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':question_id', $question_id);
        $stmt->execute();

        $result = $stmt->fetch();
        return ($result && $result['max_attempt']) ? $result['max_attempt'] + 1 : 1;
    }

    /**
     * Check if student can attempt question
     */
    public function canAttempt($student_id, $question_id) {
        $query = "SELECT COUNT(*) as attempt_count
                  FROM " . $this->table . "
                  WHERE student_id = :student_id
                  AND question_id = :question_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':question_id', $question_id);
        $stmt->execute();

        $result = $stmt->fetch();
        $attempt_count = $result ? $result['attempt_count'] : 0;

        return $attempt_count < MAX_ATTEMPTS_PER_QUESTION;
    }

    /**
     * Get recent progress by student
     */
    public function getRecentByStudent($student_id, $limit = 10) {
        $query = "SELECT sp.*,
                  q.title as question_title, q.question_type, q.difficulty_level
                  FROM " . $this->table . " sp
                  LEFT JOIN questions q ON sp.question_id = q.id
                  WHERE sp.student_id = :student_id
                  ORDER BY sp.started_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll();
        foreach ($results as &$result) {
            if (!empty($result['answer_data'])) {
                $result['answer_data'] = json_decode($result['answer_data'], true);
            }
        }

        return $results;
    }
}
