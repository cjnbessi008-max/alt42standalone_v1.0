<?php
/**
 * Number Beat Game API
 *
 * Main API endpoints for the game
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/moodle_integration.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = $pathParts[count($pathParts) - 1] ?? '';

// Get request body for POST/PUT
$requestBody = file_get_contents('php://input');
$requestData = json_decode($requestBody, true) ?? [];

try {
    switch ($action) {
        // Get random problem
        case 'get-problem':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }

            $difficulty = sanitizeInput($_GET['difficulty'] ?? 'medium');
            $studentId = sanitizeInput($_GET['student_id'] ?? null);

            $stmt = $db->prepare("
                SELECT p.*
                FROM problems p
                WHERE p.difficulty_level = :difficulty
                AND NOT EXISTS (
                    SELECT 1 FROM student_attempts sa
                    WHERE sa.problem_id = p.id
                    AND sa.student_id = :student_id
                    AND sa.is_correct = 1
                )
                ORDER BY RAND()
                LIMIT 1
            ");

            $stmt->execute([
                'difficulty' => $difficulty,
                'student_id' => $studentId ?? 0
            ]);

            $problem = $stmt->fetch();

            if (!$problem) {
                errorResponse('No problems available', 404);
            }

            jsonResponse($problem);
            break;

        // Start game session
        case 'start-session':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }

            $error = validateRequired($requestData, ['student_id', 'problem_id']);
            if ($error) {
                errorResponse($error);
            }

            $studentId = sanitizeInput($requestData['student_id']);
            $problemId = sanitizeInput($requestData['problem_id']);
            $sessionToken = bin2hex(random_bytes(32));

            $stmt = $db->prepare("
                INSERT INTO game_sessions
                (student_id, problem_id, session_token, status)
                VALUES
                (:student_id, :problem_id, :session_token, 'active')
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'problem_id' => $problemId,
                'session_token' => $sessionToken
            ]);

            jsonResponse([
                'session_id' => $db->lastInsertId(),
                'session_token' => $sessionToken
            ]);
            break;

        // Submit answer
        case 'submit-answer':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }

            $error = validateRequired($requestData, [
                'student_id', 'problem_id', 'submitted_order',
                'rhythm_accuracy', 'time_spent'
            ]);
            if ($error) {
                errorResponse($error);
            }

            $studentId = sanitizeInput($requestData['student_id']);
            $problemId = sanitizeInput($requestData['problem_id']);
            $submittedOrder = sanitizeInput($requestData['submitted_order']);
            $rhythmAccuracy = floatval($requestData['rhythm_accuracy']);
            $timeSpent = intval($requestData['time_spent']);
            $sessionToken = sanitizeInput($requestData['session_token'] ?? '');

            // Get problem details
            $stmt = $db->prepare("SELECT * FROM problems WHERE id = :id");
            $stmt->execute(['id' => $problemId]);
            $problem = $stmt->fetch();

            if (!$problem) {
                errorResponse('Problem not found', 404);
            }

            // Check if answer is correct
            $isCorrect = ($submittedOrder === $problem['correct_order']);

            // Calculate score
            $score = 0;
            if ($isCorrect) {
                $baseScore = $problem['points'];
                $score = $baseScore;

                // Time bonus (faster = more points)
                if ($timeSpent < $problem['time_limit'] / 2) {
                    $score *= TIME_BONUS_MULTIPLIER;
                }

                // Rhythm accuracy bonus
                if ($rhythmAccuracy >= MIN_ACCURACY_FOR_BONUS) {
                    $score *= RHYTHM_BONUS_MULTIPLIER;
                }

                $score = intval($score);
            }

            // Count mistakes
            $submittedArray = explode(',', $submittedOrder);
            $correctArray = explode(',', $problem['correct_order']);
            $mistakes = 0;
            for ($i = 0; $i < count($submittedArray); $i++) {
                if (!isset($correctArray[$i]) || $submittedArray[$i] !== $correctArray[$i]) {
                    $mistakes++;
                }
            }

            // Save attempt
            $stmt = $db->prepare("
                INSERT INTO student_attempts
                (student_id, problem_id, submitted_order, rhythm_accuracy,
                 is_correct, score, time_spent, mistakes_count)
                VALUES
                (:student_id, :problem_id, :submitted_order, :rhythm_accuracy,
                 :is_correct, :score, :time_spent, :mistakes_count)
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'problem_id' => $problemId,
                'submitted_order' => $submittedOrder,
                'rhythm_accuracy' => $rhythmAccuracy,
                'is_correct' => $isCorrect ? 1 : 0,
                'score' => $score,
                'time_spent' => $timeSpent,
                'mistakes_count' => $mistakes
            ]);

            // Update session
            if ($sessionToken) {
                $stmt = $db->prepare("
                    UPDATE game_sessions
                    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                    WHERE session_token = :session_token
                ");
                $stmt->execute(['session_token' => $sessionToken]);
            }

            // Update student progress
            updateStudentProgress($db, $studentId, $isCorrect, $score, $rhythmAccuracy);

            // Send grade to Moodle (optional)
            if (MOODLE_TOKEN && $isCorrect) {
                try {
                    $moodle = new MoodleIntegration();
                    $stmt = $db->prepare("SELECT moodle_user_id FROM students WHERE id = :id");
                    $stmt->execute(['id' => $studentId]);
                    $student = $stmt->fetch();

                    if ($student) {
                        $moodle->sendGrade(
                            $student['moodle_user_id'],
                            $problem['moodle_problem_id'],
                            $score,
                            $problem['points']
                        );
                    }
                } catch (Exception $e) {
                    error_log("Failed to send grade to Moodle: " . $e->getMessage());
                }
            }

            jsonResponse([
                'is_correct' => $isCorrect,
                'score' => $score,
                'mistakes' => $mistakes,
                'rhythm_accuracy' => $rhythmAccuracy,
                'correct_order' => $problem['correct_order']
            ]);
            break;

        // Get student progress
        case 'get-progress':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }

            $studentId = sanitizeInput($_GET['student_id'] ?? null);

            if (!$studentId) {
                errorResponse('Student ID required');
            }

            $stmt = $db->prepare("SELECT * FROM student_statistics WHERE id = :id");
            $stmt->execute(['id' => $studentId]);
            $progress = $stmt->fetch();

            if (!$progress) {
                jsonResponse([
                    'total_problems_attempted' => 0,
                    'total_problems_correct' => 0,
                    'success_rate' => 0,
                    'total_score' => 0,
                    'average_rhythm_accuracy' => 0,
                    'current_streak' => 0,
                    'best_streak' => 0
                ]);
            } else {
                jsonResponse($progress);
            }
            break;

        // Get leaderboard
        case 'leaderboard':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }

            $limit = intval($_GET['limit'] ?? 10);

            $stmt = $db->prepare("
                SELECT
                    s.id,
                    s.username,
                    s.fullname,
                    sp.total_score,
                    sp.total_problems_correct,
                    sp.average_rhythm_accuracy,
                    sp.best_streak
                FROM students s
                INNER JOIN student_progress sp ON s.id = sp.student_id
                ORDER BY sp.total_score DESC
                LIMIT :limit
            ");

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $leaderboard = $stmt->fetchAll();

            jsonResponse($leaderboard);
            break;

        // Sync with Moodle
        case 'sync-moodle':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }

            $courseId = sanitizeInput($requestData['course_id'] ?? null);

            if (!$courseId) {
                errorResponse('Course ID required');
            }

            $moodle = new MoodleIntegration();

            $problemsResult = $moodle->syncProblems($courseId);
            $studentsResult = $moodle->syncStudents($courseId);

            jsonResponse([
                'problems_synced' => $problemsResult['synced'],
                'students_synced' => $studentsResult['synced']
            ]);
            break;

        default:
            errorResponse('Invalid action', 404);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    errorResponse('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}

/**
 * Update student progress after attempt
 */
