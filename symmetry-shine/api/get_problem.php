<?php
/**
 * Moodle LMS에서 문제 정보 가져오기
 */

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();

    // 요청 파라미터
    $userId = $_GET['user_id'] ?? null;
    $courseId = $_GET['course_id'] ?? null;
    $problemType = $_GET['type'] ?? 'random';

    // 문제 조회 쿼리
    $query = "SELECT
                p.id,
                p.title,
                p.description,
                p.function_expression,
                p.symmetry_axis,
                p.problem_type,
                p.difficulty_level,
                p.created_at
              FROM symmetry_problems p
              WHERE p.is_active = 1";

    $params = [];

    // 난이도 필터
    if (isset($_GET['difficulty'])) {
        $query .= " AND p.difficulty_level = :difficulty";
        $params['difficulty'] = $_GET['difficulty'];
    }

    // 문제 유형 필터
    if ($problemType !== 'random') {
        $query .= " AND p.problem_type = :type";
        $params['type'] = $problemType;
    }

    // 무작위 정렬
    $query .= " ORDER BY RAND() LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $problem = $stmt->fetch();

    if (!$problem) {
        // 문제가 없으면 기본 문제 반환
        jsonResponse([
            'success' => true,
            'id' => 'demo_1',
            'title' => '이차함수의 대칭성',
            'description' => 'f(x) = x² - 4x + 3의 대칭축을 찾으세요',
            'function' => 'x*x - 4*x + 3',
            'symmetryAxis' => 2,
            'type' => 'quadratic',
            'difficulty' => 1,
            'is_demo' => true
        ]);
    }

    // 사용자 활동 기록
    if ($userId && $problem) {
        $activityStmt = $db->prepare(
            "INSERT INTO user_problem_attempts
             (user_id, problem_id, started_at, status)
             VALUES (:user_id, :problem_id, NOW(), 'started')"
        );
        $activityStmt->execute([
            'user_id' => $userId,
            'problem_id' => $problem['id']
        ]);
    }

    // 로그 기록
    logActivity('get_problem', [
        'problem_id' => $problem['id'],
        'user_id' => $userId,
        'course_id' => $courseId
    ]);

    // 응답
    jsonResponse([
        'success' => true,
        'id' => $problem['id'],
        'title' => $problem['title'],
        'description' => $problem['description'],
        'function' => $problem['function_expression'],
        'symmetryAxis' => (float)$problem['symmetry_axis'],
        'type' => $problem['problem_type'],
        'difficulty' => (int)$problem['difficulty_level']
    ]);

} catch (Exception $e) {
    error_log("Error in get_problem.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
?>
