<?php
/**
 * Web service definitions for Unit Compass
 *
 * @package    mod_unitcompass
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'mod_unitcompass_get_problem' => array(
        'classname'   => 'mod_unitcompass_external',
        'methodname'  => 'get_problem',
        'classpath'   => 'mod/unitcompass/externallib.php',
        'description' => 'Get problem for Unit Compass activity',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'mod/unitcompass:view',
    ),

    'mod_unitcompass_submit_answer' => array(
        'classname'   => 'mod_unitcompass_external',
        'methodname'  => 'submit_answer',
        'classpath'   => 'mod/unitcompass/externallib.php',
        'description' => 'Submit answer for Unit Compass problem',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> 'mod/unitcompass:submit',
    ),

    'mod_unitcompass_get_progress' => array(
        'classname'   => 'mod_unitcompass_external',
        'methodname'  => 'get_progress',
        'classpath'   => 'mod/unitcompass/externallib.php',
        'description' => 'Get student progress in Unit Compass',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'mod/unitcompass:view',
    ),
);

$services = array(
    'Unit Compass Service' => array(
        'functions' => array(
            'mod_unitcompass_get_problem',
            'mod_unitcompass_submit_answer',
            'mod_unitcompass_get_progress'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'unitcompass',
    ),
);
