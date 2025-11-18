<?php
/**
 * External API for analyzing student session and detecting reasoning moments
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
use local_reasoningclip\reasoning_detector;

/**
 * External API for analyzing student sessions
 */
class analyze_session extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'sessionid' => new external_value(PARAM_TEXT, 'Session ID'),
                'questionid' => new external_value(PARAM_INT, 'Question ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
            )
        );
    }

    /**
     * Analyze session and detect reasoning moments
     *
     * @param string $sessionid Session ID
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @return array Result with detected clips
     */
    public static function execute($sessionid, $questionid, $userid, $courseid, $cmid) {
        global $DB, $USER;

        // Parameter validation
        $params = self::validate_parameters(
            self::execute_parameters(),
            array(
                'sessionid' => $sessionid,
                'questionid' => $questionid,
                'userid' => $userid,
                'courseid' => $courseid,
                'cmid' => $cmid
            )
        );

        // Context validation
        $context = \context_system::instance();
        self::validate_context($context);

        // Permission check
        if ($params['userid'] != $USER->id && !has_capability('local/reasoningclip:viewall', $context)) {
            throw new \moodle_exception('nopermission', 'local_reasoningclip');
        }

        // Get events for this session
        $events = $DB->get_records(
            'local_reasoningclip_events',
            array(
                'sessionid' => $params['sessionid'],
                'questionid' => $params['questionid']
            ),
            'timecreated ASC'
        );

        // Convert to array format
        $events_array = array();
        foreach ($events as $event) {
            $events_array[] = array(
                'eventtype' => $event->eventtype,
                'eventdata' => $event->eventdata,
                'timecreated' => $event->timecreated
            );
        }

        // Detect reasoning moments
        $clips = reasoning_detector::detect_reasoning_moments(
            $events_array,
            $params['questionid'],
            $params['userid']
        );

        // Get detection threshold from config
        $config = $DB->get_record('local_reasoningclip_config', array('cmid' => $params['cmid']));
        $threshold = $config ? $config->detection_threshold : 0.70;

        // Filter clips by confidence threshold and save
        $saved_clips = array();
        foreach ($clips as $clip) {
            if ($clip['confidence'] >= $threshold) {
                $clipid = reasoning_detector::save_clip(
                    $clip,
                    $params['courseid'],
                    $params['cmid']
                );

                $saved_clips[] = array(
                    'id' => $clipid,
                    'cliptype' => $clip['cliptype'],
                    'confidence' => $clip['confidence'],
                    'timespent' => $clip['timespent']
                );
            }
        }

        return array(
            'success' => true,
            'clips' => $saved_clips,
            'total_events' => count($events_array),
            'clips_detected' => count($clips),
            'clips_saved' => count($saved_clips)
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
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'clips' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Clip ID'),
                            'cliptype' => new external_value(PARAM_TEXT, 'Clip type'),
                            'confidence' => new external_value(PARAM_FLOAT, 'Confidence score'),
                            'timespent' => new external_value(PARAM_INT, 'Time spent in seconds')
                        )
                    ),
                    'Detected and saved clips'
                ),
                'total_events' => new external_value(PARAM_INT, 'Total events analyzed'),
                'clips_detected' => new external_value(PARAM_INT, 'Total clips detected'),
                'clips_saved' => new external_value(PARAM_INT, 'Clips saved (above threshold)')
            )
        );
    }
}
