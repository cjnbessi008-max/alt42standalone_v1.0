<?php
/**
 * 추천 API 엔드포인트
 * GET /api/recommend_api.php?action=get|weakness|path
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/auth.php';
require_once __DIR__ . '/../recommendation/RecommendationEngine.php';

$pdo = getDbConnection();
$auth = new Auth($pdo);
$recommender = new RecommendationEngine($pdo);

// 인증 필수
$auth->requireAuth();
$user_id = $_SESSION['user_id'];

$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'get':
        // 일반 추천
        $count = isset($_GET['count']) ? min(10, max(1, intval($_GET['count']))) : 5;

        try {
            $recommendations = $recommender->recommendProblems($user_id, $count);

            // 클라이언트에 전송할 데이터 정리
            $result = array_map(function($rec) {
                return [
                    'problem' => $rec['problem'],
                    'score' => round($rec['score'], 4),
                    'reasons' => $rec['score_breakdown']
                ];
            }, $recommendations);

            sendJsonResponse(true, $result, '추천 문제를 가져왔습니다.');
        } catch (Exception $e) {
            error_log("Recommendation error: " . $e->getMessage());
            sendJsonResponse(false, null, '추천 중 오류가 발생했습니다.', 500);
        }
        break;

    case 'weakness':
        // 약점 보완 추천
        $count = isset($_GET['count']) ? min(10, max(1, intval($_GET['count']))) : 5;

        try {
            $problems = $recommender->recommendForWeakness($user_id, $count);
            sendJsonResponse(true, $problems, '약점 보완 문제를 가져왔습니다.');
        } catch (Exception $e) {
            error_log("Weakness recommendation error: " . $e->getMessage());
            sendJsonResponse(false, null, '추천 중 오류가 발생했습니다.', 500);
        }
        break;

    case 'path':
        // 학습 경로 생성
        $goal_level = isset($_GET['goal']) ? intval($_GET['goal']) : null;
        $sessions = isset($_GET['sessions']) ? min(20, max(5, intval($_GET['sessions']))) : 10;

        if (!$goal_level) {
            sendJsonResponse(false, null, '목표 레벨을 지정해주세요.', 400);
        }

        try {
            $path = $recommender->generateLearningPath($user_id, $goal_level, $sessions);
            sendJsonResponse(true, $path, '학습 경로가 생성되었습니다.');
        } catch (Exception $e) {
            error_log("Learning path error: " . $e->getMessage());
            sendJsonResponse(false, null, '학습 경로 생성 중 오류가 발생했습니다.', 500);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Invalid action', 400);
}
