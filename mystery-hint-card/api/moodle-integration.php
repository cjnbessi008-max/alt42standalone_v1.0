<?php
/**
 * 미스터리 힌트 카드 - Moodle 연동 API
 *
 * 요구사항:
 * - PHP 7.1.9+
 * - MySQL 5.7+
 * - Moodle 3.7+
 *
 * 사용법:
 * 1. Moodle의 local/mysterycard/ 디렉토리에 배치
 * 2. 데이터베이스 테이블 생성 (install.xml 참고)
 * 3. Moodle config.php에 설정 추가
 */

// Moodle 설정 로드
require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/accesslib.php');

// CORS 헤더 (개발 환경용 - 프로덕션에서는 제한 필요)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 로그인 확인
require_login();

/**
 * API 라우터
 */
$action = optional_param('action', '', PARAM_TEXT);

switch ($action) {
    case 'get_problem':
        get_problem_data();
        break;

    case 'save_progress':
        save_student_progress();
        break;

    case 'log_hint':
        log_hint_usage();
        break;

    case 'get_analytics':
        get_analytics();
        break;

    default:
        api_error('Invalid action', 400);
}

/**
 * 문제 데이터 가져오기
 */
function get_problem_data() {
    global $DB, $USER;

    $problem_id = required_param('problem_id', PARAM_INT);

    try {
        // 문제 데이터 조회
        $problem = $DB->get_record('mysterycard_problems', ['id' => $problem_id], '*', MUST_EXIST);

        // 힌트 조회
        $hints = $DB->get_records('mysterycard_hints', ['problem_id' => $problem_id], 'sort_order ASC');

        // 학생의 진행 상황 조회
        $progress = $DB->get_record('mysterycard_progress', [
            'problem_id' => $problem_id,
            'user_id' => $USER->id
        ]);

        // 응답 데이터 구성
        $response = [
            'success' => true,
            'data' => [
                'problemId' => $problem->id,
                'problemTitle' => $problem->title,
                'problemContent' => json_decode($problem->content),
                'cards' => array_map(function($hint) {
                    return [
                        'id' => $hint->id,
                        'title' => $hint->title,
                        'shape' => $hint->shape,
                        'shapeType' => $hint->shape_type,
                        'text' => $hint->hint_text,
                        'unlocked' => false // 클라이언트에서 진행 상황과 병합
                    ];
                }, array_values($hints)),
                'settings' => json_decode($problem->settings),
                'progress' => $progress ? json_decode($progress->progress_data) : null
            ]
        ];

        api_success($response['data']);

    } catch (Exception $e) {
        api_error('Failed to fetch problem data: ' . $e->getMessage(), 500);
    }
}

/**
 * 학생 진행 상황 저장
 */
function save_student_progress() {
    global $DB, $USER;

    $problem_id = required_param('problem_id', PARAM_INT);
    $progress_data = required_param('progress_data', PARAM_RAW);

    try {
        // JSON 검증
        $progress = json_decode($progress_data);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }

        // 기존 진행 상황 확인
        $existing = $DB->get_record('mysterycard_progress', [
            'problem_id' => $problem_id,
            'user_id' => $USER->id
        ]);

        $record = new stdClass();
        $record->problem_id = $problem_id;
        $record->user_id = $USER->id;
        $record->progress_data = $progress_data;
        $record->updated_at = time();

        if ($existing) {
            // 업데이트
            $record->id = $existing->id;
            $DB->update_record('mysterycard_progress', $record);
        } else {
            // 새로 생성
            $record->created_at = time();
            $record->id = $DB->insert_record('mysterycard_progress', $record);
        }

        api_success([
            'saved' => true,
            'progress_id' => $record->id
        ]);

    } catch (Exception $e) {
        api_error('Failed to save progress: ' . $e->getMessage(), 500);
    }
}

/**
 * 힌트 사용 로그 기록
 */
function log_hint_usage() {
    global $DB, $USER;

    $problem_id = required_param('problem_id', PARAM_INT);
    $hint_id = required_param('hint_id', PARAM_INT);

    try {
        $record = new stdClass();
        $record->problem_id = $problem_id;
        $record->hint_id = $hint_id;
        $record->user_id = $USER->id;
        $record->used_at = time();
        $record->session_id = sesskey();

        $id = $DB->insert_record('mysterycard_hint_logs', $record);

        api_success([
            'logged' => true,
            'log_id' => $id
        ]);

    } catch (Exception $e) {
        api_error('Failed to log hint usage: ' . $e->getMessage(), 500);
    }
}

/**
 * 분석 데이터 가져오기 (교사용)
 */
function get_analytics() {
    global $DB, $USER;

    $problem_id = required_param('problem_id', PARAM_INT);

    // 교사 권한 확인
    $context = context_system::instance();
    if (!has_capability('moodle/course:manageactivities', $context)) {
        api_error('Permission denied', 403);
    }

    try {
        // 힌트 사용 통계
        $hint_stats = $DB->get_records_sql("
            SELECT
                h.id,
                h.title,
                COUNT(l.id) as usage_count,
                COUNT(DISTINCT l.user_id) as unique_users
            FROM {mysterycard_hints} h
            LEFT JOIN {mysterycard_hint_logs} l ON h.id = l.hint_id
            WHERE h.problem_id = ?
            GROUP BY h.id, h.title
            ORDER BY h.sort_order
        ", [$problem_id]);

        // 학생 진행 상황 통계
        $progress_stats = $DB->get_record_sql("
            SELECT
                COUNT(DISTINCT user_id) as total_students,
                AVG(JSON_LENGTH(progress_data, '$.unlockedCards')) as avg_unlocked
            FROM {mysterycard_progress}
            WHERE problem_id = ?
        ", [$problem_id]);

        api_success([
            'hint_statistics' => array_values($hint_stats),
            'progress_statistics' => $progress_stats
        ]);

    } catch (Exception $e) {
        api_error('Failed to fetch analytics: ' . $e->getMessage(), 500);
    }
}

/**
 * 성공 응답
 */
function api_success($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답
 */
function api_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
