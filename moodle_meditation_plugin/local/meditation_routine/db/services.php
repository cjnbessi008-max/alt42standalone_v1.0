<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_meditation_routine_check_should_show' => [
        'classname'   => 'local_meditation_routine\external\check_should_show',
        'methodname'  => 'execute',
        'description' => 'Check if meditation routine should be shown',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => [MOODLE_OFFICIAL_MOBILE_SERVICE],
    ],
    'local_meditation_routine_log_session' => [
        'classname'   => 'local_meditation_routine\external\log_session',
        'methodname'  => 'execute',
        'description' => 'Log meditation session completion',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => [MOODLE_OFFICIAL_MOBILE_SERVICE],
    ],
    'local_meditation_routine_get_settings' => [
        'classname'   => 'local_meditation_routine\external\get_settings',
        'methodname'  => 'execute',
        'description' => 'Get meditation settings for a quiz',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_meditation_routine_update_settings' => [
        'classname'   => 'local_meditation_routine\external\update_settings',
        'methodname'  => 'execute',
        'description' => 'Update meditation settings for a quiz',
        'type'        => 'write',
        'ajax'        => true,
    ],
];
