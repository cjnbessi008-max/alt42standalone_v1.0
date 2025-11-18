<?php
/**
 * Shape Morph - Problem Provider API
 *
 * Moodle quiz/assignment 문제에서 개념 정보를 추출하고 제공
 */

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot . '/lib/moodlelib.php');
require_once(__DIR__ . '/../config/moodle-config.php');

// CORS 헤더
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Preflight request 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 사용자 인증 확인
require_login();

global $DB, $USER;

// 요청 파라미터
$action = optional_param('action', '', PARAM_ALPHA);
$questionid = optional_param('questionid', 0, PARAM_INT);
$courseid = optional_param('courseid', 0, PARAM_INT);
$userid = $USER->id;

shape_morph_log("API Request: action={$action}, questionid={$questionid}, courseid={$courseid}, userid={$userid}");

try {
    switch ($action) {
        case 'get_problem_concept':
            if ($questionid <= 0) {
                shape_morph_error_response('Invalid question ID', 400);
            }
            $result = get_problem_concept($questionid);
            shape_morph_success_response($result);
            break;

        case 'get_current_concept':
            if ($courseid <= 0) {
                shape_morph_error_response('Invalid course ID', 400);
            }
            $result = get_current_concept($userid, $courseid);
            shape_morph_success_response($result);
            break;

        case 'update_progress':
            $conceptid = required_param('conceptid', PARAM_INT);
            if ($conceptid <= 0 || $courseid <= 0) {
                shape_morph_error_response('Invalid parameters', 400);
            }
            $result = update_student_progress($userid, $courseid, $conceptid);
            shape_morph_success_response($result);
            break;

        case 'get_all_concepts':
            $category = optional_param('category', '', PARAM_ALPHA);
            $result = get_all_concepts($category);
            shape_morph_success_response($result);
            break;

        default:
            shape_morph_error_response('Invalid action: ' . $action, 400);
            break;
    }
} catch (Exception $e) {
    shape_morph_log('Error: ' . $e->getMessage(), 'ERROR');
    shape_morph_error_response('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * 문제에서 개념 추출
 */
function get_problem_concept($questionid) {
    global $DB;

    shape_morph_log("Getting problem concept for question ID: {$questionid}");

    // 문제 조회
    $question = $DB->get_record('question', ['id' => $questionid], '*');
    if (!$question) {
        throw new Exception('Question not found');
    }

    // 문제 텍스트에서 개념 키워드 추출
    $concept = extract_concept_from_question($question->questiontext);
    shape_morph_log("Extracted concept: {$concept}");

    // 해당 개념의 형상 데이터 조회
    $shape = $DB->get_record('concept_shapes', ['concept_name' => $concept]);
    if (!$shape) {
        // 기본 형상 사용
        shape_morph_log("Concept not found, using default");
        $shape = $DB->get_record_sql("SELECT * FROM {concept_shapes} ORDER BY id ASC LIMIT 1");
    }

    return [
        'question_id' => $questionid,
        'question_text' => strip_tags($question->questiontext),
        'concept' => $concept,
        'shape' => [
            'id' => $shape->id,
            'name' => $shape->concept_name,
            'category' => $shape->concept_category,
            'data' => json_decode($shape->shape_data),
            'colors' => [
                'primary' => $shape->color_primary,
                'secondary' => $shape->color_secondary
            ],
            'description' => $shape->description
        ]
    ];
}

/**
 * 학생의 현재 개념 조회
 */
function get_current_concept($userid, $courseid) {
    global $DB;

    shape_morph_log("Getting current concept for user {$userid} in course {$courseid}");

    $progress = $DB->get_record('student_shape_progress', [
        'moodle_user_id' => $userid,
        'moodle_course_id' => $courseid
    ]);

    if (!$progress) {
        // 첫 접속 시 기본 개념으로 초기화
        shape_morph_log("No progress found, initializing");
        return initialize_student_progress($userid, $courseid);
    }

    $current_shape = $DB->get_record('concept_shapes', ['id' => $progress->current_concept_id]);
    $previous_shape = $progress->previous_concept_id
        ? $DB->get_record('concept_shapes', ['id' => $progress->previous_concept_id])
        : null;

    // 전환 정보 조회
    $transition = null;
    if ($previous_shape && $progress->transition_state === 'transitioning') {
        $transition = $DB->get_record('concept_transitions', [
            'from_concept_id' => $progress->previous_concept_id,
            'to_concept_id' => $progress->current_concept_id
        ]);
    }

    return [
        'current_concept' => format_shape_data($current_shape),
        'previous_concept' => $previous_shape ? format_shape_data($previous_shape) : null,
        'transition_state' => $progress->transition_state,
        'transition' => $transition ? format_transition_data($transition) : null,
        'last_updated' => strtotime($progress->animation_timestamp)
    ];
}

/**
 * 학생 진행 상황 업데이트
 */
function update_student_progress($userid, $courseid, $conceptid) {
    global $DB;

    shape_morph_log("Updating progress: user={$userid}, course={$courseid}, concept={$conceptid}");

    $existing = $DB->get_record('student_shape_progress', [
        'moodle_user_id' => $userid,
        'moodle_course_id' => $courseid
    ]);

    if ($existing) {
        // 기존 진행 상황 업데이트
        $update = new stdClass();
        $update->id = $existing->id;
        $update->previous_concept_id = $existing->current_concept_id;
        $update->current_concept_id = $conceptid;
        $update->transition_state = 'transitioning';

        $DB->update_record('student_shape_progress', $update);

        // 전환 데이터 조회
        $transition = $DB->get_record('concept_transitions', [
            'from_concept_id' => $existing->current_concept_id,
            'to_concept_id' => $conceptid
        ]);

        if (!$transition) {
            // 기본 전환 생성
            $transition = create_default_transition($existing->current_concept_id, $conceptid);
        }

        // 이벤트 로그
        log_shape_event($userid, $courseid, 'transition_start',
            $existing->current_concept_id, $conceptid);

        return [
            'updated' => true,
            'from_concept_id' => $existing->current_concept_id,
            'to_concept_id' => $conceptid,
            'transition' => format_transition_data($transition)
        ];
    } else {
        return initialize_student_progress($userid, $courseid, $conceptid);
    }
}

/**
 * 학생 진행 상황 초기화
 */
function initialize_student_progress($userid, $courseid, $conceptid = null) {
    global $DB;

    if (!$conceptid) {
        // 기본 시작 개념 (첫 번째 개념)
        $first_concept = $DB->get_record_sql(
            "SELECT id FROM {concept_shapes} ORDER BY id ASC LIMIT 1"
        );
        $conceptid = $first_concept->id;
    }

    $record = new stdClass();
    $record->moodle_user_id = $userid;
    $record->moodle_course_id = $courseid;
    $record->current_concept_id = $conceptid;
    $record->transition_state = 'idle';

    $record->id = $DB->insert_record('student_shape_progress', $record);

    shape_morph_log("Initialized progress with concept {$conceptid}");

    // 초기화 이벤트 로그
    log_shape_event($userid, $courseid, 'initialized', null, $conceptid);

    return get_current_concept($userid, $courseid);
}

/**
 * 모든 개념 조회
 */
function get_all_concepts($category = '') {
    global $DB;

    $params = [];
    $sql = "SELECT * FROM {concept_shapes}";

    if (!empty($category)) {
        $sql .= " WHERE concept_category = :category";
        $params['category'] = $category;
    }

    $sql .= " ORDER BY concept_category, id";

    $concepts = $DB->get_records_sql($sql, $params);

    $result = [];
    foreach ($concepts as $concept) {
        $result[] = format_shape_data($concept);
    }

    return [
        'total' => count($result),
        'category' => $category ?: 'all',
        'concepts' => $result
    ];
}

/**
 * 문제 텍스트에서 개념 추출 (키워드 매칭)
 */
function extract_concept_from_question($questiontext) {
    $text = strip_tags($questiontext);
    $text = mb_strtolower($text, 'UTF-8');

    // 키워드 매핑 (한국어 + 영어)
    $keyword_map = [
        // 분수
        'fraction_half' => ['1/2', '반', '절반', 'half', '이분의 일'],
        'fraction_third' => ['1/3', '삼분의 일', 'third', '삼등분'],
        'fraction_quarter' => ['1/4', '사분의 일', 'quarter', '사등분'],
        'fraction_two_thirds' => ['2/3', '삼분의 이', 'two thirds'],
        'fraction_three_quarters' => ['3/4', '사분의 삼', 'three quarters'],

        // 기하학
        'triangle' => ['삼각형', 'triangle', '세 각', '세각'],
        'square' => ['정사각형', 'square', '사각형', '네모'],
        'pentagon' => ['오각형', 'pentagon', '다섯 각'],
        'hexagon' => ['육각형', 'hexagon', '여섯 각'],
        'circle' => ['원', 'circle', '둥근']
    ];

    // 키워드 매칭 (우선순위 순)
    foreach ($keyword_map as $concept => $keywords) {
        foreach ($keywords as $keyword) {
            if (mb_strpos($text, $keyword, 0, 'UTF-8') !== false) {
                return $concept;
            }
        }
    }

    // 기본값 (원)
    return 'circle';
}

/**
 * 형상 데이터 포맷팅
 */
function format_shape_data($shape) {
    if (!$shape) {
        return null;
    }

    return [
        'id' => $shape->id,
        'name' => $shape->concept_name,
        'category' => $shape->concept_category,
        'shape_data' => json_decode($shape->shape_data),
        'colors' => [
            'primary' => $shape->color_primary,
            'secondary' => $shape->color_secondary
        ],
        'description' => $shape->description
    ];
}

/**
 * 전환 데이터 포맷팅
 */
function format_transition_data($transition) {
    if (!$transition) {
        return null;
    }

    return [
        'type' => $transition->transition_type,
        'duration' => $transition->duration_ms,
        'easing' => $transition->easing_function,
        'keyframes' => $transition->keyframes ? json_decode($transition->keyframes) : []
    ];
}

/**
 * 기본 전환 생성
 */
function create_default_transition($from_id, $to_id) {
    $transition = new stdClass();
    $transition->from_concept_id = $from_id;
    $transition->to_concept_id = $to_id;
    $transition->transition_type = 'morph';
    $transition->duration_ms = 2000;
    $transition->easing_function = 'ease-in-out';
    $transition->keyframes = null;

    return $transition;
}

/**
 * 형상 애니메이션 이벤트 로그
 */
function log_shape_event($userid, $courseid, $event_type, $from_concept = null, $to_concept = null, $duration = null) {
    global $DB;

    $event = new stdClass();
    $event->user_id = $userid;
    $event->course_id = $courseid;
    $event->event_type = $event_type;
    $event->from_concept = $from_concept;
    $event->to_concept = $to_concept;
    $event->duration_ms = $duration;
    $event->metadata = null;

    try {
        $DB->insert_record('shape_morph_events', $event);
        shape_morph_log("Event logged: {$event_type}");
    } catch (Exception $e) {
        shape_morph_log("Failed to log event: " . $e->getMessage(), 'ERROR');
    }
}
