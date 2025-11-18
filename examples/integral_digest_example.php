<?php
/**
 * Integral Digest 사용 예제
 *
 * 이 파일은 Integral Digest 시스템을 사용하는 방법을 보여줍니다.
 *
 * @package Alt42 Education System
 * @copyright 2025
 */

require_once(__DIR__ . '/../moodle/config.php');
require_once($CFG->dirroot . '/question/type/integral/classes/integral_digest.php');
require_once($CFG->dirroot . '/question/type/integral/lib.php');

use qtype_integral\integral_digest;

// 예제 실행을 위한 헤더
echo "=== Integral Digest 사용 예제 ===\n\n";

// ============================================================================
// 예제 1: 단일 문제 다이제스트 생성
// ============================================================================

echo "예제 1: 단일 문제 다이제스트 생성\n";
echo str_repeat("-", 50) . "\n";

// 문제 데이터 정의
$problem_data_1 = array(
    'problem_id' => uniqid('problem_'),
    'module_id' => uniqid('module_'),
    'title' => '다항식의 정적분',
    'type' => 'definite_integral',
    'difficulty' => 2,
    'integrand' => 'x^2 + 2x + 1',
    'lower_bound' => '0',
    'upper_bound' => '2',
    'variable' => 'x',
    'correct_answer' => '26/3',
    'visual_type' => 'graph',
    'has_animation' => false
);

// 다이제스트 생성
$digest = new integral_digest();
$digest_id_1 = $digest->create_digest($problem_data_1);

if ($digest_id_1) {
    echo "✓ 다이제스트 생성 성공! (ID: {$digest_id_1})\n";

    // 생성된 다이제스트 조회
    $digest = new integral_digest($problem_data_1['problem_id']);
    $summary = $digest->get_digest('summary');

    echo "\n문제 요약:\n";
    echo "  제목: {$summary['title']}\n";
    echo "  유형: {$summary['type']}\n";
    echo "  난이도: {$summary['difficulty']}점\n";
    echo "  수식: {$summary['expression']}\n";
    echo "  정답: {$summary['answer']}\n";
    echo "  예상 시간: {$summary['time_estimate']}분\n";
} else {
    echo "✗ 다이제스트 생성 실패\n";
}

echo "\n\n";

// ============================================================================
// 예제 2: 모바일 앱용 포맷으로 다이제스트 조회
// ============================================================================

echo "예제 2: 모바일 앱용 포맷으로 다이제스트 조회\n";
echo str_repeat("-", 50) . "\n";

if ($digest_id_1) {
    $digest = new integral_digest($problem_data_1['problem_id']);
    $mobile_data = $digest->get_digest('mobile');

    echo "모바일 다이제스트 구조:\n";
    echo "  - 문제 ID: {$mobile_data['problem_id']}\n";
    echo "  - 제목: {$mobile_data['title']}\n";
    echo "\n";

    echo "개요 섹션:\n";
    echo "  - 유형: {$mobile_data['overview']['type']}\n";
    echo "  - 난이도: {$mobile_data['overview']['difficulty']['stars']}\n";
    echo "  - 예상 시간: {$mobile_data['overview']['time_estimate']}\n";
    echo "  - 개념: " . substr($mobile_data['overview']['concept'], 0, 50) . "...\n";
    echo "\n";

    echo "수학적 표현:\n";
    echo "  - 피적분함수: {$mobile_data['mathematical_expression']['integrand']}\n";
    echo "  - 구간: [{$mobile_data['mathematical_expression']['bounds']['lower']}, ";
    echo "{$mobile_data['mathematical_expression']['bounds']['upper']}]\n";
    echo "  - LaTeX: {$mobile_data['mathematical_expression']['latex']}\n";
    echo "\n";

    echo "핵심 개념:\n";
    foreach ($mobile_data['key_concepts'] as $concept) {
        echo "  • {$concept}\n";
    }
    echo "\n";

    echo "해법 단계 수: " . count($mobile_data['solution_digest']['steps']) . "단계\n";
    echo "최종 정답: {$mobile_data['solution_digest']['final_answer']}\n";
}

