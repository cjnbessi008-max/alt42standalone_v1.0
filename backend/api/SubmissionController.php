<?php
/**
 * Submission Controller
 * Handles student answer submissions
 */

class SubmissionController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all submissions
     */
    public function getAll() {
        $problemId = $_GET['problemId'] ?? null;
        $studentId = $_GET['studentId'] ?? null;

        $sql = "SELECT s.*, p.title as problem_title
                FROM submissions s
                LEFT JOIN problems p ON s.problem_id = p.id
                WHERE 1=1";

        $params = [];

        if ($problemId) {
            $sql .= " AND s.problem_id = :problemId";
            $params[':problemId'] = $problemId;
        }

        if ($studentId) {
            $sql .= " AND s.student_id = :studentId";
            $params[':studentId'] = $studentId;
        }

        $sql .= " ORDER BY s.submitted_at DESC";

        $submissions = $this->db->fetchAll($sql, $params);
        sendResponse($submissions);
    }

    /**
     * Get single submission
     */
    public function getOne($id) {
        $sql = "SELECT s.*, p.title as problem_title
                FROM submissions s
                LEFT JOIN problems p ON s.problem_id = p.id
                WHERE s.id = :id";

        $submission = $this->db->fetchOne($sql, [':id' => $id]);

        if (!$submission) {
            sendError('Submission not found', 404);
        }

        sendResponse($submission);
    }

    /**
     * Create submission (handled by ProblemController)
     */
    public function create() {
        sendError('Use /api/problems/{id}/submit endpoint', 400);
    }

    /**
     * Update submission
     */
    public function update($id) {
        $data = getRequestBody();

        $sql = "UPDATE submissions SET
                is_correct = :is_correct,
                score = :score
                WHERE id = :id";

        $params = [
            ':id' => $id,
            ':is_correct' => $data['is_correct'] ?? false,
            ':score' => $data['score'] ?? 0
        ];

        $affected = $this->db->update($sql, $params);

        if ($affected === 0) {
            sendError('Submission not found', 404);
        }

        sendResponse(['message' => 'Submission updated successfully']);
    }

    /**
     * Delete submission
     */
    public function delete($id) {
        $sql = "DELETE FROM submissions WHERE id = :id";
        $affected = $this->db->delete($sql, [':id' => $id]);

        if ($affected === 0) {
            sendError('Submission not found', 404);
        }

        sendResponse(['message' => 'Submission deleted successfully']);
    }

    /**
     * Handle custom actions
     */
    public function handleAction($id, $action) {
        sendError('Action not found', 404);
    }
}
