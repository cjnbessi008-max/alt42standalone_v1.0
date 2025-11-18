<?php
// This file is part of Moodle - http://moodle.org/
/**
 * Recommendation API
 * 추천 시스템 REST API 엔드포인트
 *
 * @package    qtype_integral
 * @copyright  2025 Alt42 Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../../../../config.php');
require_once($CFG->dirroot . '/question/type/integral/classes/recommendation_engine.php');

use qtype_integral\recommendation_engine;

// CORS 헤더
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
    // 요청 파라미터
    $action = optional_param('action', '', PARAM_ALPHA);
    $student_id = optional_param('student_id', $USER->id, PARAM_INT);
    $module_id = optional_param('module_id', '', PARAM_TEXT);

    $response = array(
        'success' => false,
        'data' => null,
        'error' => null,
        'timestamp' => time()
    );

    // 권한 확인: 본인 또는 교사만
    if ($student_id != $USER->id) {
        require_capability('moodle/course:viewhiddenactivities', context_system::instance());
    }

    switch ($action) {

        // ============================================================
        // 학생 성과 분석
        // ============================================================
        case 'analyze_performance':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $engine = new recommendation_engine($student_id, $module_id);
            $analysis = $engine->analyze_student_performance();

            $response['success'] = true;
            $response['data'] = $analysis;
            break;

        // ============================================================
        // 학습 프로필 조회
        // ============================================================
        case 'get_profile':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $engine = new recommendation_engine($student_id, $module_id);
            $profile = $engine->get_profile();

            // JSON 필드 디코딩
            $profile_data = array(
                'student_id' => $profile->student_id,
                'module_id' => $profile->module_id,
                'overall_performance_score' => floatval($profile->overall_performance_score),
                'learning_speed' => $profile->learning_speed,
                'consistency_score' => floatval($profile->consistency_score),
                'difficulty_levels' => array(
                    1 => floatval($profile->difficulty_1_success_rate),
                    2 => floatval($profile->difficulty_2_success_rate),
                    3 => floatval($profile->difficulty_3_success_rate),
                    4 => floatval($profile->difficulty_4_success_rate),
                    5 => floatval($profile->difficulty_5_success_rate)
                ),
                'current_difficulty_level' => intval($profile->current_difficulty_level),
                'recommended_difficulty_level' => intval($profile->recommended_difficulty_level),
                'concept_mastery' => json_decode($profile->concept_mastery, true),
                'weak_concepts' => json_decode($profile->weak_concepts, true),
                'strong_concepts' => json_decode($profile->strong_concepts, true),
                'avg_time_per_problem' => intval($profile->avg_time_per_problem),
                'recommendation_acceptance_rate' => floatval($profile->recommendation_acceptance_rate),
                'target_difficulty_level' => intval($profile->target_difficulty_level)
            );

            $response['success'] = true;
            $response['data'] = $profile_data;
            break;

        // ============================================================
        // 다음 문제 추천
        // ============================================================
        case 'get_recommendations':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $rec_type = optional_param('type', 'mixed', PARAM_ALPHA);
            $count = optional_param('count', 3, PARAM_INT);

            $engine = new recommendation_engine($student_id, $module_id);
            $recommendations = $engine->recommend_next_problems($rec_type, $count);

            $response['success'] = true;
            $response['data'] = array(
                'recommendations' => $recommendations,
                'total_count' => count($recommendations),
                'recommendation_type' => $rec_type
            );
            break;

        // ============================================================
        // 추천 수락
        // ============================================================
        case 'accept_recommendation':
            $history_id = required_param('history_id', PARAM_INT);

            $engine = new recommendation_engine($student_id, '');
            $success = $engine->accept_recommendation($history_id);

            if ($success) {
                $response['success'] = true;
                $response['data'] = array('accepted' => true);
            } else {
                throw new Exception('Failed to accept recommendation');
            }
            break;

        // ============================================================
        // 학습 경로 생성
        // ============================================================
        case 'create_learning_path':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $target_difficulty = optional_param('target_difficulty', null, PARAM_INT);
            $problem_count = optional_param('problem_count', 10, PARAM_INT);

            $engine = new recommendation_engine($student_id, $module_id);
            $path_id = $engine->create_learning_path($target_difficulty, $problem_count);

            if ($path_id) {
                $response['success'] = true;
                $response['data'] = array(
                    'learning_path_id' => $path_id,
                    'target_difficulty' => $target_difficulty,
                    'total_problems' => $problem_count
                );
            } else {
                throw new Exception('Failed to create learning path');
            }
            break;

        // ============================================================
        // 학습 경로 조회
        // ============================================================
        case 'get_learning_path':
            $path_id = required_param('path_id', PARAM_INT);

            $path = $DB->get_record('learning_path', array('id' => $path_id));

            if (!$path) {
                throw new Exception('Learning path not found');
            }

            // 권한 확인
            if ($path->student_id != $student_id && $student_id != $USER->id) {
                throw new Exception('Access denied');
            }

            $path_data = array(
                'id' => $path->id,
                'path_name' => $path->path_name,
                'path_type' => $path->path_type,
                'problem_sequence' => json_decode($path->problem_sequence, true),
                'current_position' => intval($path->current_position),
                'total_problems' => intval($path->total_problems),
                'problems_completed' => intval($path->problems_completed),
                'success_rate' => floatval($path->success_rate),
                'estimated_completion_time' => intval($path->estimated_completion_time),
                'is_adaptive' => (bool)$path->is_adaptive,
                'learning_goal' => $path->learning_goal,
                'status' => $path->status,
                'created_at' => $path->created_at
            );

            $response['success'] = true;
            $response['data'] = $path_data;
            break;

        // ============================================================
        // 추천 이력 조회
        // ============================================================
        case 'get_recommendation_history':
            $limit = optional_param('limit', 10, PARAM_INT);

            $sql = "SELECT h.*, p.problem_type, d.problem_title
                    FROM {recommendation_history} h
                    LEFT JOIN {integral_problems} p ON h.problem_id = p.id
                    LEFT JOIN {integral_digest} d ON p.digest_id = d.id
                    WHERE h.student_id = ?
                    ORDER BY h.recommended_at DESC
                    LIMIT ?";

            $history = $DB->get_records_sql($sql, array($student_id, $limit));

            $history_data = array();
            foreach ($history as $record) {
                $history_data[] = array(
                    'id' => $record->id,
                    'problem_id' => $record->problem_id,
                    'problem_title' => $record->problem_title,
                    'recommendation_type' => $record->recommendation_type,
                    'recommendation_reason' => $record->recommendation_reason,
                    'recommendation_score' => floatval($record->recommendation_score),
                    'problem_difficulty' => intval($record->problem_difficulty),
                    'expected_success_rate' => floatval($record->expected_success_rate),
                    'was_accepted' => (bool)$record->was_accepted,
                    'was_attempted' => (bool)$record->was_attempted,
                    'was_successful' => $record->was_successful !== null ? (bool)$record->was_successful : null,
                    'recommended_at' => $record->recommended_at
                );
            }

            $response['success'] = true;
            $response['data'] = array(
                'history' => $history_data,
                'total_count' => count($history_data)
            );
            break;

        // ============================================================
        // 추천 피드백 제출
        // ============================================================
        case 'submit_feedback':
            $history_id = required_param('history_id', PARAM_INT);
            $feedback_data = json_decode(file_get_contents('php://input'), true);

            if (empty($feedback_data)) {
                throw new Exception('feedback_data is required');
            }

            $feedback = new stdClass();
            $feedback->recommendation_history_id = $history_id;
            $feedback->student_id = $student_id;
            $feedback->feedback_type = $feedback_data['feedback_type'];
            $feedback->rating = $feedback_data['rating'] ?? null;
            $feedback->difficulty_perception = $feedback_data['difficulty_perception'] ?? null;
            $feedback->comment = $feedback_data['comment'] ?? null;
            $feedback->would_like_similar = $feedback_data['would_like_similar'] ?? null;
            $feedback->created_at = time();

            $feedback_id = $DB->insert_record('recommendation_feedback', $feedback);

            $response['success'] = true;
            $response['data'] = array('feedback_id' => $feedback_id);
            break;

        // ============================================================
        // 통계 및 인사이트
        // ============================================================
        case 'get_insights':
            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $engine = new recommendation_engine($student_id, $module_id);
            $profile = $engine->get_profile();
            $analysis = $engine->analyze_student_performance();

            // 학습 인사이트 생성
            $insights = array(
                'performance_trend' => $this->calculate_performance_trend($student_id, $module_id),
                'strong_areas' => json_decode($profile->strong_concepts, true),
                'areas_to_improve' => json_decode($profile->weak_concepts, true),
                'learning_recommendations' => $this->generate_learning_recommendations($profile, $analysis),
                'time_management' => $this->analyze_time_management($profile),
                'consistency_analysis' => $this->analyze_consistency_detailed($student_id, $module_id)
            );

            $response['success'] = true;
            $response['data'] = $insights;
            break;

        // ============================================================
        // 성과 예측
        // ============================================================
        case 'predict_performance':
            $problem_id = required_param('problem_id', PARAM_TEXT);

            if (empty($module_id)) {
                throw new Exception('module_id is required');
            }

            $engine = new recommendation_engine($student_id, $module_id);
            $problem = $DB->get_record('integral_problems', array('id' => $problem_id));

            if (!$problem) {
                throw new Exception('Problem not found');
            }

            $prediction = array(
                'problem_id' => $problem_id,
                'predicted_success_rate' => $engine->predict_success_rate($problem),
                'estimated_time_minutes' => $this->estimate_problem_time($student_id, $problem),
                'difficulty_match' => $this->assess_difficulty_match($engine->get_profile(), $problem),
                'confidence' => 75.0
            );

            $response['success'] = true;
            $response['data'] = $prediction;
            break;

        // ============================================================
        // API 상태
        // ============================================================
        case 'status':
            $response['success'] = true;
            $response['data'] = array(
                'api_version' => '1.0.0',
                'recommendation_engine_version' => recommendation_engine::ALGORITHM_VERSION,
                'status' => 'operational',
                'features' => array(
                    'performance_analysis' => true,
                    'difficulty_based_recommendation' => true,
                    'concept_based_recommendation' => true,
                    'learning_path_generation' => true,
                    'adaptive_learning' => true,
                    'performance_prediction' => true
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
        'code' => $e->getCode()
    );
    http_response_code(400);
}

// JSON 응답 출력
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;

// ============================================================================
// 헬퍼 함수들
// ============================================================================

/**
 * 성과 추세 계산
 */