echo "\n\n";

// ============================================================================
// 예제 3: 배치로 여러 문제 다이제스트 생성
// ============================================================================

echo "예제 3: 배치로 여러 문제 다이제스트 생성\n";
echo str_repeat("-", 50) . "\n";

$problems_batch = array(
    array(
        'problem_id' => uniqid('problem_'),
        'module_id' => uniqid('module_'),
        'title' => '기본 적분 1',
        'type' => 'indefinite_integral',
        'difficulty' => 1,
        'integrand' => 'x',
        'correct_answer' => 'x^2/2 + C'
    ),
    array(
        'problem_id' => uniqid('problem_'),
        'module_id' => uniqid('module_'),
        'title' => '기본 적분 2',
        'type' => 'definite_integral',
        'difficulty' => 1,
        'integrand' => 'x^2',
        'lower_bound' => '0',
        'upper_bound' => '2',
        'correct_answer' => '8/3'
    ),
    array(
        'problem_id' => uniqid('problem_'),
        'module_id' => uniqid('module_'),
        'title' => '삼각함수의 적분',
        'type' => 'definite_integral',
        'difficulty' => 3,
        'integrand' => 'sin(x)',
        'lower_bound' => '0',
        'upper_bound' => 'pi',
        'correct_answer' => '2'
    )
);

$digest_ids = integral_digest::batch_create_digests($problems_batch);

echo "배치 생성 결과:\n";
echo "  생성된 다이제스트 수: " . count($digest_ids) . "개\n";
echo "  다이제스트 ID들: " . implode(', ', $digest_ids) . "\n";

echo "\n\n";

// ============================================================================
// 예제 4: 학생 답안 제출 및 통계 업데이트
// ============================================================================

echo "예제 4: 학생 답안 제출 및 통계 업데이트\n";
echo str_repeat("-", 50) . "\n";

if ($digest_id_1) {
    // 학생 ID (실제로는 Moodle 사용자 ID)
    $student_id = 12345;

    // 답안 데이터
    $attempt_data = array(
        'answer' => '8.667',
        'is_correct' => true,
        'time_spent' => 480,  // 초 단위 (8분)
        'confidence_level' => 4,
        'solution_path' => array(
            array('step' => 1, 'action' => '부정적분 구하기'),
            array('step' => 2, 'action' => '상한 평가'),
            array('step' => 3, 'action' => '하한 평가'),
            array('step' => 4, 'action' => '차이 계산')
        ),
        'feedback_shown' => array('hint_1')
    );

    // 답안 기록
    $success = qtype_integral_record_student_submission(
        $student_id,
        $problem_data_1['problem_id'],
        $attempt_data
    );

    if ($success) {
        echo "✓ 학생 답안 기록 성공\n";
        echo "  학생 ID: {$student_id}\n";
        echo "  제출 답안: {$attempt_data['answer']}\n";
        echo "  정답 여부: " . ($attempt_data['is_correct'] ? '정답' : '오답') . "\n";
        echo "  소요 시간: " . ($attempt_data['time_spent'] / 60) . "분\n";
        echo "  자신감 수준: {$attempt_data['confidence_level']}/5\n";

        // 업데이트된 통계 조회
        $digest = new integral_digest($problem_data_1['problem_id']);
        $stats_data = $digest->get_digest('detailed');

        echo "\n업데이트된 통계:\n";
        echo "  평균 시도 횟수: {$stats_data['statistics']['avg_attempts']}\n";
        echo "  정답률: {$stats_data['statistics']['success_rate']}%\n";
        echo "  평균 소요 시간: {$stats_data['statistics']['avg_time_seconds']}초\n";
        echo "  총 시도 횟수: {$stats_data['statistics']['total_attempts']}\n";
    } else {
        echo "✗ 답안 기록 실패\n";
    }
}

