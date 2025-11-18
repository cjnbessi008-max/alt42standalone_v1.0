<?php
/**
 * Statistics API Endpoints
 */

function handleStatisticsAPI($method, $path_parts, $data) {
    $rule = new Rule();
    $doorState = new DoorState();
    $attempt = new ProblemAttempt();

    // GET /statistics/overview - Get overall system statistics
    if ($method === 'GET' && count($path_parts) === 2 && $path_parts[1] === 'overview') {
        $db = new Database();
        $conn = $db->getConnection();

        // Get counts
        $rules_count_query = "SELECT COUNT(*) as count FROM rules WHERE is_active = 1";
        $rules_count = $conn->query($rules_count_query)->fetch()['count'];

        $door_states_count_query = "SELECT COUNT(*) as count FROM door_states";
        $door_states_count = $conn->query($door_states_count_query)->fetch()['count'];

        $attempts_count_query = "SELECT COUNT(*) as count FROM problem_attempts";
        $attempts_count = $conn->query($attempts_count_query)->fetch()['count'];

        $students_count_query = "SELECT COUNT(DISTINCT student_id) as count FROM problem_attempts";
        $students_count = $conn->query($students_count_query)->fetch()['count'];

        // Get door status distribution
        $door_status_query = "SELECT door_status, COUNT(*) as count
                              FROM door_states
                              GROUP BY door_status";
        $door_status_dist = $conn->query($door_status_query)->fetchAll();

        // Get duplicate statistics
        $duplicate_stats_query = "SELECT
                                    COUNT(*) as total_attempts,
                                    SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_count,
                                    ROUND(SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as duplicate_percentage
                                  FROM problem_attempts";
        $duplicate_stats = $conn->query($duplicate_stats_query)->fetch();

        ApiResponse::success([
            'total_active_rules' => $rules_count,
            'total_door_states' => $door_states_count,
            'total_attempts' => $attempts_count,
            'unique_students' => $students_count,
            'door_status_distribution' => $door_status_dist,
            'duplicate_statistics' => $duplicate_stats
        ], 'Overview statistics retrieved successfully');
    }

    // GET /statistics/rule/{rule_id} - Get detailed statistics for a rule
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'rule') {
        $rule_id = intval($path_parts[2]);

        // Get rule info
        $rule_data = $rule->getById($rule_id);
        if (!$rule_data) {
            ApiResponse::error('Rule not found', 404);
        }

        // Get rule statistics
        $rule_stats = $rule->getStatistics($rule_id);

        // Get door state statistics
        $door_stats = $doorState->getStatistics($rule_id);

        // Get attempt statistics
        $attempt_stats = $attempt->getStatistics($rule_id);

        ApiResponse::success([
            'rule_info' => $rule_data,
            'rule_statistics' => $rule_stats,
            'door_statistics' => $door_stats,
            'attempt_statistics' => $attempt_stats
        ], 'Rule statistics retrieved successfully');
    }

    // GET /statistics/student/{student_id} - Get statistics for a student
    if ($method === 'GET' && count($path_parts) === 3 && $path_parts[1] === 'student') {
        $student_id = intval($path_parts[2]);
        $db = new Database();
        $conn = $db->getConnection();

        // Get student's rules and attempts
        $query = "SELECT
                    r.id as rule_id,
                    r.rule_name,
                    r.rule_type,
                    COUNT(pa.id) as total_attempts,
                    SUM(CASE WHEN pa.is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_attempts,
                    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                    AVG(pa.time_spent_seconds) as avg_time_spent
                  FROM rules r
                  LEFT JOIN problem_attempts pa ON r.id = pa.rule_id AND pa.student_id = :student_id
                  WHERE r.is_active = 1
                  GROUP BY r.id";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
        $stmt->execute();
        $student_stats = $stmt->fetchAll();

        // Get student's door states
        $door_states = $doorState->getStudentDoorStates($student_id);

        ApiResponse::success([
            'student_id' => $student_id,
            'statistics_by_rule' => $student_stats,
            'current_door_states' => $door_states
        ], 'Student statistics retrieved successfully');
    }

    // GET /statistics/trends - Get trending data over time
    if ($method === 'GET' && count($path_parts) === 2 && $path_parts[1] === 'trends') {
        $days = isset($_GET['days']) ? intval($_GET['days']) : 7;
        $db = new Database();
        $conn = $db->getConnection();

        // Get daily attempt trends
        $trends_query = "SELECT
                            DATE(attempt_timestamp) as date,
                            COUNT(*) as total_attempts,
                            SUM(CASE WHEN is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_attempts,
                            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                            COUNT(DISTINCT student_id) as unique_students
                          FROM problem_attempts
                          WHERE attempt_timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)
                          GROUP BY DATE(attempt_timestamp)
                          ORDER BY date DESC";

        $stmt = $conn->prepare($trends_query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        $trends = $stmt->fetchAll();

        ApiResponse::success([
            'period_days' => $days,
            'daily_trends' => $trends
        ], 'Trends data retrieved successfully');
    }

    ApiResponse::error('Invalid endpoint or method', 400);
}
