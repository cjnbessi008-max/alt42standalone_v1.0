<?php
/**
 * Linear Stairs Moodle Plugin - Answer Submission Handler
 *
 * 학생의 답안을 처리하고 데이터베이스에 저장
 *
 * @package    mod_linearstairs
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

// JSON 데이터 읽기
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// 응답 헤더 설정
header('Content-Type: application/json');

// 세션 키 확인
if (!isset($data['sesskey']) || !confirm_sesskey($data['sesskey'])) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Invalid session key'
    ));
    exit;
}

// 파라미터 검증
$linearstairsid = isset($data['linearstairsid']) ? (int)$data['linearstairsid'] : 0;
$userid = isset($data['userid']) ? (int)$data['userid'] : 0;
$answer = isset($data['answer']) ? $data['answer'] : null;

if (!$linearstairsid || !$userid || !$answer) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Missing required parameters'
    ));
    exit;
}

// 로그인 확인
require_login();

// 사용자 권한 확인
if ($USER->id != $userid) {
    echo json_encode(array(
        'success' => false,
        'message' => 'User ID mismatch'
    ));
    exit;
}

// LinearStairs 인스턴스 확인
$linearstairs = $DB->get_record('linearstairs', array('id' => $linearstairsid), '*', MUST_EXIST);
$course = $DB->get_record('course', array('id' => $linearstairs->course), '*', MUST_EXIST);
$cm = get_coursemodule_from_instance('linearstairs', $linearstairs->id, $course->id, false, MUST_EXIST);
$context = context_module::instance($cm->id);

// 제출 권한 확인
if (!has_capability('mod/linearstairs:submit', $context)) {
    echo json_encode(array(
        'success' => false,
        'message' => 'No permission to submit'
    ));
    exit;
}

// 답안 데이터 검증
$firstterm = isset($answer['firstTerm']) ? (int)$answer['firstTerm'] : 0;
$commondiff = isset($answer['commonDiff']) ? (int)$answer['commonDiff'] : 0;
$termcount = isset($answer['termCount']) ? (int)$answer['termCount'] : 0;

if ($termcount < 1 || $termcount > 20) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Invalid term count (must be between 1 and 20)'
    ));
    exit;
}

// 데이터베이스에 저장
try {
    $attempt = new stdClass();
    $attempt->linearstairsid = $linearstairsid;
    $attempt->userid = $userid;
    $attempt->firstterm = $firstterm;
    $attempt->commondiff = $commondiff;
    $attempt->termcount = $termcount;
    $attempt->timecreated = time();

    $attemptid = $DB->insert_record('linearstairs_attempts', $attempt);

    // 이벤트 로깅
    $event = \mod_linearstairs\event\answer_submitted::create(array(
        'objectid' => $attemptid,
        'context' => $context,
        'relateduserid' => $userid,
        'other' => array(
            'linearstairsid' => $linearstairsid,
            'firstterm' => $firstterm,
            'commondiff' => $commondiff,
            'termcount' => $termcount
        )
    ));
    $event->trigger();

    // 성공 응답
    echo json_encode(array(
        'success' => true,
        'message' => 'Answer submitted successfully',
        'attemptid' => $attemptid,
        'timestamp' => $attempt->timecreated
    ));

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ));
}

exit;
?>