echo "\n\n";

// ============================================================================
// 예제 5: 모듈의 모든 문제 다이제스트 조회
// ============================================================================

echo "예제 5: 모듈의 모든 문제 다이제스트 조회\n";
echo str_repeat("-", 50) . "\n";

if (!empty($problems_batch)) {
    $module_id = $problems_batch[0]['module_id'];

    $module_digests = integral_digest::get_module_digests($module_id, 'summary');

    echo "모듈 ID: {$module_id}\n";
    echo "문제 수: " . count($module_digests) . "개\n\n";

    foreach ($module_digests as $idx => $digest_summary) {
        echo "문제 " . ($idx + 1) . ":\n";
        echo "  제목: {$digest_summary['title']}\n";
        echo "  유형: {$digest_summary['type']}\n";
        echo "  난이도: {$digest_summary['difficulty']}점\n";
        echo "  예상 시간: {$digest_summary['time_estimate']}분\n";
        echo "\n";
    }
}

echo "\n";

// ============================================================================
// 예제 6: AI 파이프라인에서 문제 배치 생성
// ============================================================================

echo "예제 6: AI 파이프라인에서 문제 배치 생성\n";
echo str_repeat("-", 50) . "\n";

// AI가 생성한 문제들 (시뮬레이션)
$ai_generated_problems = array(
    array(
        'id' => uniqid('ai_problem_'),
        'title' => 'AI 생성 문제 1: 거듭제곱 함수',
        'type' => 'definite_integral',
        'difficulty' => 2,
        'integrand' => 'x^3',
        'lower_bound' => '1',
        'upper_bound' => '3',
        'correct_answer' => '20',
        'solution_steps' => array(
            array('step' => 1, 'action' => 'F(x) = x^4/4'),
            array('step' => 2, 'action' => 'F(3) = 81/4'),
            array('step' => 3, 'action' => 'F(1) = 1/4'),
            array('step' => 4, 'action' => '81/4 - 1/4 = 20')
        ),
        'input_format' => 'numeric_answer',
        'tolerance' => 0.01
    ),
    array(
        'id' => uniqid('ai_problem_'),
        'title' => 'AI 생성 문제 2: 지수함수',
        'type' => 'definite_integral',
        'difficulty' => 3,
        'integrand' => 'e^x',
        'lower_bound' => '0',
        'upper_bound' => '1',
        'correct_answer' => 'e - 1',
        'solution_steps' => array(
            array('step' => 1, 'action' => 'F(x) = e^x'),
            array('step' => 2, 'action' => 'F(1) = e'),
            array('step' => 3, 'action' => 'F(0) = 1'),
            array('step' => 4, 'action' => 'e - 1')
        ),
        'input_format' => 'symbolic_entry',
        'tolerance' => 0.001
    )
);

$ai_module_id = uniqid('ai_module_');

$results = qtype_integral_batch_create_from_ai_pipeline($ai_generated_problems, $ai_module_id);

echo "AI 파이프라인 배치 생성 결과:\n";
echo "  성공: " . count($results['success']) . "개\n";
echo "  실패: " . count($results['failed']) . "개\n";
echo "  생성된 다이제스트 ID: " . count($results['digest_ids']) . "개\n";

if (!empty($results['success'])) {
    echo "\n성공한 문제 ID들:\n";
    foreach ($results['success'] as $problem_id) {
        echo "  • {$problem_id}\n";
    }
}

if (!empty($results['failed'])) {
    echo "\n실패한 문제들:\n";
    foreach ($results['failed'] as $failure) {
        echo "  • 오류: {$failure['error']}\n";
    }
}

echo "\n\n";

// ============================================================================
// 예제 7: 답안 검증
// ============================================================================

echo "예제 7: 답안 검증\n";
echo str_repeat("-", 50) . "\n";

