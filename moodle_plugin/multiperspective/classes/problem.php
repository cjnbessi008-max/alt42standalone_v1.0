<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Problem management class
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_multiperspective;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing problems in multi-perspective practice
 */
class problem {

    /** @var int Problem ID */
    protected $id;

    /** @var int Multi-perspective activity ID */
    protected $multiperspectiveid;

    /** @var string Problem title */
    protected $title;

    /** @var string Problem description */
    protected $description;

    /** @var string Problem type (open, multiple_choice, numeric) */
    protected $problem_type;

    /** @var string Correct answer */
    protected $correct_answer;

    /** @var int Difficulty level (1-5) */
    protected $difficulty_level;

    /** @var int Sort order */
    protected $sort_order;

    /** @var array Array of perspective objects */
    protected $perspectives = null;

    /**
     * Constructor
     *
     * @param int $id Problem ID (0 for new problem)
     * @param stdClass|null $data Problem data
     */
    public function __construct($id = 0, $data = null) {
        global $DB;

        if ($id > 0) {
            $this->id = $id;
            if ($data) {
                $this->load_from_object($data);
            } else {
                $this->load_from_db();
            }
        } elseif ($data) {
            $this->load_from_object($data);
        }
    }

    /**
     * Load problem data from database
     */
    protected function load_from_db() {
        global $DB;

        $record = $DB->get_record('multiperspective_problems', array('id' => $this->id), '*', MUST_EXIST);
        $this->load_from_object($record);
    }

    /**
     * Load problem data from object
     *
     * @param stdClass $data Problem data
     */
    protected function load_from_object($data) {
        $this->id = isset($data->id) ? $data->id : 0;
        $this->multiperspectiveid = $data->multiperspectiveid;
        $this->title = $data->title;
        $this->description = $data->description;
        $this->problem_type = $data->problem_type;
        $this->correct_answer = isset($data->correct_answer) ? $data->correct_answer : null;
        $this->difficulty_level = isset($data->difficulty_level) ? $data->difficulty_level : 1;
        $this->sort_order = isset($data->sort_order) ? $data->sort_order : 0;
    }

    /**
     * Save problem to database
     *
     * @return int Problem ID
     */
    public function save() {
        global $DB;

        $data = new \stdClass();
        $data->multiperspectiveid = $this->multiperspectiveid;
        $data->title = $this->title;
        $data->description = $this->description;
        $data->problem_type = $this->problem_type;
        $data->correct_answer = $this->correct_answer;
        $data->difficulty_level = $this->difficulty_level;
        $data->sort_order = $this->sort_order;

        if ($this->id > 0) {
            $data->id = $this->id;
            $data->timemodified = time();
            $DB->update_record('multiperspective_problems', $data);
        } else {
            $data->timecreated = time();
            $data->timemodified = time();
            $this->id = $DB->insert_record('multiperspective_problems', $data);
        }

        return $this->id;
    }

    /**
     * Delete problem and all related data
     *
     * @return bool Success
     */
    public function delete() {
        global $DB;

        if ($this->id <= 0) {
            return false;
        }

        // Delete perspectives
        $perspectives = $this->get_perspectives();
        foreach ($perspectives as $perspective) {
            $perspective->delete();
        }

        // Delete attempts
        $DB->delete_records('multiperspective_attempts', array('problemid' => $this->id));

        // Delete views
        $DB->delete_records('multiperspective_views', array('problemid' => $this->id));

        // Delete problem
        return $DB->delete_records('multiperspective_problems', array('id' => $this->id));
    }

    /**
     * Get all perspectives for this problem
     *
     * @param bool $reload Force reload from database
     * @return array Array of perspective objects
     */
    public function get_perspectives($reload = false) {
        global $DB;

        if ($this->perspectives === null || $reload) {
            $this->perspectives = array();
            $records = $DB->get_records('multiperspective_persp',
                array('problemid' => $this->id), 'sort_order ASC');

            foreach ($records as $record) {
                $this->perspectives[] = new perspective(0, $record);
            }
        }

        return $this->perspectives;
    }

    /**
     * Add a perspective to this problem
     *
     * @param perspective $perspective The perspective to add
     * @return int Perspective ID
     */
    public function add_perspective(perspective $perspective) {
        $perspective->set_problemid($this->id);
        return $perspective->save();
    }

