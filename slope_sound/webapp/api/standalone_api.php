<?php
/**
 * Slope Sound - Standalone API
 * For testing without full Moodle installation
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

$action = $_GET['action'] ?? '';
$pdo = get_db_connection();

try {
    switch ($action) {
        case 'get_problem':
            $id = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("SELECT * FROM " . DB_PREFIX . "slopesound_problems WHERE id = ?");
            $stmt->execute([$id]);
            $problem = $stmt->fetch();

            if ($problem) {
                echo json_encode(['success' => true, 'data' => $problem]);
            } else {
                throw new Exception('Problem not found');
            }
            break;

        case 'get_problems':
            $quizId = $_GET['quiz_id'] ?? null;

            if ($quizId) {
                $stmt = $pdo->prepare("SELECT * FROM " . DB_PREFIX . "slopesound_problems WHERE moodle_quiz_id = ? ORDER BY difficulty_level, id");
                $stmt->execute([$quizId]);
            } else {
                $stmt = $pdo->query("SELECT * FROM " . DB_PREFIX . "slopesound_problems ORDER BY difficulty_level, id");
            }

            $problems = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $problems]);
            break;

        case 'start_attempt':
            $problemId = $_GET['problem_id'] ?? 0;
            $userId = $_SESSION['userid'];

            $stmt = $pdo->prepare("
                INSERT INTO " . DB_PREFIX . "slopesound_attempts
                (problem_id, userid, points_explored, time_spent, completed, timecreated, timemodified)
                VALUES (?, ?, '[]', 0, 0, ?, ?)
            ");

            $now = time();
            $stmt->execute([$problemId, $userId, $now, $now]);
            $attemptId = $pdo->lastInsertId();

            echo json_encode(['success' => true, 'attempt_id' => $attemptId]);
            break;

        case 'log_audio_event':
            $attemptId = $_GET['attempt_id'] ?? 0;
            $xValue = $_GET['x_value'] ?? 0;
            $slopeValue = $_GET['slope_value'] ?? 0;
            $frequencyHz = $_GET['frequency_hz'] ?? 0;

            $stmt = $pdo->prepare("
                INSERT INTO " . DB_PREFIX . "slopesound_audio_events
                (attempt_id, x_value, slope_value, frequency_hz, duration_ms, timecreated)
                VALUES (?, ?, ?, ?, 200, ?)
            ");

            $stmt->execute([$attemptId, $xValue, $slopeValue, $frequencyHz, time()]);
            echo json_encode(['success' => true]);
            break;

        case 'update_attempt':
            $attemptId = $_GET['attempt_id'] ?? 0;
            $pointsExplored = $_GET['points_explored'] ?? '[]';
            $timeSpent = $_GET['time_spent'] ?? 0;
            $completed = $_GET['completed'] ?? 0;
            $score = $_GET['score'] ?? null;

            $sql = "UPDATE " . DB_PREFIX . "slopesound_attempts
                    SET points_explored = ?, time_spent = ?, completed = ?, timemodified = ?";
            $params = [$pointsExplored, $timeSpent, $completed, time()];

            if ($score !== null) {
                $sql .= ", score = ?";
                $params[] = $score;
            }

            $sql .= " WHERE id = ?";
            $params[] = $attemptId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true]);
            break;

        case 'get_user_progress':
            $userId = $_SESSION['userid'];
            $problemId = $_GET['problem_id'] ?? null;

            if ($problemId) {
                $stmt = $pdo->prepare("
                    SELECT * FROM " . DB_PREFIX . "slopesound_attempts
                    WHERE userid = ? AND problem_id = ?
                    ORDER BY timecreated DESC
                ");
                $stmt->execute([$userId, $problemId]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT * FROM " . DB_PREFIX . "slopesound_attempts
                    WHERE userid = ?
                    ORDER BY timecreated DESC
                ");
                $stmt->execute([$userId]);
            }

            $attempts = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $attempts]);
            break;

        default:
            throw new Exception('Invalid action: ' . $action);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
