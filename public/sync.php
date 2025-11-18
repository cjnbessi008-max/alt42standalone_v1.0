<?php
/**
 * Moodle Data Synchronization
 */

require_once __DIR__ . '/../config/config.php';

$message = '';
$messageType = 'info';
$stats = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $moodle = new MoodleConnector();

        // Get course IDs from form
        $courseIds = [];
        if (!empty($_POST['course_ids'])) {
            $courseIds = array_map('intval', explode(',', $_POST['course_ids']));
        }

        // Sync quiz data
        $stats = $moodle->syncQuizData($courseIds);

        if (empty($stats['errors'])) {
            $message = "동기화 완료! " .
                       "{$stats['quizzes_processed']}개 퀴즈, " .
                       "{$stats['attempts_processed']}개 시도를 처리했습니다.";
            $messageType = 'success';
        } else {
            $message = "동기화 완료 (일부 오류 발생): " .
                       "{$stats['quizzes_processed']}개 퀴즈, " .
                       "{$stats['attempts_processed']}개 시도 처리. " .
                       count($stats['errors']) . "개 오류 발생.";
            $messageType = 'warning';
        }

    } catch (Exception $e) {
        $message = "동기화 중 오류 발생: " . $e->getMessage();
        $messageType = 'danger';
    }
}

// Get recent sync logs
$db = Database::getInstance();
$recentSyncs = $db->query(
    "SELECT * FROM moodle_sync_log
     ORDER BY started_at DESC
     LIMIT 10"
);

// Test Moodle connection
$connectionStatus = false;
$connectionMessage = '';
try {
    $moodle = new MoodleConnector();
    $connectionStatus = $moodle->testConnection();
    $connectionMessage = $connectionStatus ? 'Moodle 연결 성공' : 'Moodle 연결 실패';
} catch (Exception $e) {
    $connectionMessage = 'Moodle 연결 오류: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moodle 동기화 - 약한 개념 연결 탐지 시스템</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📥 Moodle 데이터 동기화</h1>
            <p><a href="index.php" style="color: white;">← 대시보드로 돌아가기</a></p>
        </div>
    </header>

    <div class="container">
        <!-- Connection Status -->
        <div class="card">
            <h2>🔌 연결 상태</h2>
            <div class="alert alert-<?= $connectionStatus ? 'success' : 'danger' ?>">
                <?= htmlspecialchars($connectionMessage) ?>
            </div>

            <?php if (!$connectionStatus): ?>
                <div class="alert alert-info">
                    <strong>Moodle 연결 설정:</strong>
                    <ul style="margin: 10px 0 0 20px;">
                        <li>Moodle URL: <code><?= MOODLE_URL ?></code></li>
                        <li>Web Service Token: <?= !empty(MOODLE_TOKEN) ? '✅ 설정됨' : '❌ 미설정' ?></li>
                    </ul>
                    <p style="margin-top: 10px;">
                        설정을 변경하려면 <code>config/config.php</code> 파일을 수정하세요.
                    </p>
                </div>
            <?php endif; ?>
        </div>

        <!-- Sync Form -->
        <div class="card">
            <h2>동기화 실행</h2>

            <?php if ($message): ?>
                <div class="alert alert-<?= $messageType ?>">
                    <?= htmlspecialchars($message) ?>
                </div>

                <?php if ($stats && !empty($stats['errors'])): ?>
                    <div class="alert alert-warning">
                        <strong>발생한 오류:</strong>
                        <ul style="margin: 10px 0 0 20px;">
                            <?php foreach ($stats['errors'] as $error): ?>
                                <li><?= htmlspecialchars($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            <?php endif; ?>

            <form method="POST" action="">
                <div style="margin: 20px 0;">
                    <label for="course_ids" style="display: block; margin-bottom: 10px; font-weight: 600;">
                        코스 ID (선택사항, 쉼표로 구분):
                    </label>
                    <input type="text"
                           id="course_ids"
                           name="course_ids"
                           placeholder="예: 1,2,3 (비워두면 모든 코스)"
                           style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                    <p style="margin-top: 5px; font-size: 0.9em; color: #7f8c8d;">
                        특정 코스만 동기화하려면 코스 ID를 입력하세요. 비워두면 모든 코스를 동기화합니다.
                    </p>
                </div>

                <button type="submit" class="btn btn-primary" style="font-size: 1.1em; padding: 15px 30px;"
                        <?= !$connectionStatus ? 'disabled' : '' ?>>
                    ▶️ 동기화 시작
                </button>
            </form>

            <div class="alert alert-info" style="margin-top: 20px;">
                <strong>동기화 프로세스:</strong>
                <ol style="margin: 10px 0 0 20px;">
                    <li>Moodle에서 퀴즈 데이터 가져오기</li>
                    <li>학생 시도 및 응답 데이터 수집</li>
                    <li>정답/오답 통계 계산</li>
                    <li>로컬 데이터베이스에 저장</li>
                </ol>
            </div>
        </div>

        <!-- Recent Syncs -->
        <div class="card">
            <h2>📋 최근 동기화 기록</h2>

            <?php if (empty($recentSyncs)): ?>
                <div class="alert alert-info">
                    아직 동기화 기록이 없습니다.
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>유형</th>
                            <th>코스 ID</th>
                            <th>처리된 레코드</th>
                            <th>성공</th>
                            <th>실패</th>
                            <th>상태</th>
                            <th>시작 시간</th>
                            <th>완료 시간</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentSyncs as $sync): ?>
                            <tr>
                                <td><?= $sync['id'] ?></td>
                                <td><?= htmlspecialchars($sync['sync_type']) ?></td>
                                <td><?= htmlspecialchars($sync['moodle_course_id'] ?? 'All') ?></td>
                                <td><?= $sync['records_processed'] ?></td>
                                <td><?= $sync['records_success'] ?></td>
                                <td><?= $sync['records_failed'] ?></td>
                                <td>
                                    <?php
                                    $badgeClass = 'badge-info';
                                    if ($sync['status'] == 'completed') $badgeClass = 'badge-success';
                                    if ($sync['status'] == 'failed') $badgeClass = 'badge-danger';
                                    ?>
                                    <span class="badge <?= $badgeClass ?>">
                                        <?= htmlspecialchars($sync['status']) ?>
                                    </span>
                                </td>
                                <td><?= $sync['started_at'] ?></td>
                                <td><?= $sync['completed_at'] ?? '-' ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <footer>
        <p>Weak Concept Link Detection System v1.0</p>
    </footer>
</body>
</html>
