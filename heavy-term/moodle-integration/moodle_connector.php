<?php
/**
 * Heavy Term - Moodle 3.7 Integration Connector
 * Compatible with PHP 7.1.9
 *
 * This class handles communication between Moodle LMS and Heavy Term application
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/questionlib.php');
require_once($CFG->dirroot . '/mod/quiz/locallib.php');

class HeavyTermMoodleConnector {

    private $db;
    private $moodle_db;
    private $config;

    /**
     * Constructor
     * @param object $moodle_db Moodle database connection
     * @param object $config Configuration object
     */
    public function __construct($moodle_db, $config) {
        $this->moodle_db = $moodle_db;
        $this->config = $config;
        $this->init_heavy_term_db();
    }

    /**
     * Initialize connection to Heavy Term database
     */
    private function init_heavy_term_db() {
        try {
            $this->db = new PDO(
                "mysql:host={$this->config->heavy_term_db_host};dbname={$this->config->heavy_term_db_name};charset=utf8mb4",
                $this->config->heavy_term_db_user,
                $this->config->heavy_term_db_password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                )
            );
        } catch (PDOException $e) {
            error_log('Heavy Term DB Connection Error: ' . $e->getMessage());
            throw new Exception('Unable to connect to Heavy Term database');
        }
    }

    /**
     * Fetch question details from Moodle
     * @param int $question_id Moodle question ID
     * @return object|false Question object or false on failure
     */
    public function get_moodle_question($question_id) {
        global $DB;

        try {
            $question = $DB->get_record('question', array('id' => $question_id));

            if (!$question) {
                return false;
            }

            // Load question type specific data
            $question = question_bank::load_question($question_id);

            return $question;
        } catch (Exception $e) {
            error_log('Error fetching Moodle question: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Fetch quiz questions for a given quiz ID
     * @param int $quiz_id Moodle quiz ID
     * @return array Array of question objects
     */
    public function get_quiz_questions($quiz_id) {
        global $DB;

        try {
            $quiz = $DB->get_record('quiz', array('id' => $quiz_id));
            if (!$quiz) {
                return array();
            }

            $questions = quiz_report_get_significant_questions($quiz);
            return $questions;
        } catch (Exception $e) {
            error_log('Error fetching quiz questions: ' . $e->getMessage());
            return array();
        }
    }

    /**
     * Extract mathematical terms from question text
     * Uses regex to identify mathematical expressions and terms
     * @param string $question_text Question text
     * @return array Array of terms with their properties
     */
    public function extract_mathematical_terms($question_text) {
        $terms = array();

        // Remove HTML tags
        $clean_text = strip_tags($question_text);

        // Pattern to match mathematical expressions
        // Matches: numbers, variables, expressions with operators
        $patterns = array(
            '/(\d+\.?\d*[a-zA-Z]?\^?\d*)/u',  // Numbers with optional variables/exponents
            '/([a-zA-Z]+\d*)/u',                // Variables
            '/(\([^)]+\))/u',                   // Parenthetical expressions
            '/(\d+\/\d+)/u',                    // Fractions
            '/([√∛∜][^+\-×÷=\s]+)/u'          // Roots
        );

        foreach ($patterns as $pattern) {
            preg_match_all($pattern, $clean_text, $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $term) {
                    $term = trim($term);
                    if (!empty($term) && !in_array($term, array_column($terms, 'text'))) {
                        $terms[] = array(
                            'text' => $term,
                            'size' => $this->calculate_term_size($term),
                            'weight' => $this->calculate_term_weight($term)
                        );
                    }
                }
            }
        }

        return $terms;
    }

    /**
     * Calculate term size based on complexity
     * Size affects gravity strength (1-10)
     * @param string $term Mathematical term
     * @return int Size value (1-10)
     */
    private function calculate_term_size($term) {
        $size = 1;

        // Check for exponents
        if (strpos($term, '^') !== false) {
            $size += 2;
        }

        // Check for roots
        if (preg_match('/[√∛∜]/', $term)) {
            $size += 2;
        }

        // Check for fractions
        if (strpos($term, '/') !== false) {
            $size += 1;
        }

        // Check for parentheses (nested expressions)
        $parens = substr_count($term, '(');
        $size += $parens;

        // Length factor
        $length = mb_strlen($term);
        if ($length > 10) {
            $size += 2;
        } else if ($length > 5) {
            $size += 1;
        }

        // Numerical value factor
        preg_match('/(\d+)/', $term, $matches);
        if (!empty($matches[1])) {
            $value = intval($matches[1]);
            if ($value > 100) {
                $size += 2;
            } else if ($value > 10) {
                $size += 1;
            }
        }

        return min(10, max(1, $size));
    }

    /**
     * Calculate term weight for gravity simulation
     * @param string $term Mathematical term
     * @return float Weight value
     */
    private function calculate_term_weight($term) {
        $weight = 1.0;

        // Extract numerical value if present
        preg_match('/(\d+\.?\d*)/', $term, $matches);
        if (!empty($matches[1])) {
            $value = floatval($matches[1]);
            // Weight is proportional to value (logarithmic scale)
            $weight = 1.0 + log10(max(1, $value));
        }

        return round($weight, 2);
    }

    /**
     * Sync Moodle question to Heavy Term database
     * @param int $question_id Moodle question ID
     * @param int $course_id Moodle course ID
     * @param int $quiz_id Optional quiz ID
     * @return int|false Heavy Term problem ID or false on failure
     */
    public function sync_question_to_heavy_term($question_id, $course_id, $quiz_id = null) {
        try {
            // Fetch question from Moodle
            $question = $this->get_moodle_question($question_id);

            if (!$question) {
                throw new Exception("Question not found: {$question_id}");
            }

            // Check if problem already exists
            $stmt = $this->db->prepare(
                "SELECT id FROM heavy_term_problems WHERE moodle_question_id = ?"
            );
            $stmt->execute(array($question_id));
            $existing = $stmt->fetch();

            if ($existing) {
                $problem_id = $existing['id'];
                // Update existing problem
                $stmt = $this->db->prepare(
                    "UPDATE heavy_term_problems
                     SET question_text = ?, question_type = ?, moodle_course_id = ?, moodle_quiz_id = ?
                     WHERE id = ?"
                );
                $stmt->execute(array(
                    $question->questiontext,
                    $question->qtype,
                    $course_id,
                    $quiz_id,
                    $problem_id
                ));
            } else {
                // Insert new problem
                $stmt = $this->db->prepare(
                    "INSERT INTO heavy_term_problems
                     (moodle_question_id, moodle_course_id, moodle_quiz_id, question_text, question_type)
                     VALUES (?, ?, ?, ?, ?)"
                );
                $stmt->execute(array(
                    $question_id,
                    $course_id,
                    $quiz_id,
                    $question->questiontext,
                    $question->qtype
                ));
                $problem_id = $this->db->lastInsertId();
            }

            // Extract and store terms
            $this->sync_terms_for_problem($problem_id, $question->questiontext);

            return $problem_id;

        } catch (Exception $e) {
            error_log('Error syncing question to Heavy Term: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Extract and sync terms for a problem
     * @param int $problem_id Heavy Term problem ID
     * @param string $question_text Question text
     */
    private function sync_terms_for_problem($problem_id, $question_text) {
        try {
            // Delete existing terms
            $stmt = $this->db->prepare("DELETE FROM heavy_term_terms WHERE problem_id = ?");
            $stmt->execute(array($problem_id));

            // Extract new terms
            $terms = $this->extract_mathematical_terms($question_text);

            // Insert new terms
            $stmt = $this->db->prepare(
                "INSERT INTO heavy_term_terms
                 (problem_id, term_text, term_size, term_weight)
                 VALUES (?, ?, ?, ?)"
            );

            foreach ($terms as $term) {
                $stmt->execute(array(
                    $problem_id,
                    $term['text'],
                    $term['size'],
                    $term['weight']
                ));
            }

        } catch (Exception $e) {
            error_log('Error syncing terms: ' . $e->getMessage());
        }
    }

    /**
     * Create user session
     * @param int $user_id Moodle user ID
     * @param int $problem_id Heavy Term problem ID
     * @param string $device_type Device type (smartphone, tablet, desktop)
     * @return int|false Session ID or false on failure
     */
    public function create_user_session($user_id, $problem_id, $device_type = 'smartphone') {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO heavy_term_user_sessions
                 (moodle_user_id, problem_id, device_type)
                 VALUES (?, ?, ?)"
            );
            $stmt->execute(array($user_id, $problem_id, $device_type));

            return $this->db->lastInsertId();
        } catch (Exception $e) {
            error_log('Error creating user session: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Log user interaction
     * @param int $session_id Session ID
     * @param int $term_id Term ID
     * @param string $interaction_type Type of interaction
     * @param array $data Additional interaction data
     * @return bool Success status
     */
    public function log_interaction($session_id, $term_id, $interaction_type, $data = array()) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO heavy_term_interactions
                 (session_id, term_id, interaction_type, position_x, position_y, interaction_data)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );

            $stmt->execute(array(
                $session_id,
                $term_id,
                $interaction_type,
                $data['position_x'] ?? null,
                $data['position_y'] ?? null,
                json_encode($data)
            ));

            return true;
        } catch (Exception $e) {
            error_log('Error logging interaction: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get problem data with terms
     * @param int $problem_id Heavy Term problem ID
     * @return array|false Problem data or false on failure
     */
    public function get_problem_with_terms($problem_id) {
        try {
            $stmt = $this->db->prepare(
                "SELECT * FROM heavy_term_problems WHERE id = ?"
            );
            $stmt->execute(array($problem_id));
            $problem = $stmt->fetch();

            if (!$problem) {
                return false;
            }

            $stmt = $this->db->prepare(
                "SELECT * FROM heavy_term_terms WHERE problem_id = ? ORDER BY term_size DESC"
            );
            $stmt->execute(array($problem_id));
            $problem['terms'] = $stmt->fetchAll();

            return $problem;
        } catch (Exception $e) {
            error_log('Error fetching problem with terms: ' . $e->getMessage());
            return false;
        }
    }
}
