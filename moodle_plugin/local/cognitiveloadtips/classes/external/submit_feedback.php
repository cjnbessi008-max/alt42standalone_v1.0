<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External API for submitting tip feedback
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_cognitiveloadtips\external;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

/**
 * External API for submitting feedback on tip helpfulness
 */
class submit_feedback extends external_api {

    /**
     * Returns description of method parameters
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'tipid' => new external_value(PARAM_INT, 'Tip ID'),
                'questionid' => new external_value(PARAM_INT, 'Question ID', VALUE_OPTIONAL, null),
                'helpful' => new external_value(PARAM_BOOL, 'Was tip helpful'),
            )
        );
    }

    /**
     * Submit feedback
     *
     * @param int $tipid Tip ID
     * @param int $questionid Question ID
     * @param bool $helpful Was helpful
     * @return array Result
     */
    public static function execute($tipid, $questionid = null, $helpful = false) {
        global $DB, $USER;

        $params = self::validate_parameters(self::execute_parameters(), array(
            'tipid' => $tipid,
            'questionid' => $questionid,
            'helpful' => $helpful,
        ));

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/cognitiveloadtips:viewtips', $context);

        // Update the most recent interaction for this user/tip/question
        $sql = "SELECT id
                  FROM {local_clt_user_interactions}
                 WHERE userid = :userid
                   AND tipid = :tipid";

        $sqlparams = array(
            'userid' => $USER->id,
            'tipid' => $params['tipid'],
        );

        if ($params['questionid']) {
            $sql .= " AND questionid = :questionid";
            $sqlparams['questionid'] = $params['questionid'];
        }

        $sql .= " ORDER BY timecreated DESC LIMIT 1";

        $interaction = $DB->get_record_sql($sql, $sqlparams);

        if ($interaction) {
            $interaction->was_helpful = $params['helpful'] ? 1 : 0;
            $success = $DB->update_record('local_clt_user_interactions', $interaction);

            return array(
                'success' => $success,
                'message' => get_string('feedback_thank_you', 'local_cognitiveloadtips'),
            );
        }

        return array(
            'success' => false,
            'message' => 'No interaction found',
        );
    }

    /**
     * Returns description of method result value
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }
}
