<?php
/**
 * Drag-to-Slope 학습 결과 저장 API
 *
 * POST 요청으로 학생의 학습 데이터를 받아서 Moodle DB에 저장
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/filelib.php');

// 로그인 확인
require_login();

// CORS 헤더 (필요한 경우)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POST만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // JSON 데이터 파싱
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        throw new Exception('Invalid JSON data');
    }

    // 필수 파라미터 확인
    $required = ['sesskey', 'problemid', 'userid', 'courseid', 'responsedata'];
    foreach ($required as $param) {
        if (!isset($data[$param])) {
            throw new Exception("Missing required parameter: $param");
        }
    }

    // 세션키 검증
    if (!confirm_sesskey($data['sesskey'])) {
        throw new Exception('Invalid session key');
    }

    // 권한 확인
    $course = $DB->get_record('course', ['id' => $data['courseid']], '*', MUST_EXIST);
    $context = context_course::instance($course->id);

    if (!has_capability('mod/dragslope:submit', $context)) {
        throw new Exception('No permission to submit responses');
    }

    // 사용자 확인
    if ($USER->id != $data['userid']) {
        throw new Exception('User ID mismatch');
    }

    // 문제 확인
    $problem = $DB->get_record('dragslope_problems', ['id' => $data['problemid']], '*', MUST_EXIST);

    // 응답 데이터 추출
    $response_data = $data['responsedata'];
    $interactions = $response_data['interactions'];
    $num_interactions = count($interactions);

    // 성적 계산 (간단한 예시: 인터랙션 횟수 기반)
    // 실제로는 더 복잡한 로직 필요
    $grade = min(100, $num_interactions * 2); // 최대 100점

    // DB에 기존 응답이 있는지 확인
    $existing = $DB->get_record('dragslope_responses', [
        'problemid' => $data['problemid'],
        'userid' => $data['userid']
    ]);

    $record = new stdClass();
    $record->problemid = $data['problemid'];
    $record->userid = $data['userid'];
    $record->courseid = $data['courseid'];
    $record->interactions = json_encode($interactions);
    $record->num_interactions = $num_interactions;
    $record->completed = $response_data['completed'] ? 1 : 0;
    $record->grade = $grade;
    $record->timemodified = time();

    if ($existing) {
        // 업데이트
        $record->id = $existing->id;
        $DB->update_record('dragslope_responses', $record);
        $response_id = $record->id;
    } else {
        // 새로 생성
        $record->timecreated = time();
        $response_id = $DB->insert_record('dragslope_responses', $record);
    }

    // 이벤트 로깅
    $event = \local_dragslope\event\response_submitted::create([
        'objectid' => $response_id,
        'context' => $context,
        'other' => [
            'problemid' => $data['problemid'],
            'num_interactions' => $num_interactions,
            'grade' => $grade
        ]
    ]);
    $event->trigger();

    // 성공 응답
    echo json_encode([
        'success' => true,
        'response_id' => $response_id,
        'grade' => $grade,
        'message' => '학습 결과가 성공적으로 저장되었습니다'
    ]);

} catch (Exception $e) {
    // 에러 응답
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);

    // 에러 로깅
    error_log('Drag-to-Slope save error: ' . $e->getMessage());
}
?>