function calculate_performance_trend($student_id, $module_id) {
    global $DB;

    $sql = "SELECT DATE(FROM_UNIXTIME(attempted_at)) as date,
                   AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as success_rate
            FROM {student_attempts} a
            JOIN {integral_problems} p ON a.problem_id = p.id
            WHERE a.student_id = ? AND p.module_id = ?
            GROUP BY DATE(FROM_UNIXTIME(attempted_at))
            ORDER BY date ASC
            LIMIT 30";

    $records = $DB->get_records_sql($sql, array($student_id, $module_id));

    $trend_data = array();
    foreach ($records as $record) {
        $trend_data[] = array(
            'date' => $record->date,
            'success_rate' => floatval($record->success_rate)
        );
    }

    // 추세 방향 계산
    $trend_direction = 'stable';
    if (count($trend_data) >= 5) {
        $recent_avg = array_sum(array_column(array_slice($trend_data, -5), 'success_rate')) / 5;
        $older_avg = array_sum(array_column(array_slice($trend_data, 0, 5), 'success_rate')) / 5;

        if ($recent_avg > $older_avg + 10) {
            $trend_direction = 'improving';
        } else if ($recent_avg < $older_avg - 10) {
            $trend_direction = 'declining';
        }
    }

    return array(
        'data' => $trend_data,
        'direction' => $trend_direction
    );
}

