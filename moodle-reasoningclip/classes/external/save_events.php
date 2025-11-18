<?php
/**
 * External API for saving student events
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
 * External API for saving student interaction events
 */
class save_events extends external_api {

    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'events' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'userid' => new external_value(PARAM_INT, 'User ID'),
                            'sessionid' => new external_value(PARAM_TEXT, 'Session ID'),
                            'questionid' => new external_value(PARAM_INT, 'Question ID'),
                            'eventtype' => new external_value(PARAM_TEXT, 'Event type'),
                            'eventdata' => new external_value(PARAM_RAW, 'Event data (JSON)'),
                            'timecreated' => new external_value(PARAM_INT, 'Time created (unix timestamp)'),
                        )
                    )
                )
            )
        );
    }

    /**
     * Save events
     *
     * @param array $events Array of events
     * @return array Result
     */
    public static function execute($events) {
        global $DB, $USER;

        // Parameter validation
        $params = self::validate_parameters(self::execute_parameters(), array('events' => $events));

        // Context validation
        $context = \context_system::instance();
        self::validate_context($context);

        $saved_count = 0;
        $errors = array();

        foreach ($params['events'] as $event) {
            try {
                // Verify user can save their own events
                if ($event['userid'] != $USER->id && !has_capability('local/reasoningclip:manage', $context)) {
                    throw new \moodle_exception('nopermission', 'local_reasoningclip');
                }

                $record = new \stdClass();
                $record->userid = $event['userid'];
                $record->sessionid = $event['sessionid'];
                $record->questionid = $event['questionid'];
                $record->eventtype = $event['eventtype'];
                $record->eventdata = $event['eventdata'];
                $record->timecreated = $event['timecreated'];

                $DB->insert_record('local_reasoningclip_events', $record);
                $saved_count++;

            } catch (\Exception $e) {
                $errors[] = array(
                    'event' => $event,
                    'error' => $e->getMessage()
                );
            }
        }

        return array(
            'success' => count($errors) === 0,
            'saved_count' => $saved_count,
            'errors' => $errors
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
                'saved_count' => new external_value(PARAM_INT, 'Number of events saved'),
                'errors' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'event' => new external_single_structure(
                                array(
                                    'userid' => new external_value(PARAM_INT, 'User ID'),
                                    'sessionid' => new external_value(PARAM_TEXT, 'Session ID'),
                                    'questionid' => new external_value(PARAM_INT, 'Question ID'),
                                    'eventtype' => new external_value(PARAM_TEXT, 'Event type'),
                                    'eventdata' => new external_value(PARAM_RAW, 'Event data'),
                                    'timecreated' => new external_value(PARAM_INT, 'Time created'),
                                )
                            ),
                            'error' => new external_value(PARAM_TEXT, 'Error message')
                        )
                    ),
                    'Errors that occurred',
                    VALUE_OPTIONAL
                )
            )
        );
    }
}
