<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observers for Jump Detection Plugin
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = [
    // 모듈 조회 이벤트
    [
        'eventname' => '\core\event\course_module_viewed',
        'callback' => 'local_jumpdetect_observer::module_viewed',
    ],

    // 모듈 완료 이벤트
    [
        'eventname' => '\core\event\course_module_completion_updated',
        'callback' => 'local_jumpdetect_observer::module_completed',
    ],

    // 퀴즈 시도 시작
    [
        'eventname' => '\mod_quiz\event\attempt_started',
        'callback' => 'local_jumpdetect_observer::quiz_attempted',
    ],

    // 퀴즈 제출
    [
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => 'local_jumpdetect_observer::quiz_submitted',
    ],

    // 사용자 등록
    [
        'eventname' => '\core\event\user_enrolment_created',
        'callback' => 'local_jumpdetect_observer::user_enrolled',
    ],

    // 과제 조회
    [
        'eventname' => '\mod_assign\event\submission_status_viewed',
        'callback' => 'local_jumpdetect_observer::assignment_viewed',
    ],
];
