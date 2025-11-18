<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reverse Bloom - Embed Version</title>
    <style>
        /* Minimal styling for embed version */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            overflow: hidden;
        }

        .embed-container {
            width: 100%;
            height: 100vh;
            background: white;
            overflow-y: auto;
        }
    </style>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">

    <!-- Main Stylesheet (with modifications for embed) -->
    <link rel="stylesheet" href="css/smartphone.css">

    <style>
        /* Override smartphone positioning for embed */
        .smartphone-container {
            position: relative;
            bottom: auto;
            right: auto;
            margin: 0 auto;
            box-shadow: none;
        }

        .toggle-btn {
            display: none; /* No minimize in embed mode */
        }
    </style>
</head>
<body>

    <div class="embed-container">
        <!-- Smartphone Container - centered for embed -->
        <div class="smartphone-container">
            <!-- Phone Frame -->
            <div class="phone-frame">
                <!-- Notch -->
                <div class="phone-notch"></div>

                <!-- Screen Content -->
                <div class="phone-screen">
                    <!-- App Header -->
                    <div class="app-header">
                        <h1>Reverse Bloom</h1>
                        <div class="subtitle">부정적분 학습 시스템</div>
                    </div>

                    <!-- Bloom Level Indicator -->
                    <div class="bloom-indicator">
                        <div class="bloom-level">
                            <span id="bloom-level-text">창조 (Create)</span>
                            <span id="bloom-description">복잡한 문제 해결</span>
                        </div>
                        <div class="bloom-progress">
                            <div class="bloom-progress-bar" id="bloom-progress-bar" style="width: 16.67%;"></div>
                        </div>
                    </div>

                    <!-- Question Card -->
                    <div class="question-card">
                        <span class="question-type" id="question-type">Loading</span>

                        <div class="question-text" id="question-text">
                            문제를 불러오는 중...
                        </div>

                        <!-- Answers Container -->
                        <div class="answers-container" id="answers-container">
                            <!-- Dynamically populated -->
                        </div>

                        <!-- Hint -->
                        <div class="question-hint" id="question-hint">
                            💡 힌트: 로딩 중...
                        </div>
                    </div>

                    <!-- Bloom Navigation -->
                    <div class="bloom-navigation">
                        <button class="bloom-btn bloom-btn-down" id="btn-down">
                            ⬇️ 더 쉽게
                        </button>
                        <button class="bloom-btn bloom-btn-up" id="btn-up">
                            ⬆️ 더 어렵게
                        </button>
                    </div>

                    <div class="bloom-navigation">
                        <button class="bloom-btn bloom-btn-next" id="btn-next">
                            ➡️ 다음 문제
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main JavaScript -->
    <script src="js/reverse-bloom.js"></script>

</body>
</html>
