<?php
/**
 * Dot Product Heat Visualization - Main Entry Point
 * Standalone web app with smartphone UI
 */

require_once __DIR__ . '/config.php';

// Get parameters from URL (would come from Moodle LTI launch in production)
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1;
$problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : 1;
$userName = isset($_GET['user_name']) ? htmlspecialchars($_GET['user_name']) : 'Student';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - Vector Dot Product Visualization</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* Inline critical CSS for faster initial render */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <!-- Smartphone Container (positioned bottom-right) -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-notch"></div>
            <div class="smartphone-screen">

                <!-- App Header -->
                <header class="app-header">
                    <h1>🔥 Dot Product Heat</h1>
                    <p class="user-info">👤 <?php echo $userName; ?></p>
                </header>

                <!-- Problem Display -->
                <section class="problem-section" id="problemSection">
                    <div class="loading">문제를 불러오는 중...</div>
                </section>

                <!-- Vector Visualization Canvas -->
                <section class="visualization-section">
                    <canvas id="vectorCanvas" width="300" height="300"></canvas>
                    <div class="heat-indicator" id="heatIndicator">
                        <div class="heat-bar" id="heatBar"></div>
                        <div class="heat-labels">
                            <span>❄️ Cold</span>
                            <span>🌡️ Neutral</span>
                            <span>🔥 Hot</span>
                        </div>
                    </div>
                </section>

                <!-- Answer Input -->
                <section class="answer-section">
                    <div class="input-group">
                        <label for="answerInput">내적값 계산:</label>
                        <input
                            type="number"
                            id="answerInput"
                            placeholder="답을 입력하세요"
                            step="0.01"
                        >
                    </div>
                    <button id="submitBtn" class="submit-btn">제출하기</button>
                    <div id="feedback" class="feedback"></div>
                </section>

                <!-- Attempt History -->
                <section class="history-section" id="historySection">
                    <h3>📊 시도 기록</h3>
                    <div id="attemptsList" class="attempts-list"></div>
                </section>

            </div>
        </div>
    </div>

    <!-- Configuration passed to JavaScript -->
    <script>
        const APP_CONFIG = {
            userId: <?php echo $userId; ?>,
            problemId: <?php echo $problemId; ?>,
            userName: <?php echo json_encode($userName); ?>,
            apiBase: '<?php echo rtrim($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']), '/'); ?>',
            debug: <?php echo DEBUG_MODE ? 'true' : 'false'; ?>
        };
    </script>

    <script src="js/dot_product_heat.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