    /**
     * Check if an answer is correct
     *
     * @param string $answer Student's answer
     * @return array ['is_correct' => bool, 'score' => float, 'feedback' => string]
     */
    public function check_answer($answer) {
        $result = array(
            'is_correct' => false,
            'score' => 0,
            'feedback' => ''
        );

        if (empty($this->correct_answer)) {
            // Manual grading required
            $result['feedback'] = get_string('manualgrading', 'mod_multiperspective');
            return $result;
        }

        switch ($this->problem_type) {
            case 'numeric':
                $result = $this->check_numeric_answer($answer);
                break;
            case 'multiple_choice':
                $result = $this->check_multiple_choice_answer($answer);
                break;
            case 'open':
                // Open-ended requires manual grading
                $result['feedback'] = get_string('manualgrading', 'mod_multiperspective');
                break;
            default:
                $result['feedback'] = get_string('unknowntype', 'mod_multiperspective');
        }

        return $result;
    }

    /**
     * Check numeric answer
     *
     * @param string $answer Student's answer
     * @return array Result array
     */
    protected function check_numeric_answer($answer) {
        $result = array('is_correct' => false, 'score' => 0, 'feedback' => '');

        $student_value = floatval($answer);
        $correct_value = floatval($this->correct_answer);

        // Allow small tolerance for floating point comparison
        $tolerance = 0.01;

        if (abs($student_value - $correct_value) <= $tolerance) {
            $result['is_correct'] = true;
            $result['score'] = 100;
            $result['feedback'] = get_string('correct', 'mod_multiperspective');
        } else {
            $result['feedback'] = get_string('incorrect', 'mod_multiperspective');
        }

        return $result;
    }

    /**
     * Check multiple choice answer
     *
     * @param string $answer Student's answer
     * @return array Result array
     */
    protected function check_multiple_choice_answer($answer) {
        $result = array('is_correct' => false, 'score' => 0, 'feedback' => '');

        if (trim($answer) === trim($this->correct_answer)) {
            $result['is_correct'] = true;
            $result['score'] = 100;
            $result['feedback'] = get_string('correct', 'mod_multiperspective');
        } else {
            $result['feedback'] = get_string('incorrect', 'mod_multiperspective');
        }

        return $result;
    }

    /**
     * Get problem statistics
     *
     * @return array Statistics array
     */
    public function get_statistics() {
        global $DB;

        $stats = array(
            'total_attempts' => 0,
            'unique_students' => 0,
            'average_score' => 0,
            'success_rate' => 0,
            'average_time' => 0
        );

        $sql = "SELECT COUNT(*) as total_attempts,
                       COUNT(DISTINCT userid) as unique_students,
                       AVG(score) as average_score,
                       AVG(time_spent) as average_time,
                       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
                FROM {multiperspective_attempts}
                WHERE problemid = ?";

        $record = $DB->get_record_sql($sql, array($this->id));

        if ($record && $record->total_attempts > 0) {
            $stats['total_attempts'] = $record->total_attempts;
            $stats['unique_students'] = $record->unique_students;
            $stats['average_score'] = round($record->average_score, 2);
            $stats['average_time'] = round($record->average_time);
            $stats['success_rate'] = round(($record->correct_attempts / $record->total_attempts) * 100, 2);
        }

        return $stats;
    }

    // Getters and setters
    public function get_id() { return $this->id; }
    public function get_multiperspectiveid() { return $this->multiperspectiveid; }
    public function get_title() { return $this->title; }
    public function get_description() { return $this->description; }
    public function get_problem_type() { return $this->problem_type; }
    public function get_correct_answer() { return $this->correct_answer; }
    public function get_difficulty_level() { return $this->difficulty_level; }
    public function get_sort_order() { return $this->sort_order; }

    public function set_multiperspectiveid($value) { $this->multiperspectiveid = $value; }
    public function set_title($value) { $this->title = $value; }
    public function set_description($value) { $this->description = $value; }
    public function set_problem_type($value) { $this->problem_type = $value; }
    public function set_correct_answer($value) { $this->correct_answer = $value; }
    public function set_difficulty_level($value) { $this->difficulty_level = $value; }
    public function set_sort_order($value) { $this->sort_order = $value; }

    /**
     * Get all problems for an activity
     *
     * @param int $multiperspectiveid Activity ID
     * @return array Array of problem objects
     */
    public static function get_problems_by_activity($multiperspectiveid) {
        global $DB;

        $problems = array();
        $records = $DB->get_records('multiperspective_problems',
            array('multiperspectiveid' => $multiperspectiveid), 'sort_order ASC');

        foreach ($records as $record) {
            $problems[] = new problem(0, $record);
        }

        return $problems;
    }
}
