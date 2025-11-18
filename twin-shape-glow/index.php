<?php
/**
 * Twin Shape Glow - Main Application
 * Educational game integrated with Moodle LMS
 */

session_start();
require_once __DIR__ . '/includes/moodle_integration.php';

// Get parameters from URL
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1;
$question_id = isset($_GET['question_id']) ? intval($_GET['question_id']) : null;
$problem_id = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

$moodle = new MoodleIntegration();

// If question_id provided, create a new problem
if ($question_id && !$problem_id) {
    $result = $moodle->createProblemFromQuestion($question_id, 'shape_matching', 1);
    if (isset($result['problem_id'])) {
        $problem_id = $result['problem_id'];
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Twin Shape Glow - KAIST Touch Math</title>
    <link rel="stylesheet" href="css/smartphone.css">
    <link rel="stylesheet" href="css/game.css">
</head>
<body>
    <div class="main-container">
        <!-- Left side: Instructions and controls -->
        <div class="left-panel">
            <div class="header">
                <h1>Twin Shape Glow</h1>
                <p class="subtitle">닮음 도형 찾기 게임</p>
            </div>

            <div class="instructions">
                <h2>게임 방법</h2>
                <ul>
                    <li>화면에서 서로 닮은 도형을 찾으세요</li>
                    <li>첫 번째 도형을 클릭하면 빛이 나기 시작합니다</li>
                    <li>같은 그룹의 두 번째 도형을 클릭하세요</li>
                    <li>올바르게 매칭되면 두 도형의 색이 통일됩니다</li>
                    <li>모든 쌍을 찾으면 게임이 완료됩니다!</li>
                </ul>

                <h2>How to Play</h2>
                <ul>
                    <li>Find similar shapes on the screen</li>
                    <li>Click the first shape - it will start glowing</li>
                    <li>Click its twin/similar shape</li>
                    <li>When matched correctly, both shapes sync to the same color</li>
                    <li>Find all pairs to complete the game!</li>
                </ul>
            </div>

            <div class="controls">
                <div class="stats">
                    <div class="stat-item">
                        <span class="stat-label">시간:</span>
                        <span class="stat-value" id="timer">00:00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">점수:</span>
                        <span class="stat-value" id="score">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">남은 쌍:</span>
                        <span class="stat-value" id="pairs-remaining">-</span>
                    </div>
                </div>

                <div class="button-group">
                    <button id="btn-start" class="btn btn-primary">게임 시작 / Start Game</button>
                    <button id="btn-reset" class="btn btn-secondary">다시 하기 / Reset</button>
                    <button id="btn-hint" class="btn btn-info">힌트 / Hint</button>
                </div>
            </div>

            <div class="progress-info" id="progress-info">
                <!-- Progress will be loaded here -->
            </div>
        </div>

        <!-- Right side: Virtual smartphone display -->
        <div class="right-panel">
            <div class="smartphone-container">
                <div class="smartphone-frame">
                    <div class="smartphone-notch"></div>
                    <div class="smartphone-screen">
                        <div class="screen-header">
                            <span class="screen-time" id="screen-time">15:42</span>
                            <span class="screen-battery">
                                <svg width="24" height="12" viewBox="0 0 24 12">
                                    <rect x="0" y="2" width="18" height="8" rx="2" fill="none" stroke="#fff" stroke-width="1"/>
                                    <rect x="2" y="4" width="14" height="4" fill="#4CAF50"/>
                                    <rect x="18" y="4" width="2" height="4" rx="1" fill="#fff"/>
                                </svg>
                            </span>
                        </div>

                        <div class="game-container" id="game-container">
                            <div class="game-title">Twin Shape Glow</div>
                            <div class="game-canvas" id="game-canvas">
                                <!-- Shapes will be rendered here -->
                            </div>
                            <div class="game-message" id="game-message"></div>
                        </div>
                    </div>
                    <div class="smartphone-home-button"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Pass PHP data to JavaScript -->
    <script>
        const APP_CONFIG = {
            userId: <?php echo $user_id; ?>,
            problemId: <?php echo $problem_id ?: 'null'; ?>,
            questionId: <?php echo $question_id ?: 'null'; ?>
        };
    </script>

    <script src="js/game-engine.js"></script>
    <script src="js/shape-renderer.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
