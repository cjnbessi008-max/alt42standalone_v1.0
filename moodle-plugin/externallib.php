<?php
/**
 * External API for Unit Compass module
 *
 * @package    mod_unitcompass
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * Unit Compass external functions
 */
class mod_unitcompass_external extends external_api {

    /**
     * Returns description of get_problem parameters
     * @return external_function_parameters
     */
    public static function get_problem_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'activityid' => new external_value(PARAM_INT, 'Activity ID'),
                'problemid' => new external_value(PARAM_TEXT, 'Problem ID (optional)', VALUE_DEFAULT, ''),
            )
        );
    }

    /**
     * Get problem for student
     * @param int $courseid
     * @param int $activityid
     * @param string $problemid
     * @return array
     */
    public static function get_problem($courseid, $activityid, $problemid = '') {
        global $DB;

        $params = self::validate_parameters(self::get_problem_parameters(), array(
            'courseid' => $courseid,
            'activityid' => $activityid,
            'problemid' => $problemid,
        ));

        // Validate context
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('mod/unitcompass:view', $context);

        // Get problem
        if (!empty($params['problemid'])) {
            $problem = $DB->get_record('unitcompass_problems', array('id' => $params['problemid']), '*', MUST_EXIST);
        } else {
            // Get random problem for this activity
            $sql = "SELECT * FROM {unitcompass_problems} WHERE activityid = ? ORDER BY RAND() LIMIT 1";
            $problem = $DB->get_record_sql($sql, array($params['activityid']));

            if (!$problem) {
                throw new moodle_exception('noproblems', 'mod_unitcompass');
            }
        }

        // Format response
        return array(
            'id' => $problem->id,
            'title' => $problem->title,
            'description' => $problem->description,
            'type' => $problem->type,
            'targetangle' => (float)$problem->targetangle,
            'targetvector' => array(
                'x' => (float)$problem->targetx,
                'y' => (float)$problem->targety,
                'magnitude' => sqrt($problem->targetx * $problem->targetx + $problem->targety * $problem->targety),
                'angle' => atan2($problem->targety, $problem->targetx),
            ),
            'difficulty' => $problem->difficulty,
            'hints' => $problem->hints,
            'maxattempts' => (int)$problem->maxattempts,
        );
    }

    /**
     * Returns description of get_problem return value
     * @return external_single_structure
     */
    public static function get_problem_returns() {
        return new external_single_structure(
            array(
                'id' => new external_value(PARAM_TEXT, 'Problem ID'),
                'title' => new external_value(PARAM_TEXT, 'Problem title'),
                'description' => new external_value(PARAM_RAW, 'Problem description'),
                'type' => new external_value(PARAM_TEXT, 'Problem type'),
                'targetangle' => new external_value(PARAM_FLOAT, 'Target angle'),
                'targetvector' => new external_single_structure(
                    array(
                        'x' => new external_value(PARAM_FLOAT, 'X coordinate'),
                        'y' => new external_value(PARAM_FLOAT, 'Y coordinate'),
                        'magnitude' => new external_value(PARAM_FLOAT, 'Magnitude'),
                        'angle' => new external_value(PARAM_FLOAT, 'Angle'),
                    )
                ),
                'difficulty' => new external_value(PARAM_TEXT, 'Difficulty level'),
                'hints' => new external_value(PARAM_RAW, 'Hints (JSON)'),
                'maxattempts' => new external_value(PARAM_INT, 'Maximum attempts'),
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
                'problemid' => new external_value(PARAM_TEXT, 'Problem ID'),
                'userid' => new external_value(PARAM_TEXT, 'User ID'),
                'answerx' => new external_value(PARAM_FLOAT, 'Answer X coordinate'),
                'answery' => new external_value(PARAM_FLOAT, 'Answer Y coordinate'),
                'attempt' => new external_value(PARAM_INT, 'Attempt number'),
            )
        );
    }

    /**
     * Submit student answer
     * @param string $problemid
     * @param string $userid
     * @param float $answerx
     * @param float $answery
     * @param int $attempt
     * @return array
     */
    public static function submit_answer($problemid, $userid, $answerx, $answery, $attempt) {
        global $DB;

        $params = self::validate_parameters(self::submit_answer_parameters(), array(
            'problemid' => $problemid,
            'userid' => $userid,
            'answerx' => $answerx,
            'answery' => $answery,
            'attempt' => $attempt,
        ));

        // Get problem
        $problem = $DB->get_record('unitcompass_problems', array('id' => $params['problemid']), '*', MUST_EXIST);

        // Check answer
        $tolerance = 0.1; // Tolerance for angle comparison (radians)
        $answerAngle = atan2($params['answery'], $params['answerx']);
        $targetAngle = (float)$problem->targetangle;

        $angleDiff = abs($answerAngle - $targetAngle);
        if ($angleDiff > M_PI) {
            $angleDiff = 2 * M_PI - $angleDiff;
        }

        $iscorrect = $angleDiff < $tolerance;

        // Save attempt
        $attempt_record = new stdClass();
        $attempt_record->userid = $params['userid'];
        $attempt_record->problemid = $params['problemid'];
        $attempt_record->answerx = $params['answerx'];
        $attempt_record->answery = $params['answery'];
        $attempt_record->iscorrect = $iscorrect ? 1 : 0;
        $attempt_record->attemptnum = $params['attempt'];
        $attempt_record->timecreated = time();

        $DB->insert_record('unitcompass_attempts', $attempt_record);

        // Generate feedback
        $feedback = $iscorrect ? '정답입니다! 🎉' : '아쉽네요. 다시 시도해보세요.';
        if (!$iscorrect && $angleDiff < 0.2) {
            $feedback .= ' 거의 다 왔어요!';
        }

        return array(
            'iscorrect' => $iscorrect,
            'feedback' => $feedback,
        );
    }

    /**
     * Returns description of submit_answer return value
     * @return external_single_structure
     */
    public static function submit_answer_returns() {
        return new external_single_structure(
            array(
                'iscorrect' => new external_value(PARAM_BOOL, 'Is answer correct'),
                'feedback' => new external_value(PARAM_TEXT, 'Feedback message'),
            )
        );
    }

    /**
     * Returns description of get_progress parameters
     * @return external_function_parameters
     */
    public static function get_progress_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_TEXT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
            )
        );
    }

    /**
     * Get student progress
     * @param string $userid
     * @param int $courseid
     * @return array
     */
    public static function get_progress($userid, $courseid) {
        global $DB;

        $params = self::validate_parameters(self::get_progress_parameters(), array(
            'userid' => $userid,
            'courseid' => $courseid,
        ));

        // Get all problems for this course
        $sql = "SELECT COUNT(DISTINCT p.id) as totalproblems
                FROM {unitcompass_problems} p
                JOIN {unitcompass} u ON p.activityid = u.id
                WHERE u.course = ?";
        $total = $DB->get_record_sql($sql, array($params['courseid']));

        // Get solved problems
        $sql = "SELECT COUNT(DISTINCT a.problemid) as solved
                FROM {unitcompass_attempts} a
                JOIN {unitcompass_problems} p ON a.problemid = p.id
                JOIN {unitcompass} u ON p.activityid = u.id
                WHERE a.userid = ? AND u.course = ? AND a.iscorrect = 1";
        $solved = $DB->get_record_sql($sql, array($params['userid'], $params['courseid']));

        // Calculate accuracy
        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(iscorrect) as correct_attempts
                FROM {unitcompass_attempts} a
                JOIN {unitcompass_problems} p ON a.problemid = p.id
                JOIN {unitcompass} u ON p.activityid = u.id
                WHERE a.userid = ? AND u.course = ?";
        $accuracy_data = $DB->get_record_sql($sql, array($params['userid'], $params['courseid']));

        $accuracy = 0;
        if ($accuracy_data->total_attempts > 0) {
            $accuracy = $accuracy_data->correct_attempts / $accuracy_data->total_attempts;
        }

        // Get last activity
        $sql = "SELECT MAX(timecreated) as lastactivity
                FROM {unitcompass_attempts}
                WHERE userid = ?";
        $lastactivity = $DB->get_record_sql($sql, array($params['userid']));

        return array(
            'userid' => $params['userid'],
            'problemssolved' => (int)$solved->solved,
            'totalproblems' => (int)$total->totalproblems,
            'accuracy' => (float)$accuracy,
            'lastactivity' => (int)($lastactivity->lastactivity ?: time()),
        );
    }

    /**
     * Returns description of get_progress return value
     * @return external_single_structure
     */
    public static function get_progress_returns() {
        return new external_single_structure(
            array(
                'userid' => new external_value(PARAM_TEXT, 'User ID'),
                'problemssolved' => new external_value(PARAM_INT, 'Problems solved'),
                'totalproblems' => new external_value(PARAM_INT, 'Total problems'),
                'accuracy' => new external_value(PARAM_FLOAT, 'Accuracy rate'),
                'lastactivity' => new external_value(PARAM_INT, 'Last activity timestamp'),
            )
        );
    }
}
