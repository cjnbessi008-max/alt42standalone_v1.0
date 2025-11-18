<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Web service definitions for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_engagementalert_log_events' => [
        'classname'   => 'local_engagementalert\external',
        'methodname'  => 'log_events',
        'description' => 'Log engagement tracking events',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/engagementalert:view',
    ],
    'local_engagementalert_trigger_alert' => [
        'classname'   => 'local_engagementalert\external',
        'methodname'  => 'trigger_alert',
        'description' => 'Trigger an engagement alert',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/engagementalert:view',
    ],
];
