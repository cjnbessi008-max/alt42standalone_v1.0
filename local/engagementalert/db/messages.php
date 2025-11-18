<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Message provider definitions for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$messageproviders = [
    'engagementalert' => [
        'capability' => 'local/engagementalert:receivealerts',
        'defaults' => [
            'popup' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN,
            'email' => MESSAGE_PERMITTED,
        ],
    ],
];
