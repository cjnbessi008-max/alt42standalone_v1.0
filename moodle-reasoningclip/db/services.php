<?php
/**
 * Web service definitions for reasoning clip plugin
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_reasoningclip_save_events' => array(
        'classname'   => 'local_reasoningclip\external\save_events',
        'methodname'  => 'execute',
        'description' => 'Save student interaction events for reasoning detection',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
        'capabilities'=> 'local/reasoningclip:view',
    ),

    'local_reasoningclip_analyze_session' => array(
        'classname'   => 'local_reasoningclip\external\analyze_session',
        'methodname'  => 'execute',
        'description' => 'Analyze student session and detect reasoning moments',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
        'capabilities'=> 'local/reasoningclip:view',
    ),

    'local_reasoningclip_get_clips' => array(
        'classname'   => 'local_reasoningclip\external\get_clips',
        'methodname'  => 'execute',
        'description' => 'Get reasoning clips for a question or user',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
        'capabilities'=> 'local/reasoningclip:view',
    ),
);