// 테스트 케이스들
$test_cases = array(
    array('submitted' => '8.667', 'correct' => '8.667', 'tolerance' => 0.001),
    array('submitted' => '8.66', 'correct' => '8.667', 'tolerance' => 0.01),
    array('submitted' => '26/3', 'correct' => '26/3', 'tolerance' => 0.001),
    array('submitted' => 'x^2/2 + C', 'correct' => 'x^2/2 + C', 'tolerance' => 0.001),
);

foreach ($test_cases as $idx => $test) {
    $result = qtype_integral_validate_answer(
        $test['submitted'],
        $test['correct'],
        $test['tolerance']
    );

    echo "테스트 케이스 " . ($idx + 1) . ":\n";
    echo "  제출 답안: {$test['submitted']}\n";
    echo "  정답: {$test['correct']}\n";
    echo "  검증 방법: {$result['method']}\n";
    echo "  결과: " . ($result['is_correct'] ? '✓ 정답' : '✗ 오답') . "\n";
    echo "  피드백: {$result['feedback']}\n";
    echo "\n";
}

echo "\n";

// ============================================================================
// 예제 8: 학생 진행 상황 조회
// ============================================================================

echo "예제 8: 학생 진행 상황 조회\n";
echo str_repeat("-", 50) . "\n";

if (!empty($ai_module_id)) {
    $student_id = 12345;

    $progress = qtype_integral_get_student_module_progress($student_id, $ai_module_id);

    echo "학생 ID: {$student_id}\n";
    echo "모듈 ID: {$ai_module_id}\n\n";

    echo "진행 상황:\n";
    echo "  전체 문제 수: {$progress['total']}개\n";
    echo "  완료: {$progress['completed']}개\n";
    echo "  진행 중: {$progress['in_progress']}개\n";
    echo "  미시작: {$progress['not_started']}개\n";
    echo "  진행률: {$progress['progress_percentage']}%\n";
    echo "  총 소요 시간: " . round($progress['total_time_seconds'] / 60) . "분\n";
    echo "  문제당 평균 시간: " . round($progress['avg_time_per_problem'] / 60) . "분\n";
}

echo "\n\n";

// ============================================================================
// 예제 9: 모바일 앱 데이터 가져오기
// ============================================================================

echo "예제 9: 모바일 앱 초기화 데이터\n";
echo str_repeat("-", 50) . "\n";

if ($digest_id_1) {
    $student_id = 12345;

    $mobile_app_data = qtype_integral_get_mobile_app_data($student_id, $problem_data_1['problem_id']);

    echo "모바일 앱 데이터 구조:\n";
    echo "  - 다이제스트: " . (isset($mobile_app_data['digest']) ? '✓' : '✗') . "\n";
    echo "  - 진행 상황: " . (isset($mobile_app_data['progress']) ? '✓' : '✗') . "\n";
    echo "  - 최근 답안: " . count($mobile_app_data['recent_attempts']) . "개\n";
    echo "  - API 엔드포인트: {$mobile_app_data['api_endpoint']}\n";

    echo "\n진행 상황 상세:\n";
    if (is_object($mobile_app_data['progress'])) {
        echo "  상태: {$mobile_app_data['progress']->status}\n";
        echo "  시도 횟수: {$mobile_app_data['progress']->attempts_count}\n";
        echo "  소요 시간: " . round($mobile_app_data['progress']->time_spent_seconds / 60) . "분\n";
    } else {
        echo "  상태: {$mobile_app_data['progress']['status']}\n";
    }
}

echo "\n\n";

// ============================================================================
// 완료 메시지
// ============================================================================

echo "=== 모든 예제 실행 완료 ===\n\n";

echo "다음 단계:\n";
echo "1. 웹 브라우저에서 모바일 앱 UI 확인\n";
echo "2. REST API 엔드포인트 테스트\n";
echo "3. Moodle LMS와 통합 테스트\n";
echo "4. 학생들에게 실제 문제 배포\n\n";

echo "더 많은 정보는 docs/INTEGRAL_DIGEST_README.md 를 참조하세요.\n";
