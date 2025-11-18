<?php
/**
 * Truth Light API Test Script
 *
 * API 엔드포인트를 테스트하는 간단한 스크립트
 * 사용법: php test-api.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/MoodleConnector.php';

echo "===========================================\n";
echo "Truth Light API 테스트\n";
echo "===========================================\n\n";

// 테스트 결과 추적
$tests_passed = 0;
$tests_failed = 0;

/**
 * 테스트 헬퍼 함수
 */
function runTest($testName, $callback) {
    global $tests_passed, $tests_failed;

    echo "테스트: $testName ... ";

    try {
        $result = $callback();

        if ($result) {
            echo "✓ 통과\n";
            $tests_passed++;
        } else {
            echo "✗ 실패\n";
            $tests_failed++;
        }
    } catch (Exception $e) {
        echo "✗ 오류: " . $e->getMessage() . "\n";
        $tests_failed++;
    }
}

// 1. 데이터베이스 연결 테스트
runTest("데이터베이스 연결", function() {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    return $conn !== null;
});

// 2. 문제 조회 테스트
runTest("문제 조회", function() {
    $db = Database::getInstance();
    $questions = $db->query("SELECT * FROM questions LIMIT 1");
    return count($questions) > 0;
});

// 3. 사용자 조회 테스트
runTest("사용자 조회", function() {
    $db = Database::getInstance();
    $users = $db->query("SELECT * FROM users LIMIT 1");
    return count($users) > 0;
});

// 4. 세션 생성 테스트
runTest("세션 생성", function() {
    $db = Database::getInstance();
    $sessionToken = bin2hex(random_bytes(32));

    $result = $db->execute(
        "INSERT INTO learning_sessions (user_id, session_token) VALUES (?, ?)",
        [1, $sessionToken]
    );

    $success = $result['success'] && $result['last_insert_id'] > 0;

    // 테스트 세션 삭제
    if ($success) {
        $db->execute(
            "DELETE FROM learning_sessions WHERE session_token = ?",
            [$sessionToken]
        );
    }

    return $success;
});

// 5. 답변 기록 테스트
runTest("답변 기록", function() {
    $db = Database::getInstance();

    // 임시 세션 생성
    $sessionToken = bin2hex(random_bytes(32));
    $sessionResult = $db->execute(
        "INSERT INTO learning_sessions (user_id, session_token) VALUES (?, ?)",
        [1, $sessionToken]
    );
    $sessionId = $sessionResult['last_insert_id'];

    // 첫 번째 문제 가져오기
    $question = $db->queryOne("SELECT * FROM questions LIMIT 1");

    if (!$question) {
        return false;
    }

    // 답변 기록
    $answerResult = $db->execute(
        "INSERT INTO answer_attempts
         (session_id, question_id, user_answer, is_correct, time_spent_seconds, light_brightness)
         VALUES (?, ?, ?, ?, ?, ?)",
        [$sessionId, $question['id'], true, true, 10, 100]
    );

    $success = $answerResult['success'];

    // 테스트 데이터 정리
    $db->execute("DELETE FROM answer_attempts WHERE session_id = ?", [$sessionId]);
    $db->execute("DELETE FROM learning_sessions WHERE id = ?", [$sessionId]);

    return $success;
});

// 6. 카테고리 조회 테스트
runTest("카테고리 조회", function() {
    $db = Database::getInstance();
    $categories = $db->query(
        "SELECT DISTINCT category FROM questions"
    );
    return count($categories) > 0;
});

// 7. 진도 조회 테스트
runTest("진도 조회", function() {
    $db = Database::getInstance();

    // 진도 데이터가 없으면 생성
    $progress = $db->queryOne(
        "SELECT * FROM user_progress WHERE user_id = 1"
    );

    if (!$progress) {
        $db->execute(
            "INSERT INTO user_progress (user_id) VALUES (?)",
            [1]
        );
    }

    $progress = $db->queryOne(
        "SELECT * FROM user_progress WHERE user_id = 1"
    );

    return $progress !== false;
});

// 8. Moodle 연결 테스트 (선택사항)
if (defined('MOODLE_TOKEN') && MOODLE_TOKEN !== '') {
    runTest("Moodle 연결", function() {
        $moodle = new MoodleConnector();
        return $moodle->testConnection();
    });
} else {
    echo "테스트: Moodle 연결 ... ⊘ 건너뜀 (토큰 미설정)\n";
}

// 결과 요약
echo "\n===========================================\n";
echo "테스트 결과\n";
echo "===========================================\n";
echo "통과: $tests_passed\n";
echo "실패: $tests_failed\n";
echo "총계: " . ($tests_passed + $tests_failed) . "\n";

if ($tests_failed === 0) {
    echo "\n✓ 모든 테스트를 통과했습니다!\n";
    exit(0);
} else {
    echo "\n✗ 일부 테스트가 실패했습니다.\n";
    echo "로그를 확인하세요: " . LOG_PATH . "\n";
    exit(1);
}
