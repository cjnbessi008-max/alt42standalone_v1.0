<?php
/**
 * Breathing Curve - Moodle Integration API
 *
 * Moodle LMS에서 문제 데이터를 받아 Breathing Curve 앱으로 전달하는 API
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../../config.php'); // Moodle 설정 로드

// CORS 헤더 설정 (개발 환경용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 사용자 인증 확인 (Moodle 세션)
require_login();

// 파라미터 받기
$question_id = optional_param('qid', 0, PARAM_INT);
$course_id = optional_param('courseid', 0, PARAM_INT);
$user_id = $USER->id;

/**
 * 문제 데이터 가져오기
 *
 * @param int $question_id 문제 ID
 * @param int $course_id 과정 ID
 * @return array 문제 데이터
 */
function get_problem_data($question_id, $course_id) {
    global $DB;

    if ($question_id == 0) {
        // 샘플 데이터 반환 (테스트용)
        return [
            'success' => true,
            'problem' => [
                'id' => 0,
                'type' => 'quadratic',
                'title' => '2차 함수의 특성',
                'description' => '다음 함수의 증가/감소 구간을 관찰하세요',
                'equation' => 'f(x) = -0.5(x - 3)² + 4',
                'difficulty' => 'medium',
                'hints' => [
                    '극값을 찾아보세요',
                    '도함수를 구해보세요',
                    'x = 3에서 최댓값을 가집니다'
                ]
            ],
            'metadata' => [
                'course_id' => $course_id,
                'timestamp' => time(),
                'version' => '1.0'
            ]
        ];
    }

    try {
        // Moodle 데이터베이스에서 문제 정보 가져오기
        $question = $DB->get_record('question', ['id' => $question_id], '*', MUST_EXIST);

        // 문제 타입에 따른 데이터 파싱
        $problem_data = parse_question_data($question);

        return [
            'success' => true,
            'problem' => $problem_data,
            'metadata' => [
                'course_id' => $course_id,
                'question_id' => $question_id,
                'timestamp' => time(),
                'version' => '1.0'
            ]
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'timestamp' => time()
        ];
    }
}

/**
 * 문제 데이터 파싱
 *
 * @param object $question Moodle 문제 객체
 * @return array 파싱된 문제 데이터
 */
function parse_question_data($question) {
    // 문제 텍스트에서 함수 유형 추출
    $question_text = $question->questiontext;
    $type = detect_function_type($question_text);

    return [
        'id' => $question->id,
        'type' => $type,
        'title' => strip_tags($question->name),
        'description' => strip_tags($question_text),
        'equation' => extract_equation($question_text),
        'difficulty' => $question->defaultmark > 5 ? 'hard' : ($question->defaultmark > 2 ? 'medium' : 'easy'),
        'hints' => extract_hints($question)
    ];
}

/**
 * 함수 유형 감지
 *
 * @param string $text 문제 텍스트
 * @return string 함수 유형 (quadratic|sine|cubic)
 */
function detect_function_type($text) {
    if (preg_match('/x\s*[\^²]\s*2|quadratic|이차|2차/i', $text)) {
        return 'quadratic';
    } else if (preg_match('/sin|cos|tan|삼각|trigonometric/i', $text)) {
        return 'sine';
    } else if (preg_match('/x\s*[\^³]\s*3|cubic|삼차|3차/i', $text)) {
        return 'cubic';
    }
    return 'quadratic'; // 기본값
}

/**
 * 수식 추출
 *
 * @param string $text 문제 텍스트
 * @return string 수식
 */
function extract_equation($text) {
    // LaTeX 또는 일반 수식 패턴 찾기
    if (preg_match('/f\(x\)\s*=\s*([^\<\n]+)/i', $text, $matches)) {
        return 'f(x) = ' . trim(strip_tags($matches[1]));
    }
    return '';
}

/**
 * 힌트 추출
 *
 * @param object $question 문제 객체
 * @return array 힌트 배열
 */
function extract_hints($question) {
    global $DB;

    $hints = [];

    try {
        // Moodle 힌트 테이블에서 가져오기
        $question_hints = $DB->get_records('question_hints', ['questionid' => $question->id]);

        foreach ($question_hints as $hint) {
            $hints[] = strip_tags($hint->hint);
        }
    } catch (Exception $e) {
        // 힌트가 없으면 빈 배열 반환
    }

    return $hints;
}

/**
 * 학습 진도 기록
 *
 * @param int $user_id 사용자 ID
 * @param int $question_id 문제 ID
 * @param string $action 액션 타입
 */
function log_user_activity($user_id, $question_id, $action) {
    global $DB;

    $log = new stdClass();
    $log->userid = $user_id;
    $log->questionid = $question_id;
    $log->action = $action;
    $log->timestamp = time();

    try {
        // 커스텀 로그 테이블에 저장 (테이블이 존재하는 경우)
        // $DB->insert_record('breathing_curve_logs', $log);
    } catch (Exception $e) {
        // 로그 실패는 무시
    }
}

// 메인 실행
try {
    // 문제 데이터 가져오기
    $result = get_problem_data($question_id, $course_id);

    // 활동 로그 기록
    if ($result['success'] && $question_id > 0) {
        log_user_activity($user_id, $question_id, 'view_breathing_curve');
    }

    // JSON 응답 반환
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage(),
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
}
