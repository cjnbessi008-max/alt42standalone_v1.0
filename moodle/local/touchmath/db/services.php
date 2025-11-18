<?php
/**
 * Touch Math external services definition
 *
 * @package    local_touchmath
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_touchmath_get_problem' => array(
        'classname'   => 'local_touchmath_external',
        'methodname'  => 'get_problem',
        'classpath'   => 'local/touchmath/externallib.php',
        'description' => 'Get tangent problem data',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),

    'local_touchmath_submit_answer' => array(
        'classname'   => 'local_touchmath_external',
        'methodname'  => 'submit_answer',
        'classpath'   => 'local/touchmath/externallib.php',
        'description' => 'Submit student answer',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),

    'local_touchmath_save_progress' => array(
        'classname'   => 'local_touchmath_external',
        'methodname'  => 'save_progress',
        'classpath'   => 'local/touchmath/externallib.php',
        'description' => 'Save student progress',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),

    'local_touchmath_log_event' => array(
        'classname'   => 'local_touchmath_external',
        'methodname'  => 'log_event',
        'classpath'   => 'local/touchmath/externallib.php',
        'description' => 'Log interaction event',
        'type'        => 'write',
        'ajax'        => true,
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
);
