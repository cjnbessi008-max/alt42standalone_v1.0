<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External API for getting cognitive load tips
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
use external_multiple_structure;
use external_single_structure;

/**
 * External API for retrieving tips
 */
class get_tips extends external_api {

    /**
     * Returns description of method parameters
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters(
            array(
                'difficulty' => new external_value(PARAM_INT, 'Difficulty level (1-5)'),
                'language' => new external_value(PARAM_TEXT, 'Language code', VALUE_DEFAULT, 'en'),
                'random' => new external_value(PARAM_BOOL, 'Get random tip', VALUE_DEFAULT, true),
            )
        );
    }

    /**
     * Get tips
     *
     * @param int $difficulty Difficulty level
     * @param string $language Language code
     * @param bool $random Get random tip
     * @return array Tips
     */
    public static function execute($difficulty, $language = 'en', $random = true) {
        $params = self::validate_parameters(self::execute_parameters(), array(
            'difficulty' => $difficulty,
            'language' => $language,
            'random' => $random,
        ));

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/cognitiveloadtips:viewtips', $context);

        $tips = \local_cognitiveloadtips\tip_manager::get_tips_for_difficulty(
            $params['difficulty'],
            $params['language'],
            $params['random']
        );

        $result = array();
        foreach ($tips as $tip) {
            $result[] = array(
                'id' => $tip->id,
                'title' => $tip->title,
                'content' => $tip->content,
                'category' => $tip->category,
                'difficulty_min' => $tip->difficulty_min,
                'difficulty_max' => $tip->difficulty_max,
                'display_duration' => $tip->display_duration,
                'is_mandatory' => $tip->is_mandatory,
                'language' => $tip->language,
            );
        }

        return $result;
    }

    /**
     * Returns description of method result value
     * @return external_multiple_structure
     */
    public static function execute_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'Tip ID'),
                    'title' => new external_value(PARAM_TEXT, 'Tip title'),
                    'content' => new external_value(PARAM_RAW, 'Tip content'),
                    'category' => new external_value(PARAM_TEXT, 'Tip category'),
                    'difficulty_min' => new external_value(PARAM_INT, 'Minimum difficulty'),
                    'difficulty_max' => new external_value(PARAM_INT, 'Maximum difficulty'),
                    'display_duration' => new external_value(PARAM_INT, 'Display duration'),
                    'is_mandatory' => new external_value(PARAM_BOOL, 'Is mandatory'),
                    'language' => new external_value(PARAM_TEXT, 'Language code'),
                )
            )
        );
    }
}
