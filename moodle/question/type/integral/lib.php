<?php
// This file is part of Moodle - http://moodle.org/
/**
 * Library functions for Integral Question Type with Digest
 * Moodle 3.7 LMS 통합 라이브러리
 *
 * @package    qtype_integral
 * @copyright  2025 Alt42 Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/question/type/integral/classes/integral_digest.php');

use qtype_integral\integral_digest;

/**
 * 적분 문제가 생성될 때 자동으로 다이제스트 생성
 *
 * @param object $question Question object
 * @return bool Success
 */
function qtype_integral_create_problem_with_digest($question) {
    global $DB;

    try {
        // 문제 데이터를 다이제스트용 배열로 변환
        $problem_data = array(
            'problem_id' => $question->id,
            'module_id' => $question->category,
            'title' => $question->name,
            'type' => $question->integral_type ?? 'definite_integral',
            'difficulty' => $question->difficulty ?? 2,
            'integrand' => $question->integrand,
            'lower_bound' => $question->lower_bound ?? null,
            'upper_bound' => $question->upper_bound ?? null,
            'variable' => $question->variable ?? 'x',
            'correct_answer' => $question->answer,
            'visual_type' => $question->visual_type ?? 'graph',
            'has_animation' => $question->has_animation ?? false
        );

        // 다이제스트 생성
        $digest = new integral_digest();
        $digest_id = $digest->create_digest($problem_data);

        if ($digest_id) {
            // 문제 테이블에 digest_id 업데이트
            $DB->set_field('integral_problems', 'digest_id', $digest_id,
                array('id' => $question->id));

            return true;
        }

        return false;

    } catch (Exception $e) {
        debugging('Error creating digest for problem: ' . $e->getMessage(), DEBUG_DEVELOPER);
        return false;
    }
}

/**
 * AI 파이프라인에서 문제를 배치 생성할 때 사용
 * PRD의 World Model Reconstruction 기능과 통합
 *
 * @param array $problems Array of problem data from AI pipeline
 * @param string $module_id Module UUID
 * @return array Created problem IDs and digest IDs
 */
function qtype_integral_batch_create_from_ai_pipeline($problems, $module_id) {
    global $DB;

    $results = array(
        'success' => array(),
        'failed' => array(),
        'digest_ids' => array()
    );

    foreach ($problems as $problem) {
        $transaction = $DB->start_delegated_transaction();

        try {
            // 적분 문제 레코드 생성
            $problem_record = new stdClass();
            $problem_record->id = $problem['id'];
            $problem_record->module_id = $module_id;
            $problem_record->problem_type = $problem['type'];
            $problem_record->difficulty_level = $problem['difficulty'];
            $problem_record->integrand = $problem['integrand'];
            $problem_record->lower_bound = $problem['lower_bound'] ?? null;
            $problem_record->upper_bound = $problem['upper_bound'] ?? null;
            $problem_record->variable_of_integration = $problem['variable'] ?? 'x';
            $problem_record->correct_answer = $problem['correct_answer'];
            $problem_record->solution_steps = json_encode($problem['solution_steps'] ?? array());
            $problem_record->input_format = $problem['input_format'] ?? 'symbolic_entry';
            $problem_record->tolerance_level = $problem['tolerance'] ?? 0.001;
            $problem_record->created_at = time();

            // 문제 삽입
            $problem_id = $DB->insert_record('integral_problems', $problem_record);

            // 다이제스트 생성
            $problem_data = array(
                'problem_id' => $problem_id,
                'module_id' => $module_id,
                'title' => $problem['title'] ?? '적분 문제',
                'type' => $problem['type'],
                'difficulty' => $problem['difficulty'],
                'integrand' => $problem['integrand'],
                'lower_bound' => $problem['lower_bound'] ?? null,
                'upper_bound' => $problem['upper_bound'] ?? null,
                'variable' => $problem['variable'] ?? 'x',
                'correct_answer' => $problem['correct_answer'],
                'visual_type' => $problem['visual_type'] ?? 'graph',
                'has_animation' => $problem['has_animation'] ?? false
            );

            $digest = new integral_digest();
            $digest_id = $digest->create_digest($problem_data);

            if ($digest_id) {
                // digest_id를 문제 레코드에 업데이트
                $DB->set_field('integral_problems', 'digest_id', $digest_id,
                    array('id' => $problem_id));

                $results['success'][] = $problem_id;
                $results['digest_ids'][] = $digest_id;
            }

            $transaction->allow_commit();

        } catch (Exception $e) {
            $transaction->rollback($e);
            $results['failed'][] = array(
                'problem' => $problem,
                'error' => $e->getMessage()
            );
        }
    }

    return $results;
}

