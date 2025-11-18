<?php
/**
 * Dashboard API Endpoint
 * Provides aggregated data for the teacher dashboard
 */

$db = Database::getInstance();
$detector = new AvoidanceDetector();

switch ($method) {
    case 'GET':
        // Get dashboard overview
        $overview = [];

        // Total students
        $sql = "SELECT COUNT(DISTINCT moodle_user_id) as count FROM student_analysis";
        $result = $db->fetchOne($sql);
        $overview['total_students'] = $result['count'];

        // Total concepts
        $sql = "SELECT COUNT(*) as count FROM concepts";
        $result = $db->fetchOne($sql);
        $overview['total_concepts'] = $result['count'];

        // Total avoidance patterns (unresolved)
        $sql = "SELECT COUNT(*) as count FROM avoidance_patterns WHERE is_resolved = 0";
        $result = $db->fetchOne($sql);
        $overview['active_patterns'] = $result['count'];

        // Critical patterns
        $sql = "SELECT COUNT(*) as count FROM avoidance_patterns
                WHERE is_resolved = 0 AND severity_level = 'critical'";
        $result = $db->fetchOne($sql);
        $overview['critical_patterns'] = $result['count'];

        // Recent detections (last 7 days)
        $sql = "SELECT COUNT(*) as count FROM avoidance_patterns
                WHERE detection_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $result = $db->fetchOne($sql);
        $overview['recent_detections'] = $result['count'];

        // Get statistics
        $overview['statistics'] = $detector->getStatistics();

        // Recent patterns (top 5)
        $sql = "SELECT * FROM v_avoidance_dashboard
                WHERE is_resolved = 0
                ORDER BY detection_date DESC
                LIMIT 5";
        $overview['recent_patterns'] = $db->fetchAll($sql);

        // Sync status
        $sql = "SELECT * FROM sync_log ORDER BY start_time DESC LIMIT 1";
        $overview['last_sync'] = $db->fetchOne($sql);

        send_success_response($overview);
        break;

    default:
        send_error_response('Method not allowed', 405);
}
