<?php
/**
 * 문제 API 엔드포인트
 * GET /api/problem_api.php?action=submit|stats
 * POST /api/problem_api.php?action=submit
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

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'submit':
        // 답안 제출
        if ($method !== 'POST') {
            sendJsonResponse(false, null, 'Method not allowed', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        validateRequired($input, ['problem_id', 'answer', 'time_spent']);

        $problem_id = intval($input['problem_id']);
        $answer = intval($input['answer']);
        $time_spent = intval($input['time_spent']);
        $hint_used = isset($input['hint_used']) ? ($input['hint_used'] ? 1 : 0) : 0;

        try {
            $pdo->beginTransaction();

            // 문제 정보 조회
            $stmt = $pdo->prepare("SELECT id, correct_answer, problem_type, difficulty_level FROM problems WHERE id = ?");
            $stmt->execute([$problem_id]);
            $problem = $stmt->fetch();

            if (!$problem) {
                $pdo->rollBack();
                sendJsonResponse(false, null, '문제를 찾을 수 없습니다.', 404);
            }

            $is_correct = ($answer == $problem['correct_answer']);

            // 시도 횟수 계산
            $stmt = $pdo->prepare("SELECT COUNT(*) as attempts FROM responses WHERE user_id = ? AND problem_id = ?");
            $stmt->execute([$user_id, $problem_id]);
            $attempt_count = $stmt->fetch()['attempts'] + 1;

            // 응답 저장
            $stmt = $pdo->prepare("
                INSERT INTO responses (user_id, problem_id, student_answer, is_correct, attempt_number, time_spent_seconds, hint_used)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user_id, $problem_id, $answer, $is_correct ? 1 : 0, $attempt_count, $time_spent, $hint_used]);

            // 사용자 진행 상황 업데이트
            updateUserProgress($pdo, $user_id, $problem['problem_type'], $is_correct, $time_spent);

            // 추천 피드백 업데이트
            $recommender->updateRecommendationFeedback($user_id, $problem_id, true, $is_correct);

            $pdo->commit();

            // 피드백 생성
            $feedback = [
                'is_correct' => $is_correct,
                'correct_answer' => $problem['correct_answer'],
                'student_answer' => $answer,
                'attempt_number' => $attempt_count,
                'message' => $is_correct ? '정답입니다! 🎉' : '아쉽게도 틀렸습니다. 다시 도전해보세요!'
            ];

            // 업데이트된 통계 조회
            $stats = getUserStats($pdo, $user_id);

            sendJsonResponse(true, [
                'feedback' => $feedback,
                'stats' => $stats
            ], '답안이 제출되었습니다.');

        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Submit error: " . $e->getMessage());
            sendJsonResponse(false, null, '답안 제출 중 오류가 발생했습니다.', 500);
        }
        break;

    case 'stats':
        // 사용자 통계 조회
        try {
            $stats = getUserStats($pdo, $user_id);
            sendJsonResponse(true, $stats, '통계를 조회했습니다.');
        } catch (Exception $e) {
            error_log("Stats error: " . $e->getMessage());
            sendJsonResponse(false, null, '통계 조회 중 오류가 발생했습니다.', 500);
        }
        break;

    case 'history':
        // 학습 기록 조회
        $pagination = getPaginationParams();

        try {
            $stmt = $pdo->prepare("
                SELECT
                    r.id,
                    p.problem_type,
                    p.difficulty_level,
                    r.student_answer,
                    r.is_correct,
                    r.time_spent_seconds,
                    r.hint_used,
                    r.submitted_at
                FROM responses r
                JOIN problems p ON r.problem_id = p.id
                WHERE r.user_id = ?
                ORDER BY r.submitted_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$user_id, $pagination['limit'], $pagination['offset']]);
            $history = $stmt->fetchAll();

            // 전체 개수
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM responses WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $total = $stmt->fetch()['total'];

            sendJsonResponse(true, [
                'history' => $history,
                'pagination' => [
                    'page' => $pagination['page'],
                    'limit' => $pagination['limit'],
                    'total' => $total,
                    'pages' => ceil($total / $pagination['limit'])
                ]
            ], '학습 기록을 조회했습니다.');
        } catch (Exception $e) {
            error_log("History error: " . $e->getMessage());
            sendJsonResponse(false, null, '기록 조회 중 오류가 발생했습니다.', 500);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Invalid action', 400);
}

/**
 * 사용자 진행 상황 업데이트
 */
function updateUserProgress($pdo, $user_id, $problem_type, $is_correct, $time_spent) {
    // 현재 진행 상황 조회
    $stmt = $pdo->prepare("SELECT * FROM user_progress WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $progress = $stmt->fetch();

    if (!$progress) {
        return;
    }

    $new_total = $progress['total_problems'] + 1;
    $new_correct = $progress['correct_answers'] + ($is_correct ? 1 : 0);
    $new_time = $progress['total_time_seconds'] + $time_spent;

    // 정확도 계산
    $accuracy = $new_total > 0 ? ($new_correct / $new_total) : 0;

    // 레벨 조정
    $current_level = $progress['current_level'];
    if ($accuracy >= 0.8 && $new_total >= 5) {
        $current_level = min(10, $current_level + 1);
    } elseif ($accuracy < 0.4 && $new_total >= 5) {
        $current_level = max(1, $current_level - 1);
    }

    // 유형별 숙련도 업데이트
    $mastery_field = strtolower($problem_type) . '_mastery';
    $current_mastery = $progress[$mastery_field] ?? 0;
    $new_mastery = $current_mastery * 0.9 + ($is_correct ? 0.1 : 0); // 가중 평균

    $stmt = $pdo->prepare("
        UPDATE user_progress
        SET total_problems = ?,
            correct_answers = ?,
            total_time_seconds = ?,
            current_level = ?,
            $mastery_field = ?,
            experience_points = experience_points + ?
        WHERE user_id = ?
    ");

    $xp_gain = $is_correct ? 10 : 3;
    $stmt->execute([$new_total, $new_correct, $new_time, $current_level, $new_mastery, $xp_gain, $user_id]);
}

/**
 * 사용자 통계 조회
 */
function getUserStats($pdo, $user_id) {
    $stmt = $pdo->prepare("
        SELECT
            up.total_problems,
            up.correct_answers,
            up.current_level,
            up.experience_points,
            up.arithmetic_mastery,
            up.geometric_mastery,
            up.fibonacci_mastery,
            up.pattern_mastery,
            CASE WHEN up.total_problems > 0
                 THEN ROUND((up.correct_answers / up.total_problems) * 100, 2)
                 ELSE 0
            END as accuracy,
            CASE WHEN up.total_problems > 0
                 THEN ROUND(up.total_time_seconds / up.total_problems)
                 ELSE 0
            END as avg_time
        FROM user_progress up
        WHERE up.user_id = ?
    ");
    $stmt->execute([$user_id]);

    return $stmt->fetch();
}