/**
 * 학습 권장사항 생성
 */
function generate_learning_recommendations($profile, $analysis) {
    $recommendations = array();

    // 성과 기반 권장사항
    if ($profile->overall_performance_score < 60) {
        $recommendations[] = array(
            'type' => 'practice',
            'priority' => 'high',
            'message' => '기초를 다지기 위해 현재 레벨에서 더 많은 연습이 필요합니다.',
            'action' => '난이도 ' . $profile->current_difficulty_level . ' 문제를 5개 이상 풀어보세요.'
        );
    }

    // 약점 개념 권장사항
    $weak_concepts = json_decode($profile->weak_concepts, true);
    if (!empty($weak_concepts)) {
        $recommendations[] = array(
            'type' => 'concept_review',
            'priority' => 'high',
            'message' => '다음 개념을 복습하세요: ' . implode(', ', $weak_concepts),
            'action' => '약점 개념 보강 문제를 우선적으로 풀어보세요.'
        );
    }

    // 학습 속도 기반 권장사항
    if ($profile->learning_speed === 'fast' && $profile->overall_performance_score >= 80) {
        $recommendations[] = array(
            'type' => 'challenge',
            'priority' => 'medium',
            'message' => '빠른 학습 속도를 보이고 있습니다!',
            'action' => '더 높은 난이도의 문제에 도전해보세요.'
        );
    }

    // 일관성 권장사항
    if ($profile->consistency_score < 50) {
        $recommendations[] = array(
            'type' => 'consistency',
            'priority' => 'medium',
            'message' => '성적이 불안정합니다. 규칙적인 학습이 도움이 됩니다.',
            'action' => '매일 2-3문제씩 꾸준히 풀어보세요.'
        );
    }

    return $recommendations;
}

