<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_confidencereasoning_save_confidence_data' => array(
        'classname'   => 'local_confidencereasoning\external',
        'methodname'  => 'save_confidence_data',
        'classpath'   => '',
        'description' => 'Save confidence level and reasoning for a question attempt',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/confidencereasoning:submit',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
);