function updateStudentProgress($db, $studentId, $isCorrect, $score, $rhythmAccuracy) {
    // Check if progress record exists
    $stmt = $db->prepare("SELECT * FROM student_progress WHERE student_id = :student_id");
    $stmt->execute(['student_id' => $studentId]);
    $progress = $stmt->fetch();

    if (!$progress) {
        // Create new progress record
        $stmt = $db->prepare("
            INSERT INTO student_progress
            (student_id, total_problems_attempted, total_problems_correct, total_score,
             average_rhythm_accuracy, current_streak, best_streak)
            VALUES
            (:student_id, 1, :correct, :score, :rhythm, :streak, :streak)
        ");

        $stmt->execute([
            'student_id' => $studentId,
            'correct' => $isCorrect ? 1 : 0,
            'score' => $score,
            'rhythm' => $rhythmAccuracy,
            'streak' => $isCorrect ? 1 : 0
        ]);
    } else {
        // Update existing progress
        $newAttempts = $progress['total_problems_attempted'] + 1;
        $newCorrect = $progress['total_problems_correct'] + ($isCorrect ? 1 : 0);
        $newScore = $progress['total_score'] + $score;

        // Calculate new average rhythm accuracy
        $newRhythmAvg = (($progress['average_rhythm_accuracy'] * $progress['total_problems_attempted']) + $rhythmAccuracy) / $newAttempts;

        // Update streak
        $newStreak = $isCorrect ? $progress['current_streak'] + 1 : 0;
        $newBestStreak = max($newStreak, $progress['best_streak']);

        $stmt = $db->prepare("
            UPDATE student_progress
            SET
                total_problems_attempted = :attempts,
                total_problems_correct = :correct,
                total_score = :score,
                average_rhythm_accuracy = :rhythm,
                current_streak = :streak,
                best_streak = :best_streak
            WHERE student_id = :student_id
        ");

        $stmt->execute([
            'attempts' => $newAttempts,
            'correct' => $newCorrect,
            'score' => $newScore,
            'rhythm' => $newRhythmAvg,
            'streak' => $newStreak,
            'best_streak' => $newBestStreak,
            'student_id' => $studentId
        ]);
    }
}
