<?php
/**
 * Integration Arms - Main Entry Point
 * Virtual smartphone app for learning integration by parts
 */

require_once __DIR__ . '/../src/config/moodle.php';
require_once __DIR__ . '/../src/utils/Session.php';

$session = new Session();

// Handle Moodle SSO token if provided
if (isset($_GET['token'])) {
    require_once __DIR__ . '/../src/services/MoodleService.php';
    $moodleService = new MoodleService($_GET['token']);
    $sessionData = $moodleService->createSession($_GET['token']);

    if ($sessionData['success']) {
        $session->setUser($sessionData['user_id'], [
            'username' => $sessionData['username'],
            'fullname' => $sessionData['fullname'],
            'moodle_token' => $sessionData['token']
        ]);
    }
}

// Generate CSRF token
$csrfToken = $session->generateCsrfToken();

// Check if logged in
$isLoggedIn = $session->isLoggedIn();
$userData = $session->getUserData();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Integration Arms - 부분적분 학습용 인터랙티브 앱">
    <title>Integration Arms - 부분적분 학습</title>

    <!-- CSS -->
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/smartphone.css">
    <link rel="stylesheet" href="/css/animations.css">

    <!-- KaTeX for math rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/img/icons/favicon.svg">
</head>
<body>
    <!-- Main Container -->
    <div id="app-container">
        <!-- Header -->
        <header id="main-header">
            <div class="header-content">
                <h1>
                    <span class="logo-icon">🤖</span>
                    Integration Arms
                </h1>
                <?php if ($isLoggedIn): ?>
                    <div class="user-info">
                        <span class="user-name"><?= htmlspecialchars($userData['fullname'] ?? 'User') ?></span>
                        <button id="logout-btn" class="btn btn-sm">로그아웃</button>
                    </div>
                <?php else: ?>
                    <div class="auth-info">
                        <a href="<?= MOODLE_URL ?>" class="btn btn-primary">Moodle 로그인</a>
                    </div>
                <?php endif; ?>
            </div>
        </header>

        <?php if (!$isLoggedIn): ?>
            <!-- Not Logged In Screen -->
            <div class="welcome-screen">
                <div class="welcome-content">
                    <h2>부분적분을 시각적으로 배워보세요!</h2>
                    <p>Integration Arms는 두 개의 로봇 팔이 부분적분 공식을 만드는 과정을 통해<br>
                       직관적으로 부분적분을 이해할 수 있도록 돕습니다.</p>
                    <div class="features">
                        <div class="feature">
                            <div class="feature-icon">🎯</div>
                            <h3>인터랙티브 학습</h3>
                            <p>직접 u와 dv를 선택하며 배웁니다</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🎬</div>
                            <h3>애니메이션</h3>
                            <p>공식 변환 과정을 시각화합니다</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">📊</div>
                            <h3>실시간 피드백</h3>
                            <p>즉각적인 정답 확인과 힌트 제공</p>
                        </div>
                    </div>
                    <a href="<?= MOODLE_URL ?>" class="btn btn-lg btn-primary">시작하기</a>
                </div>
            </div>
        <?php else: ?>
            <!-- Virtual Smartphone Container -->
            <div id="smartphone-container" class="smartphone-wrapper">
                <div class="smartphone">
                    <!-- Smartphone Header -->
                    <div class="smartphone-header">
                        <div class="status-bar">
                            <span class="time" id="current-time"></span>
                            <div class="status-icons">
                                <span class="signal-icon">📶</span>
                                <span class="battery-icon">🔋</span>
                            </div>
                        </div>
                        <div class="app-header">
                            <h2>Integration Arms</h2>
                            <div class="header-controls">
                                <button id="minimize-btn" class="icon-btn" title="최소화">─</button>
                                <button id="maximize-btn" class="icon-btn" title="최대화">□</button>
                                <button id="close-btn" class="icon-btn" title="닫기">×</button>
                            </div>
                        </div>
                    </div>

                    <!-- Smartphone Screen -->
                    <div class="smartphone-screen">
                        <!-- Problem Display -->
                        <div id="problem-section" class="section">
                            <h3>문제</h3>
                            <div id="problem-display" class="problem-box">
                                <div id="problem-latex"></div>
                            </div>
                            <div class="difficulty-badge" id="difficulty-badge"></div>
                        </div>

                        <!-- Robot Arms Animation Area -->
                        <div id="animation-section" class="section">
                            <canvas id="robot-canvas" width="360" height="300"></canvas>
                            <div id="animation-controls">
                                <button id="play-btn" class="btn btn-sm">▶️ 재생</button>
                                <button id="pause-btn" class="btn btn-sm" style="display:none;">⏸️ 일시정지</button>
                                <button id="replay-btn" class="btn btn-sm">🔄 다시보기</button>
                                <input type="range" id="speed-slider" min="0.5" max="2" step="0.1" value="1" title="속도 조절">
                                <span id="speed-display">1.0x</span>
                            </div>
                        </div>

                        <!-- Answer Selection -->
                        <div id="answer-section" class="section">
                            <h3>u와 dv를 선택하세요</h3>
                            <div id="selection-area">
                                <div class="selection-group">
                                    <label>u =</label>
                                    <div id="u-options" class="option-buttons"></div>
                                </div>
                                <div class="selection-group">
                                    <label>dv =</label>
                                    <div id="dv-options" class="option-buttons"></div>
                                </div>
                            </div>
                            <div id="selected-display">
                                <div>선택한 u: <span id="selected-u">-</span></div>
                                <div>선택한 dv: <span id="selected-dv">-</span></div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div id="action-section" class="section">
                            <button id="submit-btn" class="btn btn-primary btn-block">제출</button>
                            <button id="hint-btn" class="btn btn-secondary btn-block">💡 힌트</button>
                            <button id="next-btn" class="btn btn-success btn-block" style="display:none;">다음 문제</button>
                        </div>

                        <!-- Feedback Display -->
                        <div id="feedback-section" class="section" style="display:none;">
                            <div id="feedback-content" class="feedback-box"></div>
                        </div>

                        <!-- Progress Bar -->
                        <div id="progress-section" class="section">
                            <div class="progress-info">
                                <span>진도:</span>
                                <span id="progress-percentage">0%</span>
                            </div>
                            <div class="progress-bar">
                                <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                            </div>
                            <div class="stats">
                                <span>정답률: <strong id="success-rate">0%</strong></span>
                                <span>평균 시간: <strong id="avg-time">0s</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hint Modal -->
            <div id="hint-modal" class="modal" style="display:none;">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>💡 힌트</h3>
                    <div id="hint-text"></div>
                    <button class="btn btn-primary" id="hint-ok-btn">확인</button>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

    <script>
        // Global configuration
        window.APP_CONFIG = {
            apiUrl: '/src/api',
            csrfToken: '<?= $csrfToken ?>',
            userId: <?= $session->getUserId() ?? 'null' ?>,
            moodleToken: '<?= $userData['moodle_token'] ?? '' ?>'
        };
    </script>

    <script src="/js/math-parser.js"></script>
    <script src="/js/robot-arm.js"></script>
    <script src="/js/animation-engine.js"></script>
    <script src="/js/moodle-connector.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>
