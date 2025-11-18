<?php
/**
 * External API implementation for Fluid Geometry plugin
 *
 * @package    local_fluidgeometry
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * External functions for Fluid Geometry
 */
class local_fluidgeometry_external extends external_api {

    /**
     * Returns description of method parameters for get_problem
     */
    public static function get_problem_parameters() {
        return new external_function_parameters(
            array(
                'problemid' => new external_value(PARAM_INT, 'Problem ID')
            )
        );
    }

    /**
     * Get a specific problem
     */
    public static function get_problem($problemid) {
        global $DB;

        $params = self::validate_parameters(self::get_problem_parameters(), array('problemid' => $problemid));

        $problem = $DB->get_record('fluidgeometry_problems', array('id' => $params['problemid']), '*', MUST_EXIST);

        return array(
            'id' => $problem->id,
            'name' => $problem->name,
            'intro' => $problem->intro,
            'shapetype' => $problem->shapetype,
            'difficulty' => $problem->difficulty,
            'timemodified' => $problem->timemodified,
        );
    }

    /**
     * Returns description of method result value for get_problem
     */
    public static function get_problem_returns() {
        return new external_single_structure(
            array(
                'id' => new external_value(PARAM_INT, 'Problem ID'),
                'name' => new external_value(PARAM_TEXT, 'Problem name'),
                'intro' => new external_value(PARAM_RAW, 'Problem introduction'),
                'shapetype' => new external_value(PARAM_TEXT, 'Shape type'),
                'difficulty' => new external_value(PARAM_INT, 'Difficulty level'),
                'timemodified' => new external_value(PARAM_INT, 'Time modified'),
            )
        );
    }

    /**
     * Returns description of method parameters for get_problems
     */
    public static function get_problems_parameters() {
        return new external_function_parameters(array());
    }

    /**
     * Get all available problems
     */
    public static function get_problems() {
        global $DB;

        $problems = $DB->get_records('fluidgeometry_problems');
        $result = array();

        foreach ($problems as $problem) {
            $result[] = array(
                'id' => $problem->id,
                'name' => $problem->name,
                'intro' => $problem->intro,
                'shapetype' => $problem->shapetype,
                'difficulty' => $problem->difficulty,
                'timemodified' => $problem->timemodified,
            );
        }

        return array('problems' => $result);
    }

    /**
     * Returns description of method result value for get_problems
     */
    public static function get_problems_returns() {
        return new external_single_structure(
            array(
                'problems' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Problem ID'),
                            'name' => new external_value(PARAM_TEXT, 'Problem name'),
                            'intro' => new external_value(PARAM_RAW, 'Problem introduction'),
                            'shapetype' => new external_value(PARAM_TEXT, 'Shape type'),
                            'difficulty' => new external_value(PARAM_INT, 'Difficulty level'),
                            'timemodified' => new external_value(PARAM_INT, 'Time modified'),
                        )
                    )
                )
            )
        );
    }

    /**
     * Returns description of method parameters for submit_attempt
     */
    public static function submit_attempt_parameters() {
        return new external_function_parameters(
            array(
                'problemid' => new external_value(PARAM_INT, 'Problem ID'),
                'starttime' => new external_value(PARAM_INT, 'Start time'),
                'endtime' => new external_value(PARAM_INT, 'End time'),
                'area' => new external_value(PARAM_FLOAT, 'Calculated area'),
                'perimeter' => new external_value(PARAM_FLOAT, 'Calculated perimeter'),
                'vertices' => new external_value(PARAM_INT, 'Number of vertices'),
            )
        );
    }

    /**
     * Submit a student attempt
     */
    public static function submit_attempt($problemid, $starttime, $endtime, $area, $perimeter, $vertices) {
        global $DB, $USER;

        $params = self::validate_parameters(
            self::submit_attempt_parameters(),
            array(
                'problemid' => $problemid,
                'starttime' => $starttime,
                'endtime' => $endtime,
                'area' => $area,
                'perimeter' => $perimeter,
                'vertices' => $vertices,
            )
        );

        // Calculate score based on accuracy (simplified scoring)
        $score = 100; // Base score

        $attempt = new stdClass();
        $attempt->problemid = $params['problemid'];
        $attempt->userid = $USER->id;
        $attempt->starttime = $params['starttime'];
        $attempt->endtime = $params['endtime'];
        $attempt->area = $params['area'];
        $attempt->perimeter = $params['perimeter'];
        $attempt->vertices = $params['vertices'];
        $attempt->score = $score;

        $attemptid = $DB->insert_record('fluidgeometry_attempts', $attempt);

        return array(
            'success' => true,
            'attemptid' => $attemptid,
            'score' => $score,
        );
    }

    /**
     * Returns description of method result value for submit_attempt
     */
    public static function submit_attempt_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Submission success'),
                'attemptid' => new external_value(PARAM_INT, 'Attempt ID'),
                'score' => new external_value(PARAM_FLOAT, 'Calculated score'),
            )
        );
    }

    /**
     * Returns description of method parameters for get_attempts
     */
    public static function get_attempts_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'problemid' => new external_value(PARAM_INT, 'Problem ID (optional)', VALUE_DEFAULT, 0),
            )
        );
    }

    /**
     * Get student attempt history
     */
    public static function get_attempts($userid, $problemid = 0) {
        global $DB;

        $params = self::validate_parameters(
            self::get_attempts_parameters(),
            array('userid' => $userid, 'problemid' => $problemid)
        );

        $conditions = array('userid' => $params['userid']);
        if ($params['problemid'] > 0) {
            $conditions['problemid'] = $params['problemid'];
        }

        $attempts = $DB->get_records('fluidgeometry_attempts', $conditions, 'endtime DESC');
        $result = array();

        foreach ($attempts as $attempt) {
            $result[] = array(
                'id' => $attempt->id,
                'problemid' => $attempt->problemid,
                'starttime' => $attempt->starttime,
                'endtime' => $attempt->endtime,
                'area' => $attempt->area,
                'perimeter' => $attempt->perimeter,
                'vertices' => $attempt->vertices,
                'score' => $attempt->score,
            );
        }

        return array('attempts' => $result);
    }

    /**
     * Returns description of method result value for get_attempts
     */
    public static function get_attempts_returns() {
        return new external_single_structure(
            array(
                'attempts' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Attempt ID'),
                            'problemid' => new external_value(PARAM_INT, 'Problem ID'),
                            'starttime' => new external_value(PARAM_INT, 'Start time'),
                            'endtime' => new external_value(PARAM_INT, 'End time'),
                            'area' => new external_value(PARAM_FLOAT, 'Area'),
                            'perimeter' => new external_value(PARAM_FLOAT, 'Perimeter'),
                            'vertices' => new external_value(PARAM_INT, 'Vertices'),
                            'score' => new external_value(PARAM_FLOAT, 'Score'),
                        )
                    )
                )
            )
        );
    }
}
