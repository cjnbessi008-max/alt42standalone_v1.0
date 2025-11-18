<?php
/**
 * Main Entry Point for Sequence Puzzle
 * Handles LTI launch and application bootstrap
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle_config.php';
require_once __DIR__ . '/../src/Moodle/LTIProvider.php';

$db = Database::getInstance();
$ltiProvider = new LTIProvider($db);

// Handle LTI launch
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['lti_message_type'])) {
    // Validate LTI request
    if (!$ltiProvider->validateLaunchRequest($_POST)) {
        die('Invalid LTI launch request');
    }

    // Create session
    $sessionData = $ltiProvider->createSession($_POST);

    // Store LTI context
    $_SESSION['context_id'] = $_POST['context_id'] ?? null;
    $_SESSION['resource_link_id'] = $_POST['resource_link_id'] ?? null;

    // Redirect to app
    header('Location: index.php?session_token=' . $sessionData['session_token']);
    exit;
}

// Check for existing session
$sessionToken = $_GET['session_token'] ?? $_SESSION['session_token'] ?? null;
$session = null;

if ($sessionToken) {
    $session = $ltiProvider->validateSession($sessionToken);
    if ($session) {
        $_SESSION['session_token'] = $sessionToken;
    }
}

// For demo purposes, create a demo session if no session exists
if (!$session && DEBUG_MODE) {
    $demoSessionToken = 'demo_' . bin2hex(random_bytes(16));
    $_SESSION['session_token'] = $demoSessionToken;
    $_SESSION['user_name'] = 'Demo Student';
    $sessionToken = $demoSessionToken;

    // Create demo session in database
    $db->execute(
        "INSERT INTO student_sessions (moodle_user_id, session_token, user_name, user_email)
         VALUES (999, ?, 'Demo Student', 'demo@example.com')
         ON DUPLICATE KEY UPDATE session_token = VALUES(session_token)",
        [$demoSessionToken]
    );
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sequence Puzzle - 수열 퍼즐</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="main-container">
        <!-- Left side: Instructions and controls -->
        <div class="left-panel">
            <header>
                <h1>🧩 Sequence Puzzle</h1>
                <p class="subtitle">수열의 규칙을 찾아 퍼즐을 완성하세요!</p>
                <?php if (isset($_SESSION['user_name'])): ?>
                    <p class="user-info">👤 <?php echo htmlspecialchars($_SESSION['user_name']); ?></p>
                <?php endif; ?>
            </header>

            <div class="control-panel">
                <div class="category-selector">
                    <h3>카테고리 선택</h3>
                    <select id="category-select">
                        <option value="">모든 카테고리</option>
                    </select>
                </div>

                <div class="difficulty-selector">
                    <h3>난이도 선택</h3>
                    <div class="difficulty-buttons">
                        <button class="btn-difficulty" data-difficulty="easy">쉬움</button>
                        <button class="btn-difficulty" data-difficulty="medium">보통</button>
                        <button class="btn-difficulty" data-difficulty="hard">어려움</button>
                        <button class="btn-difficulty active" data-difficulty="">모두</button>
                    </div>
                </div>

                <button id="btn-new-puzzle" class="btn-primary">새 문제 시작</button>

                <div class="progress-summary">
                    <h3>학습 진도</h3>
                    <div id="progress-stats">
                        <div class="stat-item">
                            <span class="stat-label">푼 문제:</span>
                            <span id="stat-solved">0</span> / <span id="stat-total">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">정답률:</span>
                            <span id="stat-rate">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">총 점수:</span>
                            <span id="stat-score">0</span>점
                        </div>
                    </div>
                </div>
            </div>

            <div class="instructions">
                <h3>게임 방법</h3>
                <ol>
                    <li>수열의 패턴을 분석하세요</li>
                    <li>올바른 퍼즐 조각을 순서대로 선택하세요</li>
                    <li>모든 조각을 맞추면 정답 확인!</li>
                    <li>빠르게 풀수록 보너스 점수를 받아요</li>
                </ol>
            </div>
        </div>

        <!-- Right side: Virtual smartphone display -->
        <div class="right-panel">
            <div class="smartphone-frame">
                <div class="smartphone-screen">
                    <div id="app-container">
                        <!-- App content loads here -->
                        <div id="welcome-screen" class="screen active">
                            <h2>🎯 수열 퍼즐에 오신 것을 환영합니다!</h2>
                            <p>왼쪽에서 난이도를 선택하고<br>"새 문제 시작" 버튼을 눌러주세요.</p>
                            <div class="welcome-icon">📱</div>
                        </div>

                        <div id="puzzle-screen" class="screen">
                            <div class="puzzle-header">
                                <h2 id="puzzle-title">문제 제목</h2>
                                <div class="puzzle-meta">
                                    <span id="puzzle-difficulty" class="badge">난이도</span>
                                    <span id="puzzle-timer" class="timer">⏱️ 0:00</span>
                                </div>
                            </div>

                            <div class="puzzle-description">
                                <p id="puzzle-desc">문제 설명</p>
                            </div>

                            <div class="sequence-display">
                                <h3>수열:</h3>
                                <div id="sequence-numbers" class="sequence-numbers"></div>
                            </div>

                            <div class="puzzle-area">
                                <h3>퍼즐 조각 선택:</h3>
                                <div id="puzzle-pieces" class="puzzle-pieces"></div>
                            </div>

                            <div class="selected-pieces">
                                <h3>선택한 조각:</h3>
                                <div id="selected-area" class="selected-area">
                                    <p class="placeholder">위에서 조각을 선택해주세요</p>
                                </div>
                            </div>

                            <div class="puzzle-actions">
                                <button id="btn-hint" class="btn-secondary">💡 힌트 보기</button>
                                <button id="btn-reset" class="btn-secondary">🔄 다시 선택</button>
                                <button id="btn-submit" class="btn-primary" disabled>✓ 정답 확인</button>
                            </div>

                            <div id="hint-display" class="hint-box" style="display: none;">
                                <strong>💡 힌트:</strong>
                                <p id="hint-text"></p>
                                <small>※ 힌트를 사용하면 점수가 20% 감소합니다</small>
                            </div>
                        </div>

                        <div id="result-screen" class="screen">
                            <div id="result-content">
                                <!-- Result content will be injected here -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="smartphone-notch"></div>
                <div class="smartphone-button"></div>
            </div>
        </div>
    </div>

    <script>
        const SESSION_TOKEN = '<?php echo $sessionToken ?? ''; ?>';
        const API_URL = 'api.php';
    </script>
    <script src="js/app.js"></script>
</body>
</html>
