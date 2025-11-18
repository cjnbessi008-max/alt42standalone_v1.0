<?php
/**
 * Problem Model
 * Handles integration problems data
 */

require_once __DIR__ . '/../config/database.php';

class Problem {
    private $db;

    public $id;
    public $moodleQuestionId;
    public $problemLatex;
    public $correctU;
    public $correctDv;
    public $difficulty;
    public $hints;
    public $createdAt;
    public $updatedAt;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get problem by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM integration_problems WHERE id = ?";
        $result = $this->db->fetchOne($sql, [$id]);

        if ($result) {
            $this->hydrate($result);
            return $this;
        }
        return null;
    }

    /**
     * Get problem by Moodle question ID
     */
    public function getByMoodleQuestionId($moodleQuestionId) {
        $sql = "SELECT * FROM integration_problems WHERE moodle_question_id = ?";
        $result = $this->db->fetchOne($sql, [$moodleQuestionId]);

        if ($result) {
            $this->hydrate($result);
            return $this;
        }
        return null;
    }

    /**
     * Get all problems
     */
    public function getAll($difficulty = null) {
        if ($difficulty) {
            $sql = "SELECT * FROM integration_problems WHERE difficulty = ? ORDER BY id ASC";
            $results = $this->db->fetchAll($sql, [$difficulty]);
        } else {
            $sql = "SELECT * FROM integration_problems ORDER BY id ASC";
            $results = $this->db->fetchAll($sql);
        }

        return $results;
    }

    /**
     * Get random problem by difficulty
     */
    public function getRandom($difficulty = null) {
        if ($difficulty) {
            $sql = "SELECT * FROM integration_problems WHERE difficulty = ? ORDER BY RAND() LIMIT 1";
            $result = $this->db->fetchOne($sql, [$difficulty]);
        } else {
            $sql = "SELECT * FROM integration_problems ORDER BY RAND() LIMIT 1";
            $result = $this->db->fetchOne($sql);
        }

        if ($result) {
            $this->hydrate($result);
            return $this;
        }
        return null;
    }

    /**
     * Create new problem
     */
    public function create($data) {
        $sql = "INSERT INTO integration_problems
                (moodle_question_id, problem_latex, correct_u, correct_dv, difficulty, hints)
                VALUES (?, ?, ?, ?, ?, ?)";

        $hints = is_array($data['hints']) ? json_encode($data['hints']) : $data['hints'];

        $params = [
            $data['moodle_question_id'],
            $data['problem_latex'],
            $data['correct_u'],
            $data['correct_dv'],
            $data['difficulty'] ?? 'medium',
            $hints
        ];

        $this->db->query($sql, $params);
        $this->id = $this->db->lastInsertId();

        return $this->getById($this->id);
    }

    /**
     * Update problem
     */
    public function update($id, $data) {
        $fields = [];
        $params = [];

        $allowedFields = ['problem_latex', 'correct_u', 'correct_dv', 'difficulty', 'hints'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $dbField = $this->camelToSnake($field);
                $fields[] = "$dbField = ?";

                if ($field === 'hints' && is_array($data[$field])) {
                    $params[] = json_encode($data[$field]);
                } else {
                    $params[] = $data[$field];
                }
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $sql = "UPDATE integration_problems SET " . implode(', ', $fields) . " WHERE id = ?";

        $this->db->query($sql, $params);
        return $this->getById($id);
    }

    /**
     * Delete problem
     */
    public function delete($id) {
        $sql = "DELETE FROM integration_problems WHERE id = ?";
        $this->db->query($sql, [$id]);
        return true;
    }

    /**
     * Validate answer
     */
    public function validateAnswer($selectedU, $selectedDv) {
        // Normalize LaTeX strings for comparison
        $selectedU = $this->normalizeLatex($selectedU);
        $selectedDv = $this->normalizeLatex($selectedDv);
        $correctU = $this->normalizeLatex($this->correctU);
        $correctDv = $this->normalizeLatex($this->correctDv);

        return ($selectedU === $correctU && $selectedDv === $correctDv);
    }

    /**
     * Get hints array
     */
    public function getHints() {
        if (is_string($this->hints)) {
            return json_decode($this->hints, true) ?: [];
        }
        return $this->hints ?: [];
    }

    /**
     * Get specific hint by index
     */
    public function getHint($index) {
        $hints = $this->getHints();
        return isset($hints[$index]) ? $hints[$index] : null;
    }

    /**
     * Calculate next steps (du and v)
     */
    public function calculateNextSteps($u, $dv) {
        // This is a simplified version
        // In production, you would use a Computer Algebra System

        $steps = [
            'u' => $u,
            'dv' => $dv,
            'du' => $this->differentiate($u),
            'v' => $this->integrate($dv)
        ];

        return $steps;
    }

    /**
     * Simple differentiation (placeholder)
     */
    private function differentiate($expr) {
        // Simplified - in production use CAS
        $expr = trim($expr);

        $rules = [
            '/^x$/' => 'dx',
            '/^x\^2$/' => '2x dx',
            '/^x\^(\d+)$/' => function($matches) {
                $n = intval($matches[1]);
                return $n . 'x^' . ($n - 1) . ' dx';
            },
            '/^\\\\ln\(x\)$/' => '\\frac{1}{x} dx',
            '/^e\^x$/' => 'e^x dx',
        ];

        foreach ($rules as $pattern => $replacement) {
            if (preg_match($pattern, $expr)) {
                if (is_callable($replacement)) {
                    return preg_replace_callback($pattern, $replacement, $expr);
                }
                return preg_replace($pattern, $replacement, $expr);
            }
        }

        return "d($expr)"; // Fallback
    }

    /**
     * Simple integration (placeholder)
     */
    private function integrate($expr) {
        // Simplified - in production use CAS
        $expr = trim($expr);
        $expr = str_replace(' dx', '', $expr);

        $rules = [
            '/^1$/' => 'x',
            '/^x$/' => '\\frac{x^2}{2}',
            '/^x\^(\d+)$/' => function($matches) {
                $n = intval($matches[1]);
                return '\\frac{x^' . ($n + 1) . '}{' . ($n + 1) . '}';
            },
            '/^e\^x$/' => 'e^x',
            '/^\\\\sin\(x\)$/' => '-\\cos(x)',
            '/^\\\\cos\(x\)$/' => '\\sin(x)',
        ];

        foreach ($rules as $pattern => $replacement) {
            if (preg_match($pattern, $expr)) {
                if (is_callable($replacement)) {
                    return preg_replace_callback($pattern, $replacement, $expr);
                }
                return preg_replace($pattern, $replacement, $expr);
            }
        }

        return "\\int $expr \\, dx"; // Fallback
    }

    /**
     * Normalize LaTeX for comparison
     */
    private function normalizeLatex($latex) {
        $latex = trim($latex);
        $latex = preg_replace('/\s+/', '', $latex); // Remove whitespace
        $latex = str_replace([' dx', 'dx'], '', $latex); // Remove dx for comparison
        $latex = strtolower($latex);
        return $latex;
    }

    /**
     * Convert camelCase to snake_case
     */
    private function camelToSnake($input) {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }

    /**
     * Hydrate object from database result
     */
    private function hydrate($data) {
        $this->id = $data['id'];
        $this->moodleQuestionId = $data['moodle_question_id'];
        $this->problemLatex = $data['problem_latex'];
        $this->correctU = $data['correct_u'];
        $this->correctDv = $data['correct_dv'];
        $this->difficulty = $data['difficulty'];
        $this->hints = $data['hints'];
        $this->createdAt = $data['created_at'];
        $this->updatedAt = $data['updated_at'];
    }

    /**
     * Convert to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'moodleQuestionId' => $this->moodleQuestionId,
            'problemLatex' => $this->problemLatex,
            'correctU' => $this->correctU,
            'correctDv' => $this->correctDv,
            'difficulty' => $this->difficulty,
            'hints' => $this->getHints(),
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }
}
