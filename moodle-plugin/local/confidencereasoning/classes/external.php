<?php
// This file is part of Moodle - http://moodle.org/

namespace local_confidencereasoning;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

/**
 * External API for confidence reasoning plugin
 */
class external extends external_api {

    /**
     * Returns description of save_confidence_data parameters
     */
    public static function save_confidence_data_parameters() {
        return new external_function_parameters(
            array(
                'questionattemptid' => new external_value(PARAM_INT, 'Question attempt ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
                'questionid' => new external_value(PARAM_INT, 'Question ID'),
                'confidencelevel' => new external_value(PARAM_INT, 'Confidence level (1-5)'),
                'reasoning' => new external_value(PARAM_TEXT, 'Reasoning text', VALUE_DEFAULT, ''),
                'reasoningcategory' => new external_value(PARAM_TEXT, 'Reasoning category', VALUE_DEFAULT, ''),
            )
        );
    }

    /**
     * Save confidence data via AJAX
     *
     * @param int $questionattemptid
     * @param int $userid
     * @param int $quizid
     * @param int $questionid
     * @param int $confidencelevel
     * @param string $reasoning
     * @param string $reasoningcategory
     * @return array
     */
    public static function save_confidence_data($questionattemptid, $userid, $quizid, $questionid,
                                                 $confidencelevel, $reasoning = '', $reasoningcategory = '') {
        global $USER;

        $params = self::validate_parameters(
            self::save_confidence_data_parameters(),
            array(
                'questionattemptid' => $questionattemptid,
                'userid' => $userid,
                'quizid' => $quizid,
                'questionid' => $questionid,
                'confidencelevel' => $confidencelevel,
                'reasoning' => $reasoning,
                'reasoningcategory' => $reasoningcategory,
            )
        );

        // Security check - users can only save their own data
        if ($USER->id != $params['userid']) {
            throw new \moodle_exception('nopermission', 'local_confidencereasoning');
        }

        $recordid = local_confidencereasoning_save(
            $params['questionattemptid'],
            $params['userid'],
            $params['quizid'],
            $params['questionid'],
            $params['confidencelevel'],
            $params['reasoning'],
            $params['reasoningcategory']
        );

        return array(
            'success' => ($recordid !== false),
            'recordid' => $recordid,
            'message' => ($recordid !== false) ? 'Data saved successfully' : 'Error saving data',
        );
    }

    /**
     * Returns description of save_confidence_data return values
     */
    public static function save_confidence_data_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'recordid' => new external_value(PARAM_INT, 'Record ID'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }
}
