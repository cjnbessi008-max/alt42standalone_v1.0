<?php
/**
 * Analyze Patterns API
 * 집중도 분석 실행 엔드포인트
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/analyzer.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $action = isset($input['action']) ? $input['action'] : null;
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : null;
    $courseId = isset($input['course_id']) ? (int)$input['course_id'] : null;
    $startTime = isset($input['start_time']) ? (int)$input['start_time'] : strtotime('-1 day');
    $endTime = isset($input['end_time']) ? (int)$input['end_time'] : time();

    if (!$userId || !$courseId) {
        jsonResponse(['success' => false, 'error' => 'user_id와 course_id가 필요합니다.'], 400);
    }

    $analyzer = new ConcentrationAnalyzer();

    switch ($action) {
        case 'calculate_concentration':
            try {
                $results = $analyzer->analyzeConcentrationByWindows($userId, $courseId, $startTime, $endTime);

                jsonResponse([
                    'success' => true,
                    'results' => $results,
                    'count' => count($results),
                    'message' => count($results) . '개의 시간 윈도우에 대한 집중도가 계산되었습니다.'
                ]);
            } catch (Exception $e) {
                jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
            }
            break;

        case 'detect_fluctuations':
            try {
                $fluctuations = $analyzer->detectFluctuations($userId, $courseId, $startTime, $endTime);

                jsonResponse([
                    'success' => true,
                    'fluctuations' => $fluctuations,
                    'count' => count($fluctuations),
                    'message' => count($fluctuations) . '개의 변동 구간이 탐지되었습니다.'
                ]);
            } catch (Exception $e) {
                jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
            }
            break;

        case 'full_analysis':
            try {
                // 1단계: 집중도 계산
                $concentrationResults = $analyzer->analyzeConcentrationByWindows($userId, $courseId, $startTime, $endTime);

                // 2단계: 변동 탐지
                $fluctuations = $analyzer->detectFluctuations($userId, $courseId, $startTime, $endTime);

                jsonResponse([
                    'success' => true,
                    'concentration' => [
                        'results' => $concentrationResults,
                        'count' => count($concentrationResults)
                    ],
                    'fluctuations' => [
                        'results' => $fluctuations,
                        'count' => count($fluctuations)
                    ],
                    'message' => '전체 분석이 완료되었습니다.'
                ]);
            } catch (Exception $e) {
                jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
            }
            break;

        default:
            jsonResponse(['success' => false, 'error' => '올바른 action을 지정해주세요.'], 400);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'POST 메서드만 허용됩니다.'], 405);
}
