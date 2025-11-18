<?php
/**
 * Main Entry Point - User Login
 */

session_start();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/api/moodle_connector.php';
require_once __DIR__ . '/../src/utils/helpers.php';

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $moodle_user_id = intval($_POST['moodle_user_id'] ?? 0);

    if ($moodle_user_id > 0) {
        try {
            $moodle = new MoodleConnector();

            // Sync user from Moodle
            if ($moodle->syncUser($moodle_user_id)) {
                $local_user_id = $moodle->getLocalUserId($moodle_user_id);

                if ($local_user_id) {
                    $_SESSION['user_id'] = $local_user_id;
                    $_SESSION['moodle_user_id'] = $moodle_user_id;
                    setFlashMessage('success', '로그인 성공!');
                    redirect('dashboard.php');
                }
            }

            setFlashMessage('error', '사용자를 찾을 수 없습니다.');
        } catch (Exception $e) {
            setFlashMessage('error', 'Moodle 연결 오류: ' . $e->getMessage());
        }
    } else {
        setFlashMessage('error', '유효한 사용자 ID를 입력하세요.');
    }
}

// Check if already logged in
if (isLoggedIn()) {
    redirect('dashboard.php');
}

$flash = getFlashMessage();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS 학습 리듬 분석 - 로그인</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="login-box">
            <h1>LMS 학습 리듬 분석</h1>
            <p class="subtitle">사고 루틴 흐름 분석 시스템</p>

            <?php if ($flash): ?>
                <div class="alert alert-<?= e($flash['type']) ?>">
                    <?= e($flash['message']) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="">
                <input type="hidden" name="action" value="login">

                <div class="form-group">
                    <label for="moodle_user_id">Moodle 사용자 ID</label>
                    <input type="number"
                           id="moodle_user_id"
                           name="moodle_user_id"
                           class="form-control"
                           placeholder="Moodle 사용자 ID를 입력하세요"
                           required>
                    <small class="form-text">Moodle에서 사용하는 사용자 ID 번호를 입력하세요.</small>
                </div>

                <button type="submit" class="btn btn-primary btn-block">로그인</button>
            </form>

            <div class="info-box">
                <h3>시스템 정보</h3>
                <ul>
                    <li>학습 활동 패턴 분석</li>
                    <li>최적 학습 시간대 추천</li>
                    <li>사고 루틴 유형 파악</li>
                    <li>학습 리듬 시각화</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
