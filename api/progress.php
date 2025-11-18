<?php
/**
 * Hidden Length Application - Progress API
 * Endpoints for tracking student progress and attempts
 */

require_once __DIR__ . '/database.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProgress($db);
        break;

    case 'POST':
        submitAttempt($db);
        break;

    default:
        error_response('Method not allowed', 405);
}

/**
 * Get student progress
 * Query params: user_id (required), shape_id (optional)
 */
function getProgress($db) {
    if (!isset($_GET['user_id'])) {
        error_response('user_id parameter required', 400);
    }

    $user_id = intval($_GET['user_id']);
    $shape_id = isset($_GET['shape_id']) ? intval($_GET['shape_id']) : null;

    if ($shape_id) {
        // Get progress for specific shape
        $sql = "SELECT sp.*, s.title as shape_title, s.difficulty_level
                FROM student_progress sp
                LEFT JOIN shapes s ON sp.shape_id = s.id
                WHERE sp.user_id = :user_id AND sp.shape_id = :shape_id";
        $progress = $db->queryOne($sql, ['user_id' => $user_id, 'shape_id' => $shape_id]);

        if (!$progress) {
            // No progress yet, return empty state
            success_response([
                'user_id' => $user_id,
                'shape_id' => $shape_id,
                'status' => 'not_started',
                'attempts_count' => 0,
                'correct_attempts' => 0,
                'mastery_score' => 0
            ]);
        }

        success_response($progress);
    } else {
        // Get all progress for user
        $sql = "SELECT sp.*, s.title as shape_title, s.difficulty_level, s.shape_type,
                       sc.name as category_name
                FROM student_progress sp
                LEFT JOIN shapes s ON sp.shape_id = s.id
                LEFT JOIN shape_categories sc ON s.category_id = sc.id
                WHERE sp.user_id = :user_id
                ORDER BY sp.updated_at DESC";

        $progress = $db->query($sql, ['user_id' => $user_id]);

        // Calculate overall statistics
        $stats = [
            'total_shapes' => count($progress),
            'completed' => 0,
            'mastered' => 0,
            'in_progress' => 0,
            'total_attempts' => 0,
            'correct_attempts' => 0,
            'average_mastery' => 0
        ];

        $total_mastery = 0;
        foreach ($progress as $item) {
            if ($item['status'] === 'completed') $stats['completed']++;
            if ($item['status'] === 'mastered') $stats['mastered']++;
            if ($item['status'] === 'in_progress') $stats['in_progress']++;
            $stats['total_attempts'] += $item['attempts_count'];
            $stats['correct_attempts'] += $item['correct_attempts'];
            $total_mastery += floatval($item['mastery_score']);
        }

        if ($stats['total_shapes'] > 0) {
            $stats['average_mastery'] = round($total_mastery / $stats['total_shapes'], 2);
        }

        success_response([
            'progress' => $progress,
            'statistics' => $stats
        ]);
    }
}

/**
 * Submit an attempt and update progress
 * POST body: { user_id, shape_id, submitted_answer, time_spent_seconds, hint_used, light_beam_activated, interaction_data }
 */
