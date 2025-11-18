<?php
/**
 * External functions and service definitions for Blossom Sequence
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'mod_blossomsequence_submit_answer' => array(
        'classname'   => 'mod_blossomsequence\external',
        'methodname'  => 'submit_answer',
        'classpath'   => '',
        'description' => 'Submit an answer to a blossom sequence problem',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/blossomsequence:submit',
    ),
);

$services = array(
    'Blossom Sequence Service' => array(
        'functions' => array('mod_blossomsequence_submit_answer'),
        'restrictedusers' => 0,
        'enabled' => 1,
    ),
);