/**
 * 시간 관리 분석
 */
function analyze_time_management($profile) {
    $avg_time_minutes = round($profile->avg_time_per_problem / 60);

    $feedback = '';
    $efficiency = 'good';

    if ($avg_time_minutes < 5) {
        $feedback = '너무 빠르게 푸는 경향이 있습니다. 정확도를 위해 검산하는 습관을 들이세요.';
        $efficiency = 'too_fast';
    } else if ($avg_time_minutes > 15) {
        $feedback = '시간이 많이 소요되고 있습니다. 기본 공식을 더 익혀보세요.';
        $efficiency = 'too_slow';
    } else {
        $feedback = '적절한 속도로 문제를 풀고 있습니다.';
        $efficiency = 'good';
    }

    return array(
        'avg_time_minutes' => $avg_time_minutes,
        'efficiency' => $efficiency,
        'feedback' => $feedback
    );
}

/**
 * 상세 일관성 분석
 */
function analyze_consistency_detailed($student_id, $module_id) {
    global $DB;

    $sql = "SELECT is_correct, attempted_at
            FROM {student_attempts} a
            JOIN {integral_problems} p ON a.problem_id = p.id
            WHERE a.student_id = ? AND p.module_id = ?
            ORDER BY attempted_at DESC
            LIMIT 20";

    $attempts = $DB->get_records_sql($sql, array($student_id, $module_id));

    if (count($attempts) < 5) {
        return array(
            'status' => 'insufficient_data',
            'message' => '일관성 분석을 위한 데이터가 부족합니다.'
        );
    }

    // 연속 성공/실패 패턴 찾기
    $streak_correct = 0;
    $streak_incorrect = 0;
    $max_streak_correct = 0;
    $max_streak_incorrect = 0;

    foreach ($attempts as $attempt) {
        if ($attempt->is_correct) {
            $streak_correct++;
            $streak_incorrect = 0;
            $max_streak_correct = max($max_streak_correct, $streak_correct);
        } else {
            $streak_incorrect++;
            $streak_correct = 0;
            $max_streak_incorrect = max($max_streak_incorrect, $streak_incorrect);
        }
    }

    $pattern = 'variable';
    if ($max_streak_correct >= 5) {
        $pattern = 'consistently_good';
    } else if ($max_streak_incorrect >= 3) {
        $pattern = 'struggling';
    }

    return array(
        'pattern' => $pattern,
        'max_correct_streak' => $max_streak_correct,
        'max_incorrect_streak' => $max_streak_incorrect,
        'recent_attempts' => count($attempts)
    );
}

/**
 * 문제 소요 시간 추정
 */
function estimate_problem_time($student_id, $problem) {
    global $DB;

    // 유사한 난이도의 과거 기록
    $sql = "SELECT AVG(time_spent_seconds) as avg_time
            FROM {student_attempts} a
            JOIN {integral_problems} p ON a.problem_id = p.id
            WHERE a.student_id = ? AND p.difficulty_level = ?";

    $result = $DB->get_record_sql($sql, array($student_id, $problem->difficulty_level));

    if ($result && $result->avg_time > 0) {
        return round($result->avg_time / 60);
    }

    // 기본값: 난이도 * 3분
    return $problem->difficulty_level * 3;
}

/**
 * 난이도 매칭 평가
 */
function assess_difficulty_match($profile, $problem) {
    $current_level = $profile->current_difficulty_level;
    $problem_level = $problem->difficulty_level;

    $diff = $problem_level - $current_level;

    if ($diff === 0) {
        return array(
            'match' => 'perfect',
            'message' => '현재 레벨에 정확히 맞는 문제입니다.'
        );
    } else if ($diff === 1) {
        return array(
            'match' => 'slightly_challenging',
            'message' => '적당히 도전적인 문제입니다.'
        );
    } else if ($diff > 1) {
        return array(
            'match' => 'too_hard',
            'message' => '현재 레벨보다 어려울 수 있습니다.'
        );
    } else {
        return array(
            'match' => 'too_easy',
            'message' => '현재 레벨보다 쉬운 문제입니다.'
        );
    }
}
