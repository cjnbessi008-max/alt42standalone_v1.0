<?php
/**
 * Get Inequality Problems API
 * 부등식 문제 조회 API
 */

require_once 'config.php';

// HTTP 메서드 확인
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed. Use GET.', 405);
}

try {
    $db = getDbConnection();

    // 파라미터 가져오기
    $problemId = getParam('id');
    $difficulty = getParam('difficulty');
    $category = getParam('category');
    $limit = getParam('limit', 10);
    $offset = getParam('offset', 0);
    $moodleQuestionId = getParam('moodle_id');

    // 단일 문제 조회
    if ($problemId) {
        $stmt = $db->prepare("
            SELECT
                id,
                moodle_question_id,
                inequality_expression,
                difficulty_level,
                category,
                solution_steps,
                correct_answer,
                created_at
            FROM inequality_problems
            WHERE id = :id
        ");
        $stmt->execute(['id' => $problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            errorResponse('Problem not found', 404);
        }

        // solution_steps JSON 파싱
        if ($problem['solution_steps']) {
            $problem['solution_steps'] = json_decode($problem['solution_steps'], true);
        }

        successResponse($problem, 'Problem retrieved successfully');
    }

    // Moodle 문제 ID로 조회
    if ($moodleQuestionId) {
        $stmt = $db->prepare("
            SELECT
                id,
                moodle_question_id,
                inequality_expression,
                difficulty_level,
                category,
                solution_steps,
                correct_answer,
                created_at
            FROM inequality_problems
            WHERE moodle_question_id = :moodle_id
        ");
        $stmt->execute(['moodle_id' => $moodleQuestionId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            errorResponse('Moodle problem not found', 404);
        }

        if ($problem['solution_steps']) {
            $problem['solution_steps'] = json_decode($problem['solution_steps'], true);
        }

        successResponse($problem, 'Moodle problem retrieved successfully');
    }

    // 문제 목록 조회 (필터링 가능)
    $sql = "
        SELECT
            id,
            moodle_question_id,
            inequality_expression,
            difficulty_level,
            category,
            correct_answer,
            created_at
        FROM inequality_problems
        WHERE 1=1
    ";

    $params = [];

    if ($difficulty) {
        $sql .= " AND difficulty_level = :difficulty";
        $params['difficulty'] = $difficulty;
    }

    if ($category) {
        $sql .= " AND category = :category";
        $params['category'] = $category;
    }

    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);

    // 바인딩 (LIMIT, OFFSET는 정수로)
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

    $stmt->execute();
    $problems = $stmt->fetchAll();

    // 총 개수 조회
    $countSql = "SELECT COUNT(*) as total FROM inequality_problems WHERE 1=1";
    if ($difficulty) {
        $countSql .= " AND difficulty_level = :difficulty";
    }
    if ($category) {
        $countSql .= " AND category = :category";
    }

    $countStmt = $db->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];

    successResponse([
        'problems' => $problems,
        'total' => (int)$total,
        'limit' => (int)$limit,
        'offset' => (int)$offset
    ], 'Problems retrieved successfully');

} catch (PDOException $e) {
    errorResponse('Database error', 500, $e->getMessage());
} catch (Exception $e) {
    errorResponse('Server error', 500, $e->getMessage());
}
