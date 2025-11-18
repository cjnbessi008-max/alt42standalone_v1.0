<?php
/**
 * External API for retrieving reasoning clips
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_reasoningclip\external;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;

/**
 * External API for getting reasoning clips
 */
class get_clips extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID', VALUE_OPTIONAL, 0),
                'questionid' => new external_value(PARAM_INT, 'Question ID', VALUE_OPTIONAL, 0),
                'userid' => new external_value(PARAM_INT, 'User ID', VALUE_OPTIONAL, 0),
                'cliptype' => new external_value(PARAM_TEXT, 'Clip type filter', VALUE_OPTIONAL, ''),
                'limit' => new external_value(PARAM_INT, 'Limit results', VALUE_DEFAULT, 50),
            )
        );
    }

    /**
     * Get reasoning clips
     *
     * @param int $cmid Course module ID
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @param string $cliptype Clip type filter
     * @param int $limit Limit
     * @return array Clips
     */
    public static function execute($cmid = 0, $questionid = 0, $userid = 0, $cliptype = '', $limit = 50) {
        global $DB, $USER;

        // Parameter validation
        $params = self::validate_parameters(
            self::execute_parameters(),
            array(
                'cmid' => $cmid,
                'questionid' => $questionid,
                'userid' => $userid,
                'cliptype' => $cliptype,
                'limit' => $limit
            )
        );

        // Context validation
        $context = \context_system::instance();
        self::validate_context($context);

        // Build query conditions
        $conditions = array();
        $query_params = array();

        if ($params['cmid']) {
            $conditions[] = 'cmid = :cmid';
            $query_params['cmid'] = $params['cmid'];
        }

        if ($params['questionid']) {
            $conditions[] = 'questionid = :questionid';
            $query_params['questionid'] = $params['questionid'];
        }

        if ($params['userid']) {
            // Permission check - can only view own clips unless has viewall capability
            if ($params['userid'] != $USER->id && !has_capability('local/reasoningclip:viewall', $context)) {
                throw new \moodle_exception('nopermission', 'local_reasoningclip');
            }
            $conditions[] = 'userid = :userid';
            $query_params['userid'] = $params['userid'];
        } else {
            // If no userid specified, only show current user's clips unless has viewall capability
            if (!has_capability('local/reasoningclip:viewall', $context)) {
                $conditions[] = 'userid = :userid';
                $query_params['userid'] = $USER->id;
            }
        }

        if ($params['cliptype']) {
            $conditions[] = 'cliptype = :cliptype';
            $query_params['cliptype'] = $params['cliptype'];
        }

        $where = count($conditions) > 0 ? implode(' AND ', $conditions) : '1=1';

        // Get clips
        $sql = "SELECT * FROM {local_reasoningclip} WHERE $where ORDER BY timecreated DESC";
        $clips = $DB->get_records_sql($sql, $query_params, 0, $params['limit']);

        // Format results
        $result = array();
        foreach ($clips as $clip) {
            $result[] = array(
                'id' => $clip->id,
                'userid' => $clip->userid,
                'courseid' => $clip->courseid,
                'cmid' => $clip->cmid,
                'questionid' => $clip->questionid,
                'cliptype' => $clip->cliptype,
                'clipdata' => $clip->clipdata,
                'timespent' => $clip->timespent,
                'confidence' => $clip->confidence,
                'timecreated' => $clip->timecreated
            );
        }

        return array(
            'clips' => $result,
            'total' => count($result)
        );
    }

    /**
     * Returns description of method result value
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure(
            array(
                'clips' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Clip ID'),
                            'userid' => new external_value(PARAM_INT, 'User ID'),
                            'courseid' => new external_value(PARAM_INT, 'Course ID'),
                            'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                            'questionid' => new external_value(PARAM_INT, 'Question ID'),
                            'cliptype' => new external_value(PARAM_TEXT, 'Clip type'),
                            'clipdata' => new external_value(PARAM_RAW, 'Clip data (JSON)'),
                            'timespent' => new external_value(PARAM_INT, 'Time spent in seconds'),
                            'confidence' => new external_value(PARAM_FLOAT, 'Confidence score'),
                            'timecreated' => new external_value(PARAM_INT, 'Time created')
                        )
                    )
                ),
                'total' => new external_value(PARAM_INT, 'Total clips returned')
            )
        );
    }
}
