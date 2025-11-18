<?php
/**
 * Web service definitions for Fluid Geometry plugin
 *
 * @package    local_fluidgeometry
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_fluidgeometry_get_problem' => array(
        'classname'   => 'local_fluidgeometry_external',
        'methodname'  => 'get_problem',
        'classpath'   => 'local/fluidgeometry/externallib.php',
        'description' => 'Get a specific fluid geometry problem',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/fluidgeometry:view',
    ),
    'local_fluidgeometry_get_problems' => array(
        'classname'   => 'local_fluidgeometry_external',
        'methodname'  => 'get_problems',
        'classpath'   => 'local/fluidgeometry/externallib.php',
        'description' => 'Get all available fluid geometry problems',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/fluidgeometry:view',
    ),
    'local_fluidgeometry_submit_attempt' => array(
        'classname'   => 'local_fluidgeometry_external',
        'methodname'  => 'submit_attempt',
        'classpath'   => 'local/fluidgeometry/externallib.php',
        'description' => 'Submit a student attempt for a problem',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities'=> 'local/fluidgeometry:submit',
    ),
    'local_fluidgeometry_get_attempts' => array(
        'classname'   => 'local_fluidgeometry_external',
        'methodname'  => 'get_attempts',
        'classpath'   => 'local/fluidgeometry/externallib.php',
        'description' => 'Get student attempt history',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/fluidgeometry:view',
    ),
);

$services = array(
    'Fluid Geometry Service' => array(
        'functions' => array(
            'local_fluidgeometry_get_problem',
            'local_fluidgeometry_get_problems',
            'local_fluidgeometry_submit_attempt',
            'local_fluidgeometry_get_attempts',
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'fluidgeometry',
        'downloadfiles' => 0,
        'uploadfiles' => 0,
    ),
);
