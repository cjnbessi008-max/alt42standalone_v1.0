<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reverse Bloom - 부정적분 학습 시스템</title>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">

    <!-- Main Stylesheet -->
    <link rel="stylesheet" href="css/smartphone.css">

    <meta name="description" content="Reverse Bloom - Moodle 연동 부정적분 학습 시스템">
</head>
<body>

    <!-- Smartphone Container - 우측 하단 고정 -->
    <div class="smartphone-container">
        <!-- Toggle Button -->
        <button class="toggle-btn" id="toggle-btn">−</button>

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
                        ⬇️ 더 쉽게 (기초로)
                    </button>
                    <button class="bloom-btn bloom-btn-up" id="btn-up">
                        ⬆️ 더 어렵게 (종합으로)
                    </button>
                </div>

                <div class="bloom-navigation">
                    <button class="bloom-btn bloom-btn-next" id="btn-next">
                        ➡️ 다음 문제
                    </button>
                </div>

                <!-- Info Section -->
                <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 10px; font-size: 12px; color: #6c757d;">
                    <strong>Reverse Bloom이란?</strong><br>
                    복잡한 문제에서 시작하여 점점 기초 개념으로 분해하는 학습 방법입니다.
                    부정적분처럼 "원래 함수로 되돌아가기"의 원리를 교육에 적용했습니다.
                    <br><br>
                    <strong>사용 방법:</strong><br>
                    • 어려우면 "더 쉽게" 버튼으로 기초 개념 확인<br>
                    • 이해했으면 "더 어렵게" 버튼으로 도전<br>
                    • 문제를 맞추면 자동으로 다음 레벨로 진행
                </div>
            </div>
        </div>
    </div>

    <!-- Main JavaScript -->
    <script src="js/reverse-bloom.js"></script>

</body>
</html>
