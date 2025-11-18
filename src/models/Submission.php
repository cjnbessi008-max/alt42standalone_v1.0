<?php
/**
 * Submission Model
 * Handles student submissions with self-verification
 */

class Submission {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create new submission
     */
    public function create($data) {
        return $this->db->insert('student_submissions', [
            'problem_id' => $data['problem_id'],
            'student_id' => $data['student_id'],
            'lti_resource_link_id' => $data['lti_resource_link_id'] ?? null,
            'student_answer' => $data['student_answer'],
            'work_shown' => $data['work_shown'] ?? '',
            'self_verification' => $data['self_verification'],
            'is_correct' => $data['is_correct'] ?? null,
            'score' => $data['score'] ?? null,
            'max_score' => $data['max_score'] ?? null,
            'time_spent_seconds' => $data['time_spent_seconds'] ?? null,
            'attempt_number' => $data['attempt_number'] ?? 1,
            'status' => $data['status'] ?? 'draft'
        ]);
    }

    /**
     * Get submission by ID
     */
    public function getById($id) {
        $sql = "SELECT s.*, p.title as problem_title, p.problem_statement,
                       u.full_name as student_name
                FROM student_submissions s
                JOIN problems p ON s.problem_id = p.id
                JOIN users u ON s.student_id = u.id
                WHERE s.id = :id";

        $submission = $this->db->fetchOne($sql, [':id' => $id]);

        if ($submission && $submission['ai_feedback']) {
            $submission['ai_feedback'] = json_decode($submission['ai_feedback'], true);
        }

        return $submission;
    }

    /**
     * Get student's submission for a problem
     */
    public function getByStudentAndProblem($studentId, $problemId) {
        $sql = "SELECT * FROM student_submissions
                WHERE student_id = :student_id
                AND problem_id = :problem_id
                ORDER BY attempt_number DESC
                LIMIT 1";

        return $this->db->fetchOne($sql, [
            ':student_id' => $studentId,
            ':problem_id' => $problemId
        ]);
    }

    /**
     * Get all submissions for a problem
     */
    public function getByProblem($problemId) {
        $sql = "SELECT s.*, u.full_name as student_name
                FROM student_submissions s
                JOIN users u ON s.student_id = u.id
                WHERE s.problem_id = :problem_id
                ORDER BY s.submitted_at DESC";

        return $this->db->fetchAll($sql, [':problem_id' => $problemId]);
    }

    /**
     * Get all submissions by student
     */
    public function getByStudent($studentId) {
        $sql = "SELECT s.*, p.title as problem_title
                FROM student_submissions s
                JOIN problems p ON s.problem_id = p.id
                WHERE s.student_id = :student_id
                ORDER BY s.created_at DESC";

        return $this->db->fetchAll($sql, [':student_id' => $studentId]);
    }

    /**
     * Update submission
     */
    public function update($id, $data) {
        $updateData = [];

        $allowedFields = [
            'student_answer', 'work_shown', 'self_verification',
            'is_correct', 'teacher_feedback', 'ai_feedback',
            'score', 'max_score', 'time_spent_seconds', 'status',
            'submitted_at', 'graded_at'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'ai_feedback' && is_array($data[$field])) {
                    $updateData[$field] = json_encode($data[$field]);
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        return $this->db->update('student_submissions', $updateData, 'id = :id', [':id' => $id]);
    }

    /**
     * Submit (finalize) submission
     */
    public function submit($id) {
        return $this->db->update('student_submissions', [
            'status' => 'submitted',
            'submitted_at' => date('Y-m-d H:i:s')
        ], 'id = :id', [':id' => $id]);
    }

    /**
     * Grade submission
     */
    public function grade($id, $score, $maxScore, $isCorrect, $feedback = null) {
        $data = [
            'score' => $score,
            'max_score' => $maxScore,
            'is_correct' => $isCorrect,
            'status' => 'graded',
            'graded_at' => date('Y-m-d H:i:s')
        ];

        if ($feedback !== null) {
            $data['teacher_feedback'] = $feedback;
        }

        return $this->db->update('student_submissions', $data, 'id = :id', [':id' => $id]);
    }

    /**
     * Add AI verification to submission
     */
    public function addAIVerification($submissionId, $verificationData) {
        // Insert into problem_verifications table
        $verificationId = $this->db->insert('problem_verifications', [
            'submission_id' => $submissionId,
            'verification_text' => $verificationData['verification_text'],
            'ai_score' => $verificationData['ai_score'] ?? null,
            'logic_score' => $verificationData['logic_score'] ?? null,
            'completeness_score' => $verificationData['completeness_score'] ?? null,
            'clarity_score' => $verificationData['clarity_score'] ?? null,
            'ai_feedback' => $verificationData['feedback'] ?? null,
            'ai_suggestions' => $verificationData['suggestions'] ?? null,
            'processed_by' => $verificationData['processed_by'] ?? 'claude',
            'processing_time_ms' => $verificationData['processing_time_ms'] ?? null
        ]);

        // Update submission with AI feedback
        $this->db->update('student_submissions', [
            'ai_feedback' => json_encode($verificationData)
        ], 'id = :id', [':id' => $submissionId]);

        return $verificationId;
    }

    /**
     * Get verification analysis for submission
     */
    public function getVerification($submissionId) {
        $sql = "SELECT * FROM problem_verifications
                WHERE submission_id = :submission_id
                ORDER BY created_at DESC
                LIMIT 1";

        return $this->db->fetchOne($sql, [':submission_id' => $submissionId]);
    }

    /**
     * Get next attempt number for student
     */
    public function getNextAttemptNumber($studentId, $problemId) {
        $sql = "SELECT MAX(attempt_number) as max_attempt
                FROM student_submissions
                WHERE student_id = :student_id AND problem_id = :problem_id";

        $result = $this->db->fetchOne($sql, [
            ':student_id' => $studentId,
            ':problem_id' => $problemId
        ]);

        return ($result['max_attempt'] ?? 0) + 1;
    }

    /**
     * Delete submission
     */
    public function delete($id) {
        return $this->db->delete('student_submissions', 'id = :id', [':id' => $id]);
    }
}
