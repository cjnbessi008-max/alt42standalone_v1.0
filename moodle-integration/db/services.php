<?php
/**
 * Web service definitions for Thinking Routine Consistency
 *
 * @package    block_thinkroutine_consistency
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'block_thinkroutine_consistency_get_score' => [
        'classname' => 'block_thinkroutine_consistency\external\get_consistency_score',
        'methodname' => 'execute',
        'classpath' => '',
        'description' => 'Get consistency score for thinking routines',
        'type' => 'read',
        'ajax' => true,
        'capabilities' => '',
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE],
    ],
    'block_thinkroutine_consistency_track_activity' => [
        'classname' => 'block_thinkroutine_consistency\external\track_activity',
        'methodname' => 'execute',
        'classpath' => '',
        'description' => 'Track student activity for thinking routine analysis',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => '',
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE],
    ],
];
