<?php
/**
 * Moodle LMS 연동 통합 예제
 *
 * 이 파일은 Alt42Standalone의 Moodle 연동 기능을 사용하는 방법을 보여줍니다.
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

require_once __DIR__ . '/../src/MoodleConnection.php';
require_once __DIR__ . '/../src/MoodleAuth.php';
require_once __DIR__ . '/../src/MoodleCourseManager.php';
require_once __DIR__ . '/../src/MoodleProgressTracker.php';
require_once __DIR__ . '/../src/MoodleApiClient.php';

use Alt42Standalone\MoodleConnection;
use Alt42Standalone\MoodleAuth;
use Alt42Standalone\MoodleCourseManager;
use Alt42Standalone\MoodleProgressTracker;
use Alt42Standalone\MoodleApiClient;

// ============================================================================
// 예제 1: 데이터베이스 직접 접근 방식
// ============================================================================

echo "=== 예제 1: 데이터베이스 직접 접근 ===\n\n";

// 1.1 데이터베이스 연결
$db = MoodleConnection::getInstance();

if ($db->isConnected()) {
    echo "✓ Moodle 데이터베이스 연결 성공\n";
} else {
    echo "✗ Moodle 데이터베이스 연결 실패\n";
    exit(1);
}

// 1.2 사용자 인증
$auth = new MoodleAuth($db);

// 사용자명과 비밀번호로 인증
$user = $auth->authenticate('student1', 'password123');

if ($user) {
    echo "✓ 사용자 인증 성공: {$user['username']} (ID: {$user['id']})\n";
    echo "  - 이름: {$user['firstname']} {$user['lastname']}\n";
    echo "  - 이메일: {$user['email']}\n";
} else {
    echo "✗ 사용자 인증 실패\n";
}

// 토큰 기반 인증 (API 토큰이 있는 경우)
// $userByToken = $auth->authenticateByToken('your_api_token_here');

// 1.3 사용자 역할 확인
if ($user) {
    $isTeacher = $auth->isTeacher($user['id']);
    $isStudent = $auth->isStudent($user['id']);

    echo "  - 교사 여부: " . ($isTeacher ? '예' : '아니오') . "\n";
    echo "  - 학생 여부: " . ($isStudent ? '예' : '아니오') . "\n";
}

echo "\n";

// ============================================================================
// 예제 2: 코스 및 모듈 관리
// ============================================================================

echo "=== 예제 2: 코스 및 모듈 관리 ===\n\n";

$courseManager = new MoodleCourseManager($db);

// 2.1 사용자의 코스 목록 조회
if ($user) {
    $courses = $courseManager->getUserCourses($user['id']);

    echo "✓ {$user['username']}님이 등록한 코스 ({count($courses)}개):\n";

    foreach ($courses as $course) {
        echo "  - [{$course['id']}] {$course['fullname']}\n";
        echo "    카테고리: {$course['category']}, 가시성: " . ($course['visible'] ? '공개' : '비공개') . "\n";

        // 2.2 코스의 모듈 조회
        $modules = $courseManager->getCourseModules($course['id']);
        echo "    모듈 수: " . count($modules) . "\n";

        // 퀴즈만 필터링
        $quizzes = $courseManager->getCourseModules($course['id'], 'quiz');
        echo "    퀴즈 수: " . count($quizzes) . "\n";
    }
}

echo "\n";

// 2.3 특정 코스의 학생 조회
$courseId = 2; // 예시 코스 ID
$students = $courseManager->getCourseStudents($courseId);

echo "✓ 코스 ID {$courseId}의 학생 목록 ({count($students)}명):\n";

foreach (array_slice($students, 0, 5) as $student) {
    echo "  - {$student['firstname']} {$student['lastname']} ({$student['username']})\n";
}

if (count($students) > 5) {
    echo "  ... 외 " . (count($students) - 5) . "명\n";
}

echo "\n";

// ============================================================================
// 예제 3: 학생 진도 추적
// ============================================================================

echo "=== 예제 3: 학생 진도 추적 ===\n\n";

$progressTracker = new MoodleProgressTracker($db);

// 3.1 코스 진행률 조회
if ($user && !empty($courses)) {
    $courseId = $courses[0]['id'];
    $progress = $progressTracker->getCourseProgress($user['id'], $courseId);

    echo "✓ 코스 진행률:\n";
    echo "  - 코스: {$courses[0]['fullname']}\n";
    echo "  - 완료한 활동: {$progress['completed_activities']} / {$progress['total_activities']}\n";
    echo "  - 진행률: {$progress['progress_percentage']}%\n";
    echo "  - 완료 여부: " . ($progress['is_completed'] ? '완료' : '진행 중') . "\n";
}

echo "\n";

// 3.2 코스 최종 성적 조회
if ($user && !empty($courses)) {
    $courseId = $courses[0]['id'];
    $finalGrade = $progressTracker->getCourseFinalGrade($user['id'], $courseId);

    if ($finalGrade) {
        echo "✓ 코스 최종 성적:\n";
        echo "  - 최종 점수: {$finalGrade['final_grade']} / {$finalGrade['max_grade']}\n";
        echo "  - 백분율: {$finalGrade['percentage']}%\n";
    } else {
        echo "  아직 성적이 없습니다.\n";
    }
}

echo "\n";

// 3.3 학습 시간 조회
if ($user && !empty($courses)) {
    $courseId = $courses[0]['id'];
    $studyTime = $progressTracker->getStudyTime($user['id'], $courseId);

    echo "✓ 학습 시간:\n";
    echo "  - 총 활동 수: {$studyTime['total_actions']}\n";
    echo "  - 학습 시간: {$studyTime['duration_hours']} 시간\n";
}

echo "\n";

// ============================================================================
// 예제 4: Moodle Web Services API 사용
// ============================================================================

echo "=== 예제 4: Moodle Web Services API ===\n\n";

try {
    $apiClient = new MoodleApiClient();

    // 4.1 사이트 정보 조회
    $siteInfo = $apiClient->getSiteInfo();

    echo "✓ Moodle 사이트 정보:\n";
    echo "  - 사이트 이름: {$siteInfo['sitename']}\n";
    echo "  - Moodle 버전: {$siteInfo['release']}\n";
    echo "  - 사용자 이름: {$siteInfo['username']}\n";

    echo "\n";

    // 4.2 API를 통한 코스 조회
    $apiCourses = $apiClient->getCourses();

    echo "✓ API를 통한 코스 조회 (" . count($apiCourses) . "개):\n";

    foreach (array_slice($apiCourses, 0, 5) as $course) {
        echo "  - [{$course['id']}] {$course['fullname']}\n";
    }

    if (count($apiCourses) > 5) {
        echo "  ... 외 " . (count($apiCourses) - 5) . "개\n";
    }

    echo "\n";

    // 4.3 사용자 조회 (API)
    if ($user) {
        $apiUser = $apiClient->getUser($user['id']);

        if ($apiUser) {
            echo "✓ API를 통한 사용자 조회:\n";
            echo "  - ID: {$apiUser['id']}\n";
            echo "  - 이름: {$apiUser['fullname']}\n";
            echo "  - 이메일: {$apiUser['email']}\n";
        }
    }

} catch (Exception $e) {
    echo "✗ API 오류: {$e->getMessage()}\n";
    echo "  (Web Services 토큰이 설정되지 않았을 수 있습니다)\n";
}

echo "\n";

// ============================================================================
// 예제 5: 통합 시나리오 - 학생 등록 및 진도 추적
// ============================================================================

echo "=== 예제 5: 통합 시나리오 ===\n\n";

// 5.1 새로운 학생을 코스에 등록
$newStudentId = 100; // 예시 학생 ID
$targetCourseId = 2; // 예시 코스 ID

echo "시나리오: 학생 ID $newStudentId를 코스 ID $targetCourseId에 등록\n\n";

// 코스 정보 확인
$targetCourse = $courseManager->getCourse($targetCourseId);

if ($targetCourse) {
    echo "✓ 대상 코스: {$targetCourse['fullname']}\n";

    // 학생 등록 (주석 처리 - 실제 실행 시 주의)
    // $enrolled = $courseManager->enrollUser($newStudentId, $targetCourseId, 'student');
    // if ($enrolled) {
    //     echo "✓ 학생 등록 완료\n";
    // }

    // 진도 추적
    $progress = $progressTracker->getCourseProgress($newStudentId, $targetCourseId);
    echo "✓ 초기 진행률: {$progress['progress_percentage']}%\n";

    // 특정 모듈 완료 처리 (주석 처리 - 실제 실행 시 주의)
    // $moduleId = 10; // 예시 모듈 ID
    // $completed = $progressTracker->markModuleCompleted($newStudentId, $moduleId);
    // if ($completed) {
    //     echo "✓ 모듈 ID $moduleId 완료 처리\n";
    // }
}

echo "\n";

// ============================================================================
// 예제 6: 하이브리드 접근 방식 (DB + API)
// ============================================================================

echo "=== 예제 6: 하이브리드 접근 방식 ===\n\n";

// DB를 통한 빠른 데이터 조회 + API를 통한 복잡한 작업

if ($user) {
    // DB를 통한 코스 목록 (빠름)
    $dbCourses = $courseManager->getUserCourses($user['id']);
    echo "✓ DB를 통해 조회한 코스: " . count($dbCourses) . "개\n";

    try {
        // API를 통한 상세 정보 (기능이 풍부함)
        $apiCourses = $apiClient->getUserCourses($user['id']);
        echo "✓ API를 통해 조회한 코스: " . count($apiCourses) . "개\n";

        // 각 코스의 완료 상태 확인 (API 전용 기능)
        foreach (array_slice($apiCourses, 0, 3) as $course) {
            $completionStatus = $apiClient->getCourseCompletionStatus($course['id'], $user['id']);
            echo "  - {$course['fullname']}: 완료 " .
                 ($completionStatus['completed'] ?? 0) . " / " .
                 count($completionStatus['statuses'] ?? []) . "\n";
        }
    } catch (Exception $e) {
        echo "  (API 사용 불가: {$e->getMessage()})\n";
    }
}

echo "\n";

// ============================================================================
// 완료
// ============================================================================

echo "=== 모든 예제 완료 ===\n";

// 연결 종료
$db->close();
