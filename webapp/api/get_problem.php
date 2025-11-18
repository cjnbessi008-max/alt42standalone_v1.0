<?php
/**
 * Alt42 LMS Integration - Get Problem Info
 * 문제 정보를 반환
 */

require_once 'config.php';

// 요청 메서드 확인
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Invalid request method', 405);
}

// 파라미터 가져오기
$problemId = isset($_GET['problemid']) ? intval($_GET['problemid']) : 0;
$quizId = isset($_GET['quizid']) ? intval($_GET['quizid']) : 0;

if ($problemId <= 0 && $quizId <= 0) {
    errorResponse('Invalid problem ID or quiz ID');
}

try {
    $db = getDbConnection();

    if ($problemId > 0) {
        // 특정 문제 정보 가져오기
        $sql = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                q.defaultmark,
                q.penalty,
                qc.name as category_name,
                qc.info as category_info
            FROM mdl_question q
            LEFT JOIN mdl_question_categories qc ON q.category = qc.id
            WHERE q.id = :problemid
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([':problemid' => $problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            errorResponse('Problem not found', 404);
        }

        // HTML 태그 제거
        $problem['questiontext'] = strip_tags($problem['questiontext']);

        // 난이도 계산 (defaultmark 기반)
        $difficulty = 'easy';
        if ($problem['defaultmark'] >= 3) {
            $difficulty = 'hard';
        } elseif ($problem['defaultmark'] >= 2) {
            $difficulty = 'medium';
        }

        $responseData = [
            'id' => $problem['id'],
            'title' => $problem['name'],
            'description' => $problem['questiontext'],
            'type' => $problem['qtype'],
            'difficulty' => $difficulty,
            'points' => floatval($problem['defaultmark']),
            'penalty' => floatval($problem['penalty']),
            'category' => $problem['category_name'] ?: 'General'
        ];

    } else {
        // 퀴즈의 모든 문제 가져오기
        $sql = "
            SELECT
                q.id,
                q.name,
                q.questiontext,
                q.qtype,
                q.defaultmark,
                qs.slot,
                qs.maxmark,
                quiz.name as quiz_name
            FROM mdl_quiz_slots qs
            INNER JOIN mdl_question q ON qs.questionid = q.id
            INNER JOIN mdl_quiz quiz ON qs.quizid = quiz.id
            WHERE qs.quizid = :quizid
            ORDER BY qs.slot ASC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([':quizid' => $quizId]);
        $problems = $stmt->fetchAll();

        if (empty($problems)) {
            errorResponse('No problems found for this quiz', 404);
        }

        $formattedProblems = [];
        foreach ($problems as $problem) {
            $difficulty = 'easy';
            if ($problem['defaultmark'] >= 3) {
                $difficulty = 'hard';
            } elseif ($problem['defaultmark'] >= 2) {
                $difficulty = 'medium';
            }

            $formattedProblems[] = [
                'id' => $problem['id'],
                'title' => $problem['name'],
                'description' => strip_tags($problem['questiontext']),
                'type' => $problem['qtype'],
                'difficulty' => $difficulty,
                'points' => floatval($problem['defaultmark']),
                'slot' => $problem['slot']
            ];
        }

        $responseData = [
            'quiz_id' => $quizId,
            'quiz_name' => $problems[0]['quiz_name'],
            'problems' => $formattedProblems,
            'total_count' => count($formattedProblems)
        ];
    }

    successResponse($responseData);

} catch (PDOException $e) {
    errorResponse('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
