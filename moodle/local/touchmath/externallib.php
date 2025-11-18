<?php
/**
 * Touch Math external library
 *
 * @package    local_touchmath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * Touch Math external functions
 */
class local_touchmath_external extends external_api {

    /**
     * Returns description of get_problem parameters
     * @return external_function_parameters
     */
    public static function get_problem_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
                'studentid' => new external_value(PARAM_INT, 'Student ID'),
                'problemid' => new external_value(PARAM_INT, 'Problem ID (optional)', VALUE_DEFAULT, 0),
            )
        );
    }

    /**
     * Get problem data
     * @param int $courseid
     * @param int $activityid
     * @param int $studentid
     * @param int $problemid
     * @return array
     */
    public static function get_problem($courseid, $activityid, $studentid, $problemid = 0) {
        global $DB;

        // Validate parameters
        $params = self::validate_parameters(self::get_problem_parameters(), array(
            'courseid' => $courseid,
            'activityid' => $activityid,
            'studentid' => $studentid,
            'problemid' => $problemid,
        ));

        // Validate context
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);

        // Check capability
        require_capability('local/touchmath:view', $context);

        // Get problem from database
        if ($params['problemid'] > 0) {
            $problem = $DB->get_record('touchmath_problems', array('id' => $params['problemid']), '*', MUST_EXIST);
        } else {
            // Get a random problem for this activity
            $problems = $DB->get_records('touchmath_problems', array('activityid' => $params['activityid']));
            if (empty($problems)) {
                // Return default problem
                return self::get_default_problem();
            }
            $problem = reset($problems);
        }

        // Parse function data
        $functiondata = json_decode($problem->functiondata, true);

        return array(
            'id' => $problem->id,
            'title' => $problem->title,
            'description' => $problem->description,
            'function' => array(
                'type' => $problem->functiontype,
                'coefficients' => $functiondata['coefficients'],
                'display' => $functiondata['display'],
            ),
            'targetPoint' => isset($functiondata['targetPoint']) ? $functiondata['targetPoint'] : array('x' => 0, 'y' => 0),
            'tolerance' => isset($functiondata['tolerance']) ? $functiondata['tolerance'] : 0.5,
            'hints' => isset($functiondata['hints']) ? $functiondata['hints'] : array(),
        );
    }

    /**
     * Get default problem (fallback)
     * @return array
     */
    private static function get_default_problem() {
        return array(
            'id' => 0,
            'title' => '이차함수의 접선',
            'description' => '주어진 곡선 위의 점에서 접선을 그려보세요',
            'function' => array(
                'type' => 'polynomial',
                'coefficients' => array(
                    'a' => 0.5,
                    'b' => 0,
                    'c' => -2,
                ),
                'display' => 'f(x) = 0.5x² - 2',
            ),
            'targetPoint' => array('x' => 2, 'y' => 0),
            'tolerance' => 0.5,
            'hints' => array(
                '접선은 곡선과 한 점에서만 만납니다',
                '접선의 기울기는 그 점에서의 미분값과 같습니다',
            ),
        );
    }

    /**
     * Returns description of get_problem return value
     * @return external_single_structure
     */
    public static function get_problem_returns() {
        return new external_single_structure(
            array(
                'id' => new external_value(PARAM_INT, 'Problem ID'),
                'title' => new external_value(PARAM_TEXT, 'Problem title'),
                'description' => new external_value(PARAM_TEXT, 'Problem description'),
                'function' => new external_single_structure(
                    array(
                        'type' => new external_value(PARAM_TEXT, 'Function type'),
                        'coefficients' => new external_value(PARAM_RAW, 'Function coefficients (JSON)'),
                        'display' => new external_value(PARAM_TEXT, 'Display equation'),
                    )
                ),
                'targetPoint' => new external_value(PARAM_RAW, 'Target point (JSON)'),
                'tolerance' => new external_value(PARAM_FLOAT, 'Tolerance for correctness'),
                'hints' => new external_value(PARAM_RAW, 'Hints array (JSON)'),
            )
        );
    }

    /**
     * Returns description of submit_answer parameters
     * @return external_function_parameters
     */
    public static function submit_answer_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
                'studentid' => new external_value(PARAM_INT, 'Student ID'),
                'problemid' => new external_value(PARAM_INT, 'Problem ID'),
                'answer' => new external_value(PARAM_RAW, 'Answer data (JSON)'),
                'timestamp' => new external_value(PARAM_TEXT, 'Timestamp'),
            )
        );
    }

    /**
     * Submit student answer
     * @param int $courseid
     * @param int $activityid
     * @param int $studentid
     * @param int $problemid
     * @param string $answer
     * @param string $timestamp
     * @return array
     */
    public static function submit_answer($courseid, $activityid, $studentid, $problemid, $answer, $timestamp) {
        global $DB;

        // Validate parameters
        $params = self::validate_parameters(self::submit_answer_parameters(), array(
            'courseid' => $courseid,
            'activityid' => $activityid,
            'studentid' => $studentid,
            'problemid' => $problemid,
            'answer' => $answer,
            'timestamp' => $timestamp,
        ));

        // Validate context
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);

        // Check capability
        require_capability('local/touchmath:submit', $context);

        // Parse answer
        $answerdata = json_decode($params['answer'], true);

        // Validate answer (simple validation for demo)
        $iscorrect = self::validate_answer($params['problemid'], $answerdata);

        // Calculate score
        $score = $iscorrect ? 100 : 0;

        // Save to database
        $submission = new stdClass();
        $submission->problemid = $params['problemid'];
        $submission->studentid = $params['studentid'];
        $submission->answer = $params['answer'];
        $submission->score = $score;
        $submission->timecreated = time();

        $DB->insert_record('touchmath_submissions', $submission);

        // Generate feedback
        $feedback = $iscorrect
            ? '정확합니다! 접선을 올바르게 그렸습니다.'
            : '조금 더 정확하게 그려보세요. 힌트를 확인해보세요.';

        return array(
            'success' => true,
            'correct' => $iscorrect,
            'score' => $score,
            'feedback' => $feedback,
            'solution' => array(
                'point' => array('x' => 2, 'y' => 0),
                'slope' => 2,
                'equation' => 'y = 2x - 4',
            ),
        );
    }

    /**
     * Validate answer correctness
     * @param int $problemid
     * @param array $answerdata
     * @return bool
     */
    private static function validate_answer($problemid, $answerdata) {
        global $DB;

        // Get problem
        $problem = $DB->get_record('touchmath_problems', array('id' => $problemid));
        if (!$problem) {
            return false;
        }

        $functiondata = json_decode($problem->functiondata, true);
        $targetpoint = $functiondata['targetPoint'];
        $tolerance = isset($functiondata['tolerance']) ? $functiondata['tolerance'] : 0.5;

        // Check if point is close to target
        $pointdist = sqrt(
            pow($answerdata['point']['x'] - $targetpoint['x'], 2) +
            pow($answerdata['point']['y'] - $targetpoint['y'], 2)
        );

        return $pointdist <= $tolerance;
    }

    /**
     * Returns description of submit_answer return value
     * @return external_single_structure
     */
    public static function submit_answer_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success flag'),
                'correct' => new external_value(PARAM_BOOL, 'Whether answer is correct'),
                'score' => new external_value(PARAM_FLOAT, 'Score'),
                'feedback' => new external_value(PARAM_TEXT, 'Feedback message'),
                'solution' => new external_value(PARAM_RAW, 'Solution data (JSON)'),
            )
        );
    }

    /**
     * Returns description of save_progress parameters
     * @return external_function_parameters
     */
    public static function save_progress_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
                'studentid' => new external_value(PARAM_INT, 'Student ID'),
                'progress' => new external_value(PARAM_RAW, 'Progress data (JSON)'),
                'timestamp' => new external_value(PARAM_TEXT, 'Timestamp'),
            )
        );
    }

    /**
     * Save student progress
     */
    public static function save_progress($courseid, $activityid, $studentid, $progress, $timestamp) {
        global $DB;

        $params = self::validate_parameters(self::save_progress_parameters(), array(
            'courseid' => $courseid,
            'activityid' => $activityid,
            'studentid' => $studentid,
            'progress' => $progress,
            'timestamp' => $timestamp,
        ));

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);

        // Save progress logic here

        return array('success' => true);
    }

    /**
     * Returns description of save_progress return value
     */
    public static function save_progress_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success flag'),
            )
        );
    }

    /**
     * Returns description of log_event parameters
     */
    public static function log_event_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
                'studentid' => new external_value(PARAM_INT, 'Student ID'),
                'eventtype' => new external_value(PARAM_TEXT, 'Event type'),
                'eventdata' => new external_value(PARAM_RAW, 'Event data (JSON)'),
                'timestamp' => new external_value(PARAM_TEXT, 'Timestamp'),
            )
        );
    }

    /**
     * Log interaction event
     */
    public static function log_event($courseid, $activityid, $studentid, $eventtype, $eventdata, $timestamp) {
        global $DB;

        $params = self::validate_parameters(self::log_event_parameters(), array(
            'courseid' => $courseid,
            'activityid' => $activityid,
            'studentid' => $studentid,
            'eventtype' => $eventtype,
            'eventdata' => $eventdata,
            'timestamp' => $timestamp,
        ));

        $context = context_course::instance($params['courseid']);
        self::validate_context($context);

        // Log event
        $event = new stdClass();
        $event->studentid = $params['studentid'];
        $event->eventtype = $params['eventtype'];
        $event->eventdata = $params['eventdata'];
        $event->timecreated = time();

        $DB->insert_record('touchmath_events', $event);

        return array('success' => true);
    }

    /**
     * Returns description of log_event return value
     */
    public static function log_event_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success flag'),
            )
        );
    }
}
