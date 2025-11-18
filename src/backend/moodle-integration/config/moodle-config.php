<?php
/**
 * Shape Morph - Moodle Configuration
 *
 * Moodle 환경 설정 및 초기화
 */

defined('MOODLE_INTERNAL') || die();

// Moodle 3.7 최소 버전 요구사항
$plugin->requires = 2019052000; // Moodle 3.7

// 플러그인 정보
$plugin->component = 'local_shape_morph';
$plugin->version = 2025111800; // YYYYMMDDXX
$plugin->release = '1.0.0';
$plugin->maturity = MATURITY_STABLE;

// Shape Morph 전역 설정
define('SHAPE_MORPH_VERSION', '1.0.0');
define('SHAPE_MORPH_DEBUG', false);

/**
 * Shape Morph 설정 가져오기
 */
function shape_morph_get_config($courseid = null) {
    global $DB;

    if ($courseid === null) {
        global $COURSE;
        $courseid = $COURSE->id;
    }

    $config = $DB->get_record('shape_morph_config', ['moodle_course_id' => $courseid]);

    if (!$config) {
        // 기본 설정 생성
        $config = new stdClass();
        $config->moodle_course_id = $courseid;
        $config->animation_speed = 1.00;
        $config->transition_duration = 2000;
        $config->shape_style = 'smooth';
        $config->is_active = true;

        $config->id = $DB->insert_record('shape_morph_config', $config);
    }

    return $config;
}

/**
 * Shape Morph 활성화 여부 확인
 */
function shape_morph_is_active($courseid = null) {
    $config = shape_morph_get_config($courseid);
    return (bool)$config->is_active;
}

/**
 * 데이터베이스 연결 설정
 */
class ShapeMorphDB {
    private static $instance = null;
    private $db;

    private function __construct() {
        global $DB;
        $this->db = $DB;
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new ShapeMorphDB();
        }
        return self::$instance;
    }

    public function getDB() {
        return $this->db;
    }
}

/**
 * JSON 응답 헬퍼
 */
function shape_morph_json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답
 */
function shape_morph_error_response($message, $status = 400) {
    shape_morph_json_response([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ], $status);
}

/**
 * 성공 응답
 */
function shape_morph_success_response($data) {
    shape_morph_json_response([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ], 200);
}

/**
 * 로깅 함수
 */
function shape_morph_log($message, $level = 'INFO') {
    if (SHAPE_MORPH_DEBUG) {
        error_log("[Shape Morph - {$level}] " . $message);
    }
}
