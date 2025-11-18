<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_thinkroutine_get_student_activity' => array(
        'classname'   => 'local_thinkroutine_external',
        'methodname'  => 'get_student_activity',
        'classpath'   => 'local/thinkroutine/externallib.php',
        'description' => 'Get student activity and performance data',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_thinkroutine_get_course_analytics' => array(
        'classname'   => 'local_thinkroutine_external',
        'methodname'  => 'get_course_analytics',
        'classpath'   => 'local/thinkroutine/externallib.php',
        'description' => 'Get course analytics and top performer patterns',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_thinkroutine_analyze_learning_patterns' => array(
        'classname'   => 'local_thinkroutine_external',
        'methodname'  => 'analyze_learning_patterns',
        'classpath'   => 'local/thinkroutine/externallib.php',
        'description' => 'Analyze learning patterns and thinking routines',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
);

$services = array(
    'Think Routine Service' => array(
        'functions' => array(
            'local_thinkroutine_get_student_activity',
            'local_thinkroutine_get_course_analytics',
            'local_thinkroutine_analyze_learning_patterns'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
    ),
);
