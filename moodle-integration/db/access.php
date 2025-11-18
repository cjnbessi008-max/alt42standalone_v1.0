<?php
/**
 * Capability definitions for Breathing Curve plugin
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$capabilities = [
    // 학생이 Breathing Curve 앱을 볼 수 있는 권한
    'local/breathing_curve:view' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ],

    // 교사가 Breathing Curve 문제를 관리할 수 있는 권한
    'local/breathing_curve:manage' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ],

    // 관리자가 설정을 변경할 수 있는 권한
    'local/breathing_curve:configure' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => [
            'manager' => CAP_ALLOW
        ]
    ]
];
