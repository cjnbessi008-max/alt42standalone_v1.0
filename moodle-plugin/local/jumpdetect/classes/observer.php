<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observer class
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/jumpdetect/classes/detector.php');

class local_jumpdetect_observer {

    /**
     * 모듈 조회 이벤트 처리
     *
     * @param \core\event\course_module_viewed $event
     */
    public static function module_viewed(\core\event\course_module_viewed $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['userid'];
        $courseid = $data['courseid'];
        $moduleid = $data['contextinstanceid'];

        // 1. 이벤트 기록
        $tracking = new stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = $moduleid;
        $tracking->eventname = 'course_module_viewed';
        $tracking->timecreated = time();
        $tracking->timemodified = time();
        $tracking->sessionid = session_id();

        try {
            $DB->insert_record('jumpdetect_tracking', $tracking);

            // 2. 점프 패턴 감지 실행
            $detector = new local_jumpdetect_detector();
            $result = $detector->analyze_user_behavior($userid, $courseid, $moduleid);

            // 3. 점프 감지 시 알림 생성
            if ($result['detected']) {
                self::create_alert($userid, $courseid, $result);

                // 4. 패턴 저장
                self::save_pattern($userid, $courseid, $result);
            }
        } catch (Exception $e) {
            debugging('Jump Detection Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 모듈 완료 이벤트 처리
     *
     * @param \core\event\course_module_completion_updated $event
     */
    public static function module_completed(\core\event\course_module_completion_updated $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['relateduserid'] ?? $data['userid'];
        $courseid = $data['courseid'];
        $moduleid = $data['contextinstanceid'];

        // 완료 이벤트 기록
        $tracking = new stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = $moduleid;
        $tracking->eventname = 'course_module_completion';
        $tracking->timecreated = time();
        $tracking->timemodified = time();
        $tracking->sessionid = session_id();

        try {
            $DB->insert_record('jumpdetect_tracking', $tracking);
        } catch (Exception $e) {
            debugging('Jump Detection Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 퀴즈 시도 이벤트 처리
     *
     * @param \mod_quiz\event\attempt_started $event
     */
    public static function quiz_attempted(\mod_quiz\event\attempt_started $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['userid'];
        $courseid = $data['courseid'];
        $quizid = $data['objectid'];

        // 퀴즈 시도 기록
        $tracking = new stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = $quizid;
        $tracking->eventname = 'quiz_attempt_started';
        $tracking->timecreated = time();
        $tracking->timemodified = time();
        $tracking->sessionid = session_id();

        try {
            $DB->insert_record('jumpdetect_tracking', $tracking);
        } catch (Exception $e) {
            debugging('Jump Detection Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 퀴즈 제출 이벤트 처리
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function quiz_submitted(\mod_quiz\event\attempt_submitted $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['userid'];
        $courseid = $data['courseid'];
        $quizid = $data['objectid'];

        // 시간 이상 패턴 감지
        $detector = new local_jumpdetect_detector();
        $time_result = $detector->check_time_anomaly($userid, $quizid);

        if ($time_result['detected']) {
            self::create_alert($userid, $courseid, $time_result);
            self::save_pattern($userid, $courseid, $time_result);
        }
    }

    /**
     * 사용자 등록 이벤트 처리
     *
     * @param \core\event\user_enrolment_created $event
     */
    public static function user_enrolled(\core\event\user_enrolment_created $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['relateduserid'];
        $courseid = $data['courseid'];

        // 코스 등록 기록
        $tracking = new stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = 0;
        $tracking->eventname = 'user_enrolled';
        $tracking->timecreated = time();
        $tracking->timemodified = time();

        try {
            $DB->insert_record('jumpdetect_tracking', $tracking);
        } catch (Exception $e) {
            debugging('Jump Detection Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 과제 조회 이벤트 처리
     *
     * @param \mod_assign\event\submission_status_viewed $event
     */
    public static function assignment_viewed(\mod_assign\event\submission_status_viewed $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['userid'];
        $courseid = $data['courseid'];
        $assignid = $data['contextinstanceid'];

        // 과제 조회 기록
        $tracking = new stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = $assignid;
        $tracking->eventname = 'assignment_viewed';
        $tracking->timecreated = time();
        $tracking->timemodified = time();
        $tracking->sessionid = session_id();

        try {
            $DB->insert_record('jumpdetect_tracking', $tracking);
        } catch (Exception $e) {
            debugging('Jump Detection Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 알림 생성
     *
     * @param int $userid
     * @param int $courseid
     * @param array $result 감지 결과
     */
    private static function create_alert($userid, $courseid, $result) {
        global $DB;

        try {
            // 코스 컨텍스트 가져오기
            $context = context_course::instance($courseid);

            // 코스 교사 가져오기
            $teachers = get_enrolled_users($context, 'moodle/course:update');

            foreach ($teachers as $teacher) {
                $alert = new stdClass();
                $alert->userid = $userid;
                $alert->courseid = $courseid;
                $alert->teacherid = $teacher->id;
                $alert->alert_type = $result['jump_type'] ?? 'unknown';
                $alert->message = self::generate_alert_message($userid, $result);
                $alert->is_read = 0;
                $alert->timecreated = time();

                $DB->insert_record('jumpdetect_alerts', $alert);
            }
        } catch (Exception $e) {
            debugging('Alert Creation Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 패턴 저장
     *
     * @param int $userid
     * @param int $courseid
     * @param array $result 감지 결과
     */
    private static function save_pattern($userid, $courseid, $result) {
        global $DB;

        try {
            $pattern = new stdClass();
            $pattern->userid = $userid;
            $pattern->courseid = $courseid;
            $pattern->jump_type = $result['jump_type'] ?? 'unknown';
            $pattern->jump_score = $result['jump_score'] ?? 0;
            $pattern->skipped_modules = isset($result['skipped_modules'])
                ? json_encode($result['skipped_modules'])
                : null;
            $pattern->detected_at = time();
            $pattern->severity = $result['severity'] ?? 'normal';

            $DB->insert_record('jumpdetect_patterns', $pattern);
        } catch (Exception $e) {
            debugging('Pattern Save Error: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * 알림 메시지 생성
     *
     * @param int $userid
     * @param array $result
     * @return string
     */
    private static function generate_alert_message($userid, $result) {
        global $DB;

        $user = $DB->get_record('user', ['id' => $userid], 'firstname, lastname');
        $username = fullname($user);

        $jump_type = $result['jump_type'] ?? 'unknown';
        $severity = $result['severity'] ?? 'normal';

        $severity_emoji = [
            'normal' => '🟢',
            'caution' => '🟡',
            'warning' => '🟠',
            'critical' => '🔴'
        ];

        $emoji = $severity_emoji[$severity] ?? '';

        $messages = [
            'sequential' => "{$emoji} {$username} 학생이 학습 모듈을 건너뛰었습니다.",
            'prerequisite' => "{$emoji} {$username} 학생이 선수 과정을 완료하지 않고 진행했습니다.",
            'time_anomaly' => "{$emoji} {$username} 학생이 비정상적으로 빠르게 모듈을 완료했습니다.",
            'assessment_evasion' => "{$emoji} {$username} 학생이 퀴즈/과제를 건너뛰고 진행했습니다."
        ];

        $base_message = $messages[$jump_type] ?? "{$emoji} {$username} 학생의 학습 패턴에 이상이 감지되었습니다.";

        if (isset($result['jump_score'])) {
            $base_message .= " (점프 점수: {$result['jump_score']})";
        }

        return $base_message;
    }
}