/**
 * 모듈의 문제 카운트 업데이트
 *
 * @param string $module_id Module UUID
 * @return bool Success
 */
function qtype_integral_update_module_problem_count($module_id) {
    global $DB;

    try {
        $count = $DB->count_records('integral_problems', array('module_id' => $module_id));
        $DB->set_field('integral_modules', 'problems_count', $count, array('id' => $module_id));
        return true;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * 학생의 문제 풀이 완료 시 호출
 * 통계 업데이트 및 진행 상황 추적
 *
 * @param int $student_id Student ID
 * @param string $problem_id Problem UUID
 * @param array $attempt_data Attempt data
 * @return bool Success
 */
function qtype_integral_record_student_submission($student_id, $problem_id, $attempt_data) {
    global $DB;

    $transaction = $DB->start_delegated_transaction();

    try {
        // 답안 기록
        $attempt = new stdClass();
        $attempt->id = $attempt_data['id'] ?? uniqid('attempt_');
        $attempt->student_id = $student_id;
        $attempt->problem_id = $problem_id;
        $attempt->submitted_answer = $attempt_data['answer'];
        $attempt->is_correct = $attempt_data['is_correct'];
        $attempt->confidence_level = $attempt_data['confidence_level'] ?? null;
        $attempt->solution_path_taken = json_encode($attempt_data['solution_path'] ?? array());
        $attempt->time_spent_seconds = $attempt_data['time_spent'] ?? 0;
        $attempt->attempts_count = $attempt_data['attempts_count'] ?? 1;
        $attempt->feedback_shown = json_encode($attempt_data['feedback_shown'] ?? array());
        $attempt->attempted_at = time();

        $DB->insert_record('student_attempts', $attempt);

        // 진행 상황 업데이트
        $progress = $DB->get_record('student_integral_progress',
            array('student_id' => $student_id, 'problem_id' => $problem_id));

        if ($progress) {
            // 기존 진행 상황 업데이트
            $progress->attempts_count++;
            $progress->time_spent_seconds += $attempt_data['time_spent'] ?? 0;
            $progress->last_answer = $attempt_data['answer'];
            $progress->is_correct = $attempt_data['is_correct'];

            if ($attempt_data['is_correct']) {
                $progress->status = 'completed';
                $progress->completed_at = time();
                $progress->partial_credit = 100.00;
            } else {
                $progress->status = 'in_progress';
            }

            $progress->updated_at = time();
            $DB->update_record('student_integral_progress', $progress);

        } else {
            // 새로운 진행 상황 생성
            $progress = new stdClass();
            $progress->student_id = $student_id;
            $progress->problem_id = $problem_id;

            // digest_id 조회
            $problem = $DB->get_record('integral_problems',
                array('id' => $problem_id), 'digest_id');
            $progress->digest_id = $problem->digest_id;

            $progress->status = $attempt_data['is_correct'] ? 'completed' : 'in_progress';
            $progress->current_step = 0;
            $progress->total_steps = 0;
            $progress->attempts_count = 1;
            $progress->hints_used = json_encode(array());
            $progress->time_spent_seconds = $attempt_data['time_spent'] ?? 0;
            $progress->confidence_level = $attempt_data['confidence_level'] ?? null;
            $progress->last_answer = $attempt_data['answer'];
            $progress->is_correct = $attempt_data['is_correct'];
            $progress->partial_credit = $attempt_data['is_correct'] ? 100.00 : 0.00;
            $progress->feedback_shown = json_encode(array());
            $progress->started_at = time();

            if ($attempt_data['is_correct']) {
                $progress->completed_at = time();
            }

            $progress->updated_at = time();
            $DB->insert_record('student_integral_progress', $progress);
        }

        // 다이제스트의 통계 업데이트 (integral_digest 클래스 사용)
        $digest = new integral_digest($problem_id);
        $digest->record_student_attempt($student_id, $attempt_data);

        $transaction->allow_commit();

        return true;

    } catch (Exception $e) {
        $transaction->rollback($e);
        debugging('Error recording student submission: ' . $e->getMessage(), DEBUG_DEVELOPER);
        return false;
    }
}

/**
 * 학생의 모듈 진행률 계산
 *
 * @param int $student_id Student ID
 * @param string $module_id Module UUID
 * @return array Progress data
 */
function qtype_integral_get_student_module_progress($student_id, $module_id) {
    global $DB;

    // 모듈의 모든 문제 가져오기
    $problems = $DB->get_records('integral_problems', array('module_id' => $module_id));
    $total_problems = count($problems);

    if ($total_problems === 0) {
        return array(
            'total' => 0,
            'completed' => 0,
            'in_progress' => 0,
            'not_started' => 0,
            'progress_percentage' => 0,
            'total_time_seconds' => 0
        );
    }

    $completed = 0;
    $in_progress = 0;
    $not_started = 0;
    $total_time = 0;

    foreach ($problems as $problem) {
        $progress = $DB->get_record('student_integral_progress',
            array('student_id' => $student_id, 'problem_id' => $problem->id));

        if ($progress) {
            if ($progress->status === 'completed') {
                $completed++;
            } else if ($progress->status === 'in_progress') {
                $in_progress++;
            } else {
                $not_started++;
            }
            $total_time += $progress->time_spent_seconds;
        } else {
            $not_started++;
        }
    }

    $progress_percentage = ($completed / $total_problems) * 100;

    return array(
        'total' => $total_problems,
        'completed' => $completed,
        'in_progress' => $in_progress,
        'not_started' => $not_started,
        'progress_percentage' => round($progress_percentage, 2),
        'total_time_seconds' => $total_time,
        'avg_time_per_problem' => $completed > 0 ? round($total_time / $completed) : 0
    );
}

/**
 * 모바일 앱 초기화 데이터 제공
 *
 * @param int $student_id Student ID
 * @param string $problem_id Problem UUID
 * @return array Mobile app initialization data
 */
function qtype_integral_get_mobile_app_data($student_id, $problem_id) {
    global $DB;

    // 다이제스트 가져오기
    $digest = new integral_digest($problem_id);
    $digest_data = $digest->get_digest('mobile');

    // 학생 진행 상황 가져오기
    $progress = $DB->get_record('student_integral_progress',
        array('student_id' => $student_id, 'problem_id' => $problem_id));

    // 이전 답안 기록 가져오기
    $attempts = $DB->get_records('student_attempts',
        array('student_id' => $student_id, 'problem_id' => $problem_id),
        'attempted_at DESC', '*', 0, 5); // 최근 5개

    return array(
        'digest' => $digest_data,
        'progress' => $progress ? $progress : array('status' => 'not_started'),
        'recent_attempts' => array_values($attempts),
        'api_endpoint' => get_config('qtype_integral', 'api_endpoint') ??
            '/question/type/integral/api/digest_api.php'
    );
}

/**
 * 다이제스트 뷰 생성 (모바일 최적화)
 *
 * @param int $digest_id Digest ID
 * @param string $view_type View type
 * @return int View ID
 */
function qtype_integral_create_digest_view($digest_id, $view_type = 'summary') {
    global $DB;

    $view = new stdClass();
    $view->digest_id = $digest_id;
    $view->view_type = $view_type;

    // 뷰 타입별 설정
    switch ($view_type) {
        case 'summary':
            $view->title = '문제 요약';
            $view->render_config = json_encode(array(
                'show_overview' => true,
                'show_expression' => true,
                'show_solution' => false,
                'show_statistics' => false
            ));
            $view->layout_template = 'mobile_summary';
            break;

        case 'detailed':
            $view->title = '상세 다이제스트';
            $view->render_config = json_encode(array(
                'show_overview' => true,
                'show_expression' => true,
                'show_visualization' => true,
                'show_solution' => true,
                'show_learning_guide' => true,
                'show_statistics' => true
            ));
            $view->layout_template = 'mobile_detailed';
            break;

        case 'solution':
            $view->title = '해법 상세';
            $view->render_config = json_encode(array(
                'show_solution' => true,
                'show_steps' => true,
                'show_alternatives' => true,
                'reveal_answer' => false
            ));
            $view->layout_template = 'mobile_solution';
            break;

        case 'stats':
            $view->title = '통계 분석';
            $view->render_config = json_encode(array(
                'show_statistics' => true,
                'show_performance_chart' => true,
                'show_comparison' => true
            ));
            $view->layout_template = 'mobile_stats';
            break;
    }

    // 컨텐츠 섹션 설정
    $view->content_sections = json_encode(array(
        array('section' => 'header', 'order' => 1),
        array('section' => 'overview', 'order' => 2),
        array('section' => 'content', 'order' => 3),
        array('section' => 'footer', 'order' => 4)
    ));

    // 인터랙티브 요소
    $view->interactive_elements = json_encode(array(
        'collapsible_sections' => true,
        'touch_gestures' => true,
        'swipe_navigation' => true,
        'zoom_graph' => true
    ));

    // 네비게이션 옵션
    $view->navigation_options = json_encode(array(
        'show_back_button' => true,
        'show_next_problem' => true,
        'show_hints' => true,
        'show_solution_toggle' => true
    ));

    $view->created_at = time();
    $view->updated_at = time();

    return $DB->insert_record('integral_digest_view', $view);
}

/**
 * 문제 검증 함수 - 답안이 정답인지 확인
 *
 * @param string $submitted_answer Student's submitted answer
 * @param string $correct_answer Correct answer
 * @param float $tolerance Tolerance level
 * @return array Validation result
 */
function qtype_integral_validate_answer($submitted_answer, $correct_answer, $tolerance = 0.001) {
    // 숫자인 경우
    if (is_numeric($submitted_answer) && is_numeric($correct_answer)) {
        $submitted = floatval($submitted_answer);
        $correct = floatval($correct_answer);

        $is_correct = abs($submitted - $correct) <= $tolerance;

        return array(
            'is_correct' => $is_correct,
            'method' => 'numeric',
            'difference' => abs($submitted - $correct),
            'feedback' => $is_correct ?
                '정답입니다!' :
                '오답입니다. 계산을 다시 확인해보세요.'
        );
    }

    // 문자열 비교 (심볼릭)
    $submitted_normalized = strtolower(trim($submitted_answer));
    $correct_normalized = strtolower(trim($correct_answer));

    $is_correct = $submitted_normalized === $correct_normalized;

    return array(
        'is_correct' => $is_correct,
        'method' => 'symbolic',
        'feedback' => $is_correct ?
            '정답입니다!' :
            '형식이나 답이 정확하지 않습니다.'
    );
}

/**
 * Moodle 이벤트 훅: 문제 생성 후
 */
function qtype_integral_after_question_created($event) {
    $question = $event->get_record_snapshot('question', $event->objectid);

    if ($question->qtype === 'integral') {
        qtype_integral_create_problem_with_digest($question);
    }
}

/**
 * Moodle 이벤트 훅: 문제 업데이트 후
 */
function qtype_integral_after_question_updated($event) {
    // 문제가 업데이트되면 다이제스트도 재생성
    $question = $event->get_record_snapshot('question', $event->objectid);

    if ($question->qtype === 'integral') {
        qtype_integral_create_problem_with_digest($question);
    }
}

/**
 * 플러그인 설치 시 초기화
 */
function qtype_integral_install() {
    global $DB;

    // 샘플 모듈 생성 (옵션)
    // set_config('sample_module_created', 0, 'qtype_integral');

    return true;
}

/**
 * 플러그인 언인스톨 시 정리
 */
function qtype_integral_uninstall() {
    global $DB;

    // 설정 삭제
    unset_config('api_endpoint', 'qtype_integral');

    return true;
}
