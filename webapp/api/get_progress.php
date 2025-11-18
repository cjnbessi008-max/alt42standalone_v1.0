<?php
/**
 * Alt42 LMS Integration - Get User Progress
 * 사용자의 학습 진행 데이터를 반환
 */

require_once 'config.php';

// 요청 메서드 확인
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Invalid request method', 405);
}

// 파라미터 가져오기
$userId = isset($_GET['userid']) ? intval($_GET['userid']) : 0;
$courseId = isset($_GET['courseid']) ? intval($_GET['courseid']) : 0;

if ($userId <= 0 || $courseId <= 0) {
    errorResponse('Invalid user ID or course ID');
}

try {
    $db = getDbConnection();

    // 사용자의 퀴즈 시도 기록 가져오기
    $sql = "
        SELECT
            qa.id as attempt_id,
            qa.quiz as quiz_id,
            qa.userid,
            qa.attempt,
            qa.state,
            qa.timestart,
            qa.timefinish,
            qa.timemodified,
            qa.sumgrades,
            q.name as quiz_name,
            q.grade as max_grade,
            q.timemodified as quiz_modified
        FROM mdl_quiz_attempts qa
        INNER JOIN mdl_quiz q ON qa.quiz = q.id
        WHERE qa.userid = :userid
        AND q.course = :courseid
        ORDER BY qa.timestart ASC
        LIMIT 50
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':userid' => $userId,
        ':courseid' => $courseId
    ]);

    $attempts = $stmt->fetchAll();

    // 진행 데이터 포맷팅
    $progressData = [];
    $totalScore = 0;
    $completedCount = 0;

    foreach ($attempts as $index => $attempt) {
        $score = 0;

        if ($attempt['sumgrades'] !== null && $attempt['max_grade'] > 0) {
            $score = ($attempt['sumgrades'] / $attempt['max_grade']) * 100;
        }

        // 로그 스케일을 위해 최소값 보장
        $score = max(1, $score);

        $progressData[] = [
            'time' => $index * 5, // 5분 간격으로 표시
            'score' => round($score, 2),
            'activity' => $attempt['quiz_name'],
            'attempt_id' => $attempt['attempt_id'],
            'state' => $attempt['state'],
            'timestamp' => date('Y-m-d H:i:s', $attempt['timestart'])
        ];

        if ($attempt['state'] === 'finished') {
            $totalScore += $score;
            $completedCount++;
        }
    }

    // 평균 점수 계산
    $averageScore = $completedCount > 0 ? $totalScore / $completedCount : 0;

    // 최근 활동 정보 가져오기
    $recentActivitySql = "
        SELECT
            FROM_UNIXTIME(l.timecreated) as activity_time,
            l.action,
            l.target,
            l.objecttable,
            l.objectid
        FROM mdl_logstore_standard_log l
        WHERE l.userid = :userid
        AND l.courseid = :courseid
        ORDER BY l.timecreated DESC
        LIMIT 10
    ";

    $stmtActivity = $db->prepare($recentActivitySql);
    $stmtActivity->execute([
        ':userid' => $userId,
        ':courseid' => $courseId
    ]);

    $recentActivities = $stmtActivity->fetchAll();

    // 응답 데이터 구성
    $responseData = [
        'progress' => $progressData,
        'summary' => [
            'total_attempts' => count($attempts),
            'completed_count' => $completedCount,
            'average_score' => round($averageScore, 2),
            'current_score' => count($progressData) > 0 ? $progressData[count($progressData) - 1]['score'] : 0,
            'last_activity' => count($recentActivities) > 0 ? $recentActivities[0]['activity_time'] : null
        ],
        'recent_activities' => $recentActivities,
        'userid' => $userId,
        'courseid' => $courseId
    ];

    successResponse($responseData);

} catch (PDOException $e) {
    errorResponse('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
