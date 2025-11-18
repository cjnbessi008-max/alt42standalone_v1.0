<?php
/**
 * Moodle User Sync
 * Synchronizes user data from Moodle to Glow Sequence
 */

require_once '../config/database.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    errorResponse('Invalid JSON input');
}

// Validate required fields
if (!isset($input['moodle_user_id'])) {
    errorResponse('moodle_user_id is required');
}

$moodle_user_id = intval($input['moodle_user_id']);

try {
    // Get user from Moodle database
    $moodleConn = getMoodleDbConnection();
    $prefix = MOODLE_DB_PREFIX;

    $moodleSql = "SELECT id, username, email, firstname, lastname
                  FROM {$prefix}user
                  WHERE id = ? AND deleted = 0";
    $moodleStmt = $moodleConn->prepare($moodleSql);
    $moodleStmt->bind_param('i', $moodle_user_id);
    $moodleStmt->execute();
    $moodleResult = $moodleStmt->get_result();

    if ($moodleResult->num_rows === 0) {
        errorResponse('Moodle user not found', 404);
    }

    $moodleUser = $moodleResult->fetch_assoc();
    $moodleStmt->close();

    // Get additional user info (grade level from Moodle profile field if exists)
    $grade_level = null;
    $profileSql = "SELECT data
                   FROM {$prefix}user_info_data d
                   JOIN {$prefix}user_info_field f ON d.fieldid = f.id
                   WHERE d.userid = ? AND f.shortname = 'gradelevel'
                   LIMIT 1";
    $profileStmt = $moodleConn->prepare($profileSql);
    $profileStmt->bind_param('i', $moodle_user_id);
    $profileStmt->execute();
    $profileResult = $profileStmt->get_result();

    if ($profileResult->num_rows > 0) {
        $grade_level = $profileResult->fetch_assoc()['data'];
    }
    $profileStmt->close();

    // Sync to Glow Sequence database
    $connection = getDbConnection();

    $username = $moodleUser['firstname'] . ' ' . $moodleUser['lastname'];
    $email = $moodleUser['email'];

    $syncSql = "INSERT INTO glow_students (moodle_user_id, username, email, grade_level)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    username = VALUES(username),
                    email = VALUES(email),
                    grade_level = VALUES(grade_level),
                    last_activity_at = CURRENT_TIMESTAMP";

    $syncStmt = $connection->prepare($syncSql);
    $syncStmt->bind_param('isss', $moodle_user_id, $username, $email, $grade_level);

    if (!$syncStmt->execute()) {
        throw new Exception("Failed to sync user: " . $syncStmt->error);
    }

    $student_id = $syncStmt->insert_id ?: $connection->query(
        "SELECT id FROM glow_students WHERE moodle_user_id = $moodle_user_id"
    )->fetch_assoc()['id'];

    $syncStmt->close();

    successResponse([
        'student_id' => intval($student_id),
        'moodle_user_id' => $moodle_user_id,
        'username' => $username,
        'email' => $email,
        'grade_level' => $grade_level
    ], 'User synced successfully');

} catch (Exception $e) {
    error_log("Error in sync_user.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
