<?php
// This file is part of Moodle - http://moodle.org/
/**
 * REST API for Integral Digest
 * 모바일 앱과 웹앱에서 사용하는 API 엔드포인트
 *
 * @package    qtype_integral
 * @copyright  2025 Alt42 Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../../../../config.php');
require_once($CFG->dirroot . '/question/type/integral/classes/integral_digest.php');

use qtype_integral\integral_digest;

// CORS 헤더 설정 (모바일 앱용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 인증 확인
require_login();

try {
    // 요청 파라미터 파싱
    $action = optional_param('action', '', PARAM_ALPHA);
    $problem_id = optional_param('problem_id', '', PARAM_TEXT);
    $module_id = optional_param('module_id', '', PARAM_TEXT);
    $format = optional_param('format', 'mobile', PARAM_ALPHA);

    $response = array(
        'success' => false,
        'data' => null,
        'error' => null,
        'timestamp' => time()
    );

    switch ($action) {

        // 문제 다이제스트 조회
        case 'get_digest':
            if (empty($problem_id)) {
                throw new Exception('problem_id is required');
            }

            $digest = new integral_digest($problem_id);
            $data = $digest->get_digest($format);

            $response['success'] = true;
            $response['data'] = $data;
            break;

        // 모듈의 모든 문제 다이제스트 조회
        case 'get_module_digests':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $data = integral_digest::get_module_digests($module_id, $format);

            $response['success'] = true;
            $response['data'] = $data;
            break;

        // 문제 다이제스트 생성
        case 'create_digest':
            require_capability('moodle/question:add', context_system::instance());

            $problem_data = json_decode(file_get_contents('php://input'), true);

            if (empty($problem_data)) {
                throw new Exception('problem_data is required');
            }

            $digest = new integral_digest();
            $digest_id = $digest->create_digest($problem_data);

            if ($digest_id) {
                $response['success'] = true;
                $response['data'] = array('digest_id' => $digest_id);
            } else {
                throw new Exception('Failed to create digest');
            }
            break;

        // 학생 답안 기록
        case 'record_attempt':
            $student_id = $USER->id;
            $attempt_data = json_decode(file_get_contents('php://input'), true);

            if (empty($problem_id) || empty($attempt_data)) {
                throw new Exception('problem_id and attempt_data are required');
            }

            $digest = new integral_digest($problem_id);
            $success = $digest->record_student_attempt($student_id, $attempt_data);

            if ($success) {
                $response['success'] = true;
                $response['data'] = array('recorded' => true);
            } else {
                throw new Exception('Failed to record attempt');
            }
            break;

        // 배치 다이제스트 생성 (관리자용)
        case 'batch_create':
            require_capability('moodle/site:config', context_system::instance());

            $problems_data = json_decode(file_get_contents('php://input'), true);

            if (empty($problems_data) || !is_array($problems_data)) {
                throw new Exception('problems_data array is required');
            }

            $digest_ids = integral_digest::batch_create_digests($problems_data);

            $response['success'] = true;
            $response['data'] = array(
                'created_count' => count($digest_ids),
                'digest_ids' => $digest_ids
            );
            break;

        // 학생 진행 상황 조회
        case 'get_student_progress':
            $student_id = optional_param('student_id', $USER->id, PARAM_INT);

            // 권한 확인: 본인 또는 교사만 조회 가능
            if ($student_id != $USER->id) {
                require_capability('moodle/course:viewhiddenactivities', context_system::instance());
            }

            if (empty($problem_id)) {
                throw new Exception('problem_id is required');
            }

            $progress = $DB->get_record('student_integral_progress',
                array('student_id' => $student_id, 'problem_id' => $problem_id));

            $response['success'] = true;
            $response['data'] = $progress ? $progress : array('status' => 'not_started');
            break;

        // 문제 통계 조회
        case 'get_statistics':
            if (empty($problem_id)) {
                throw new Exception('problem_id is required');
            }

            $digest = new integral_digest($problem_id);
            $data = $digest->get_digest('detailed');

            $response['success'] = true;
            $response['data'] = array(
                'statistics' => $data['statistics'],
                'challenges' => $data['challenges']
            );
            break;

        // 모바일 앱 설정 조회
        case 'get_mobile_config':
            if (empty($problem_id)) {
                throw new Exception('problem_id is required');
            }

            $digest = new integral_digest($problem_id);
            $data = $digest->get_digest('mobile');

            $response['success'] = true;
            $response['data'] = array(
                'mobile_layout' => $data['mobile_layout'],
                'visualization' => $data['visualization']
            );
            break;

        // 문제 리스트 조회 (페이지네이션 지원)
        case 'list_problems':
            $page = optional_param('page', 0, PARAM_INT);
            $per_page = optional_param('per_page', 10, PARAM_INT);
            $difficulty = optional_param('difficulty', 0, PARAM_INT);
            $type = optional_param('type', '', PARAM_TEXT);

            $conditions = array();
            if (!empty($module_id)) {
                $conditions['module_id'] = $module_id;
            }
            if ($difficulty > 0) {
                $conditions['difficulty_level'] = $difficulty;
            }
            if (!empty($type)) {
                $conditions['problem_type'] = $type;
            }

            $total = $DB->count_records('integral_digest', $conditions);
            $digests = $DB->get_records('integral_digest', $conditions, 'created_at DESC',
                '*', $page * $per_page, $per_page);

            $items = array();
            foreach ($digests as $digest_data) {
                $digest = new integral_digest($digest_data->problem_id);
                $items[] = $digest->get_digest('summary');
            }

            $response['success'] = true;
            $response['data'] = array(
                'items' => $items,
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => ceil($total / $per_page)
            );
            break;

        // API 버전 및 상태
        case 'status':
            $response['success'] = true;
            $response['data'] = array(
                'api_version' => '1.0.0',
                'moodle_version' => $CFG->version,
                'php_version' => PHP_VERSION,
                'mysql_version' => $DB->get_server_info()['version'],
                'status' => 'operational',
                'features' => array(
                    'digest_generation' => true,
                    'mobile_support' => true,
                    'statistics_tracking' => true,
                    'batch_operations' => true,
                    'korean_language' => true
                )
            );
            break;

        default:
            throw new Exception('Invalid action: ' . $action);
    }

} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = array(
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'trace' => debugging('', DEBUG_DEVELOPER) ? $e->getTraceAsString() : null
    );
    http_response_code(400);
}

// JSON 응답 출력
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;