function submitAttempt($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['user_id']) || !isset($input['shape_id']) || !isset($input['submitted_answer'])) {
        error_response('Missing required fields: user_id, shape_id, submitted_answer', 400);
    }

    $user_id = intval($input['user_id']);
    $shape_id = intval($input['shape_id']);
    $submitted_answer = floatval($input['submitted_answer']);
    $time_spent = isset($input['time_spent_seconds']) ? intval($input['time_spent_seconds']) : 0;
    $hint_used = isset($input['hint_used']) ? (bool)$input['hint_used'] : false;
    $light_beam_activated = isset($input['light_beam_activated']) ? (bool)$input['light_beam_activated'] : false;
    $interaction_data = isset($input['interaction_data']) ? json_encode($input['interaction_data']) : null;

    // Get shape correct answer
    $shape = $db->queryOne("SELECT correct_answer, explanation FROM shapes WHERE id = :id", ['id' => $shape_id]);
    if (!$shape) {
        error_response('Shape not found', 404);
    }

    $correct_answer = floatval($shape['correct_answer']);
    $tolerance = 0.01; // Allow small floating point differences
    $is_correct = abs($submitted_answer - $correct_answer) <= $tolerance;

    // Generate feedback
    $feedback = generateFeedback($is_correct, $submitted_answer, $correct_answer, $shape['explanation']);

    // Begin transaction
    $db->beginTransaction();

    try {
        // Insert attempt record
        $attempt_sql = "INSERT INTO attempts (user_id, shape_id, submitted_answer, is_correct,
                        time_spent_seconds, hint_used, light_beam_activated, interaction_data, feedback)
                        VALUES (:user_id, :shape_id, :submitted_answer, :is_correct,
                        :time_spent, :hint_used, :light_beam_activated, :interaction_data, :feedback)";

        $db->execute($attempt_sql, [
            'user_id' => $user_id,
            'shape_id' => $shape_id,
            'submitted_answer' => $submitted_answer,
            'is_correct' => $is_correct,
            'time_spent' => $time_spent,
            'hint_used' => $hint_used,
            'light_beam_activated' => $light_beam_activated,
            'interaction_data' => $interaction_data,
            'feedback' => $feedback
        ]);

        // Update or create progress record
        $progress = $db->queryOne(
            "SELECT * FROM student_progress WHERE user_id = :user_id AND shape_id = :shape_id",
            ['user_id' => $user_id, 'shape_id' => $shape_id]
        );

        if ($progress) {
            // Update existing progress
            $new_attempts = $progress['attempts_count'] + 1;
            $new_correct = $progress['correct_attempts'] + ($is_correct ? 1 : 0);
            $mastery_score = calculateMasteryScore($new_attempts, $new_correct, $hint_used, $time_spent);

            $status = determineStatus($mastery_score, $is_correct);
            $best_time = $progress['best_time_seconds'];
            if ($is_correct && ($best_time === null || $time_spent < $best_time)) {
                $best_time = $time_spent;
            }

            $update_sql = "UPDATE student_progress SET
                          attempts_count = :attempts,
                          correct_attempts = :correct,
                          mastery_score = :mastery,
                          status = :status,
                          best_time_seconds = :best_time,
                          last_attempt_at = NOW(),
                          completed_at = CASE WHEN :status IN ('completed', 'mastered') THEN NOW() ELSE completed_at END
                          WHERE user_id = :user_id AND shape_id = :shape_id";

            $db->execute($update_sql, [
                'attempts' => $new_attempts,
                'correct' => $new_correct,
                'mastery' => $mastery_score,
                'status' => $status,
                'best_time' => $best_time,
                'user_id' => $user_id,
                'shape_id' => $shape_id
            ]);
        } else {
            // Create new progress record
            $mastery_score = calculateMasteryScore(1, $is_correct ? 1 : 0, $hint_used, $time_spent);
            $status = determineStatus($mastery_score, $is_correct);

            $insert_sql = "INSERT INTO student_progress
                          (user_id, shape_id, attempts_count, correct_attempts, mastery_score,
                           status, best_time_seconds, last_attempt_at, completed_at)
                          VALUES (:user_id, :shape_id, 1, :correct, :mastery, :status,
                          :best_time, NOW(), CASE WHEN :status IN ('completed', 'mastered') THEN NOW() ELSE NULL END)";

            $db->execute($insert_sql, [
                'user_id' => $user_id,
                'shape_id' => $shape_id,
                'correct' => $is_correct ? 1 : 0,
                'mastery' => $mastery_score,
                'status' => $status,
                'best_time' => $is_correct ? $time_spent : null
            ]);
        }

        $db->commit();

        // Return result
        success_response([
            'is_correct' => $is_correct,
            'correct_answer' => $correct_answer,
            'feedback' => $feedback,
            'mastery_score' => $mastery_score,
            'status' => $status
        ]);

    } catch (Exception $e) {
        $db->rollback();
        error_response('Failed to submit attempt', 500, $e->getMessage());
    }
}

/**
 * Calculate mastery score based on performance
 */
function calculateMasteryScore($total_attempts, $correct_attempts, $hint_used, $time_spent) {
    // Base score from accuracy
    $accuracy = $total_attempts > 0 ? ($correct_attempts / $total_attempts) * 100 : 0;

    // Penalty for using hints (reduce score by 10%)
    if ($hint_used) {
        $accuracy *= 0.9;
    }

    // Bonus for quick completion (if under 60 seconds)
    if ($time_spent > 0 && $time_spent < 60) {
        $time_bonus = (60 - $time_spent) / 60 * 5; // Up to 5% bonus
        $accuracy += $time_bonus;
    }

    // Penalty for multiple attempts (diminishing returns)
    if ($total_attempts > 3) {
        $attempt_penalty = ($total_attempts - 3) * 2; // 2% per extra attempt
        $accuracy -= $attempt_penalty;
    }

    return max(0, min(100, round($accuracy, 2)));
}

/**
 * Determine status based on mastery score
 */
function determineStatus($mastery_score, $is_correct) {
    if ($mastery_score >= 90) {
        return 'mastered';
    } elseif ($mastery_score >= 70 || $is_correct) {
        return 'completed';
    } else {
        return 'in_progress';
    }
}

/**
 * Generate feedback message
 */
function generateFeedback($is_correct, $submitted, $correct, $explanation) {
    if ($is_correct) {
        $messages = [
            '정답입니다! 잘하셨어요! 🎉',
            '훌륭합니다! 정확한 답을 찾으셨네요! ✨',
            '완벽합니다! 계속 이렇게 해보세요! 👍',
            '맞았습니다! 수학 실력이 훌륭하네요! 🌟'
        ];
        return $messages[array_rand($messages)] . "\n\n" . $explanation;
    } else {
        $diff = abs($submitted - $correct);
        if ($diff < 1) {
            return "아깝습니다! 거의 다 왔어요. 답은 {$correct}입니다. 다시 한번 시도해보세요! 💪";
        } else {
            return "아직 정답이 아니에요. 정답은 {$correct}입니다. 힌트를 참고해서 다시 도전해보세요! 📝\n\n{$explanation}";
        }
    }
}
