<?php
/**
 * Problem Controller
 * Handles CRUD operations for math problems
 */

class ProblemController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all problems
     */
    public function getAll() {
        $courseId = $_GET['courseId'] ?? null;
        $category = $_GET['category'] ?? null;
        $difficulty = $_GET['difficulty'] ?? null;

        $sql = "SELECT p.*,
                       GROUP_CONCAT(ph.hint_text ORDER BY ph.hint_order SEPARATOR '|||') AS hints
                FROM problems p
                LEFT JOIN problem_hints ph ON p.id = ph.problem_id";

        $where = [];
        $params = [];

        if ($category) {
            $where[] = "p.category = :category";
            $params[':category'] = $category;
        }

        if ($difficulty) {
            $where[] = "p.difficulty = :difficulty";
            $params[':difficulty'] = $difficulty;
        }

        if ($courseId) {
            $sql .= " LEFT JOIN moodle_integration mi ON p.id = mi.problem_id";
            $where[] = "mi.moodle_course_id = :courseId";
            $params[':courseId'] = $courseId;
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";

        $problems = $this->db->fetchAll($sql, $params);

        // Parse hints
        foreach ($problems as &$problem) {
            $problem['hints'] = $problem['hints'] ? explode('|||', $problem['hints']) : [];
        }

        sendResponse($problems);
    }

    /**
     * Get single problem by ID
     */
    public function getOne($id) {
        $sql = "SELECT p.*,
                       GROUP_CONCAT(ph.hint_text ORDER BY ph.hint_order SEPARATOR '|||') AS hints
                FROM problems p
                LEFT JOIN problem_hints ph ON p.id = ph.problem_id
                WHERE p.id = :id
                GROUP BY p.id";

        $problem = $this->db->fetchOne($sql, [':id' => $id]);

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        // Parse hints
        $problem['hints'] = $problem['hints'] ? explode('|||', $problem['hints']) : [];

        // Get animation settings
        $settingsSql = "SELECT * FROM animation_settings WHERE problem_id = :id";
        $settings = $this->db->fetchOne($settingsSql, [':id' => $id]);

        if ($settings) {
            $problem['animationSettings'] = $settings;
        }

        sendResponse($problem);
    }

    /**
     * Create new problem
     */
    public function create() {
        $data = getRequestBody();

        // Validate required fields
        $required = ['title', 'function1', 'function2', 'category'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                sendError("Field '$field' is required", 400);
            }
        }

        try {
            $this->db->beginTransaction();

            // Insert problem
            $sql = "INSERT INTO problems
                    (title, description, function1, function2, color1, color2,
                     difficulty, category, blend_mode, x_min, x_max, y_min, y_max)
                    VALUES
                    (:title, :description, :function1, :function2, :color1, :color2,
                     :difficulty, :category, :blend_mode, :x_min, :x_max, :y_min, :y_max)";

            $params = [
                ':title' => $data['title'],
                ':description' => $data['description'] ?? '',
                ':function1' => $data['function1'],
                ':function2' => $data['function2'],
                ':color1' => $data['color1'] ?? '#3B82F6',
                ':color2' => $data['color2'] ?? '#EC4899',
                ':difficulty' => $data['difficulty'] ?? 'medium',
                ':category' => $data['category'],
                ':blend_mode' => $data['blend_mode'] ?? 'difference',
                ':x_min' => $data['x_min'] ?? -5,
                ':x_max' => $data['x_max'] ?? 5,
                ':y_min' => $data['y_min'] ?? -10,
                ':y_max' => $data['y_max'] ?? 10
            ];

            $problemId = $this->db->insert($sql, $params);

            // Insert hints if provided
            if (!empty($data['hints']) && is_array($data['hints'])) {
                $hintSql = "INSERT INTO problem_hints (problem_id, hint_text, hint_order)
                           VALUES (:problem_id, :hint_text, :hint_order)";

                foreach ($data['hints'] as $order => $hint) {
                    $this->db->insert($hintSql, [
                        ':problem_id' => $problemId,
                        ':hint_text' => $hint,
                        ':hint_order' => $order
                    ]);
                }
            }

            // Insert default animation settings
            $animSql = "INSERT INTO animation_settings (problem_id) VALUES (:problem_id)";
            $this->db->insert($animSql, [':problem_id' => $problemId]);

            $this->db->commit();

            sendResponse([
                'id' => $problemId,
                'message' => 'Problem created successfully'
            ], 201);

        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }

    /**
     * Update problem
     */
    public function update($id) {
        $data = getRequestBody();

        $sql = "UPDATE problems SET
                title = :title,
                description = :description,
                function1 = :function1,
                function2 = :function2,
                color1 = :color1,
                color2 = :color2,
                difficulty = :difficulty,
                category = :category,
                blend_mode = :blend_mode
                WHERE id = :id";

        $params = [
            ':id' => $id,
            ':title' => $data['title'],
            ':description' => $data['description'],
            ':function1' => $data['function1'],
            ':function2' => $data['function2'],
            ':color1' => $data['color1'],
            ':color2' => $data['color2'],
            ':difficulty' => $data['difficulty'],
            ':category' => $data['category'],
            ':blend_mode' => $data['blend_mode']
        ];

        $affected = $this->db->update($sql, $params);

        if ($affected === 0) {
            sendError('Problem not found', 404);
        }

        sendResponse(['message' => 'Problem updated successfully']);
    }

    /**
     * Delete problem
     */
    public function delete($id) {
        $sql = "DELETE FROM problems WHERE id = :id";
        $affected = $this->db->delete($sql, [':id' => $id]);

        if ($affected === 0) {
            sendError('Problem not found', 404);
        }

        sendResponse(['message' => 'Problem deleted successfully']);
    }

    /**
     * Handle custom actions
     */
    public function handleAction($id, $action) {
        switch ($action) {
            case 'submit':
                $this->submitAnswer($id);
                break;

            case 'stats':
                $this->getStats($id);
                break;

            default:
                sendError('Action not found', 404);
                break;
        }
    }

    /**
     * Submit answer to problem
     */
    private function submitAnswer($id) {
        $data = getRequestBody();

        $sql = "INSERT INTO submissions
                (problem_id, student_id, student_name, submitted_answer, time_spent)
                VALUES (:problem_id, :student_id, :student_name, :answer, :time_spent)";

        $params = [
            ':problem_id' => $id,
            ':student_id' => $data['student_id'] ?? null,
            ':student_name' => $data['student_name'] ?? 'Anonymous',
            ':answer' => $data['answer'] ?? '',
            ':time_spent' => $data['time_spent'] ?? 0
        ];

        $submissionId = $this->db->insert($sql, $params);

        sendResponse([
            'id' => $submissionId,
            'correct' => true, // TODO: Implement answer validation
            'message' => 'Answer submitted successfully'
        ], 201);
    }

    /**
     * Get problem statistics
     */
    private function getStats($id) {
        $sql = "SELECT * FROM vw_problem_stats WHERE problem_id = :id";
        $stats = $this->db->fetchOne($sql, [':id' => $id]);

        if (!$stats) {
            sendError('Problem not found', 404);
        }

        sendResponse($stats);
    }
}
