<?php
/**
 * Angle Live - Local Library Functions for Moodle Integration
 * Moodle 3.7 Compatible
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Get Angle Live database connection
 */
function anglelive_get_database() {
    $host = 'localhost';
    $dbname = 'angle_live';
    $user = 'root';
    $pass = '';

    $conn = new mysqli($host, $user, $pass, $dbname);

    if ($conn->connect_error) {
        debugging('Angle Live DB connection failed: ' . $conn->connect_error, DEBUG_DEVELOPER);
        return null;
    }

    $conn->set_charset('utf8mb4');

    return $conn;
}

/**
 * Get user progress from Angle Live database
 */
function anglelive_get_user_progress($moodle_user_id, $course_id) {
    $db = anglelive_get_database();

    if (!$db) {
        return null;
    }

    $sql = "SELECT
                up.total_sessions,
                up.angles_discovered,
                up.completion_percentage,
                up.last_angle,
                UNIX_TIMESTAMP(up.updated_at) as last_activity
            FROM moodle_integration mi
            INNER JOIN user_progress up ON mi.angle_live_user_id = up.user_id
            WHERE mi.moodle_user_id = ? AND mi.moodle_course_id = ?
            LIMIT 1";

    $stmt = $db->prepare($sql);
    if (!$stmt) {
        $db->close();
        return null;
    }

    $stmt->bind_param('ii', $moodle_user_id, $course_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $progress = null;
    if ($row = $result->fetch_assoc()) {
        $progress = $row;
    }

    $stmt->close();
    $db->close();

    return $progress;
}

/**
 * Create or update Angle Live user from Moodle user
 */
function anglelive_sync_user($moodle_user_id, $course_id) {
    $db = anglelive_get_database();

    if (!$db) {
        return false;
    }

    // Check if integration record exists
    $check_sql = "SELECT angle_live_user_id FROM moodle_integration
                  WHERE moodle_user_id = ? AND moodle_course_id = ?";

    $stmt = $db->prepare($check_sql);
    $stmt->bind_param('ii', $moodle_user_id, $course_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // Create new integration record
        $insert_sql = "INSERT INTO moodle_integration
                      (moodle_course_id, moodle_user_id, angle_live_user_id, created_at)
                      VALUES (?, ?, ?, NOW())";

        $stmt2 = $db->prepare($insert_sql);
        $angle_user_id = $moodle_user_id; // Use same ID for simplicity
        $stmt2->bind_param('iii', $course_id, $moodle_user_id, $angle_user_id);
        $stmt2->execute();
        $stmt2->close();

        // Create user progress record
        $progress_sql = "INSERT INTO user_progress (user_id, moodle_user_id, created_at)
                        VALUES (?, ?, NOW())
                        ON DUPLICATE KEY UPDATE moodle_user_id = ?";

        $stmt3 = $db->prepare($progress_sql);
        $stmt3->bind_param('iii', $angle_user_id, $moodle_user_id, $moodle_user_id);
        $stmt3->execute();
        $stmt3->close();
    }

    $stmt->close();
    $db->close();

    return true;
}

/**
 * Get Angle Live activity embed URL
 */
function anglelive_get_embed_url($cm_id, $course_id, $user_id) {
    global $CFG;

    $base_url = $CFG->wwwroot . '/mod/anglelive/app/';

    $params = array(
        'id' => $cm_id,
        'course_id' => $course_id,
        'user_id' => $user_id
    );

    return $base_url . 'index.html?' . http_build_query($params);
}

/**
 * Check if user has completed Angle Live activity
 */
function anglelive_is_completed($user_id, $course_id, $completion_threshold = 80) {
    $progress = anglelive_get_user_progress($user_id, $course_id);

    if (!$progress) {
        return false;
    }

    return $progress['completion_percentage'] >= $completion_threshold;
}

/**
 * Get activity statistics for a course
 */
function anglelive_get_course_stats($course_id) {
    $db = anglelive_get_database();

    if (!$db) {
        return null;
    }

    $sql = "SELECT
                COUNT(DISTINCT mi.moodle_user_id) as total_users,
                AVG(up.completion_percentage) as avg_completion,
                SUM(up.total_sessions) as total_sessions,
                SUM(up.angles_discovered) as total_angles
            FROM moodle_integration mi
            INNER JOIN user_progress up ON mi.angle_live_user_id = up.user_id
            WHERE mi.moodle_course_id = ?";

    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $course_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $stats = null;
    if ($row = $result->fetch_assoc()) {
        $stats = $row;
    }

    $stmt->close();
    $db->close();

    return $stats;
}
