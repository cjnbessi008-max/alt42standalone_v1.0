<?php
/**
 * API Endpoint: Fetch log data from Moodle
 * Returns user activity logs for visualization
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance()->getConnection();

    // Get parameters
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

    // Query Moodle log table (mdl_logstore_standard_log in Moodle 3.7)
    $sql = "SELECT
                l.id,
                l.eventname,
                l.component,
                l.action,
                l.target,
                l.timecreated,
                l.userid,
                u.firstname,
                u.lastname,
                c.fullname as coursename
            FROM mdl_logstore_standard_log l
            LEFT JOIN mdl_user u ON l.userid = u.id
            LEFT JOIN mdl_course c ON l.courseid = c.id
            WHERE 1=1";

    $params = array();

    if ($userId > 0) {
        $sql .= " AND l.userid = :userid";
        $params[':userid'] = $userId;
    }

    if ($courseId > 0) {
        $sql .= " AND l.courseid = :courseid";
        $params[':courseid'] = $courseId;
    }

    $sql .= " ORDER BY l.timecreated DESC LIMIT :limit";
    $params[':limit'] = $limit;

    $stmt = $db->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    $stmt->execute();
    $logs = $stmt->fetchAll();

    // Transform data for visualization
    $visualData = array();
    $timePoints = array();

    foreach ($logs as $index => $log) {
        $timePoints[] = array(
            'x' => $index,
            'y' => log(floatval($log['timecreated']) / 1000000), // Log transformation for visual effect
            'timestamp' => $log['timecreated'],
            'event' => $log['eventname'],
            'action' => $log['action'],
            'user' => $log['firstname'] . ' ' . $log['lastname'],
            'course' => $log['coursename']
        );
    }

    $response = array(
        'success' => true,
        'count' => count($logs),
        'data' => $timePoints,
        'metadata' => array(
            'userId' => $userId,
            'courseId' => $courseId,
            'generatedAt' => time()
        )
    );

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
?>
