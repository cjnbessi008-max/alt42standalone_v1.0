<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$functions = array(

    'mod_3dlineseq_get_sequence' => array(
        'classname'   => 'mod_3dlineseq_external',
        'methodname'  => 'get_sequence',
        'classpath'   => 'mod/3dlineseq/externallib.php',
        'description' => 'Get sequence data for a 3D Line Seq activity',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'mod/3dlineseq:view',
    ),

    'mod_3dlineseq_submit_attempt' => array(
        'classname'   => 'mod_3dlineseq_external',
        'methodname'  => 'submit_attempt',
        'classpath'   => 'mod/3dlineseq/externallib.php',
        'description' => 'Submit an attempt for a 3D Line Seq activity',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> 'mod/3dlineseq:submit',
    ),

    'mod_3dlineseq_get_attempts' => array(
        'classname'   => 'mod_3dlineseq_external',
        'methodname'  => 'get_attempts',
        'classpath'   => 'mod/3dlineseq/externallib.php',
        'description' => 'Get user attempts for a 3D Line Seq activity',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'mod/3dlineseq:view',
    ),

);

$services = array(
    '3D Line Seq Service' => array(
        'functions' => array(
            'mod_3dlineseq_get_sequence',
            'mod_3dlineseq_submit_attempt',
            'mod_3dlineseq_get_attempts'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
    )
);
