<?php
// This file is part of Moodle - http://moodle.org/
//
// Web services declaration for Sequence Pearls

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'mod_sequencepearls_submit_answer' => array(
        'classname'   => 'mod_sequencepearls\external',
        'methodname'  => 'submit_answer',
        'classpath'   => '',
        'description' => 'Submit an answer to a sequence problem',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> 'mod/sequencepearls:submit',
    ),

    'mod_sequencepearls_get_problem' => array(
        'classname'   => 'mod_sequencepearls\external',
        'methodname'  => 'get_problem',
        'classpath'   => '',
        'description' => 'Get the next problem for the user',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'mod/sequencepearls:view',
    ),
);
