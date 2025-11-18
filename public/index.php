<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angle Light - 벡터 각도 학습</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Main Container -->
    <div class="container">
        <!-- Header -->
        <header class="header">
            <h1>🔦 Angle Light</h1>
            <p class="subtitle">두 벡터의 각도를 빛의 밝기로 표현하는 인터랙티브 학습 도구</p>
            <div class="user-info">
                <span id="studentName">학생: 김철수</span>
                <span id="studentScore">평균 점수: --</span>
            </div>
        </header>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Panel: Problem List -->
            <aside class="problem-list">
                <h2>문제 목록</h2>
                <div class="difficulty-filter">
                    <button class="filter-btn active" data-difficulty="all">전체</button>
                    <button class="filter-btn" data-difficulty="easy">쉬움</button>
                    <button class="filter-btn" data-difficulty="medium">중급</button>
                    <button class="filter-btn" data-difficulty="hard">어려움</button>
                </div>
                <div id="problemListContainer" class="problems">
                    <!-- Problems will be loaded here -->
                </div>
            </aside>

            <!-- Center Panel: Vector Visualization -->
            <section class="visualization-panel">
                <div class="problem-header">
                    <h2 id="problemTitle">문제를 선택하세요</h2>
                    <p id="problemDescription"></p>
                </div>

                <div class="canvas-container">
                    <canvas id="vectorCanvas" width="600" height="600"></canvas>
                    <div class="light-overlay" id="lightOverlay"></div>
                </div>

                <div class="controls">
                    <div class="control-group">
                        <label>벡터 2 각도:</label>
                        <input type="range" id="angleSlider" min="0" max="360" value="45" step="0.1">
                        <span id="currentAngle">45.0°</span>
                    </div>

                    <div class="control-group">
                        <label>목표 각도:</label>
                        <span id="targetAngle" class="target-value">--°</span>
                        <label>허용 오차:</label>
                        <span id="tolerance" class="target-value">±--°</span>
                    </div>

                    <div class="control-group">
                        <label>각도 차이:</label>
                        <span id="angleDifference" class="difference-value">--°</span>
                        <label>빛 밝기:</label>
                        <span id="lightIntensity" class="intensity-value">--%</span>
                    </div>

                    <div class="action-buttons">
                        <button id="resetBtn" class="btn btn-secondary">리셋</button>
                        <button id="submitBtn" class="btn btn-primary">답안 제출</button>
                    </div>
                </div>

                <div class="feedback" id="feedbackPanel" style="display: none;">
                    <div class="feedback-content">
                        <h3 id="feedbackTitle"></h3>
                        <p id="feedbackMessage"></p>
                        <div class="feedback-stats">
                            <span>점수: <strong id="feedbackScore">--</strong></span>
                            <span>시도: <strong id="feedbackAttempts">--</strong></span>
                            <span>시간: <strong id="feedbackTime">--</strong>초</span>
                        </div>
                    </div>
                </div>

                <div class="timer">
                    <span>⏱️ 소요 시간: <strong id="timeDisplay">00:00</strong></span>
                    <span>📊 시도: <strong id="attemptDisplay">0/3</strong></span>
                </div>
            </section>

            <!-- Right Panel: Virtual Smartphone -->
            <aside class="smartphone-container">
                <div class="smartphone">
                    <div class="smartphone-header">
                        <div class="camera"></div>
                        <div class="speaker"></div>
                    </div>
                    <div class="smartphone-screen" id="smartphoneScreen">
                        <!-- Smartphone content will be rendered here -->
                        <div class="phone-content">
                            <h3>📱 모바일 뷰</h3>
                            <div id="phoneProblemInfo">
                                <p>문제를 선택하면 여기에 표시됩니다.</p>
                            </div>
                            <div id="phoneVisualization">
                                <canvas id="phoneCanvas" width="280" height="280"></canvas>
                            </div>
                            <div id="phoneControls">
                                <div class="phone-angle-display">
                                    <div class="angle-meter">
                                        <div class="meter-label">현재 각도</div>
                                        <div class="meter-value" id="phoneMeterValue">45.0°</div>
                                        <div class="meter-bar">
                                            <div class="meter-fill" id="phoneMeterFill" style="width: 12.5%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="smartphone-footer">
                        <div class="home-button"></div>
                    </div>
                </div>
            </aside>
        </div>
    </div>

    <!-- Loading Indicator -->
    <div id="loadingOverlay" class="loading-overlay" style="display: none;">
        <div class="spinner"></div>
        <p>로딩 중...</p>
    </div>

    <!-- Scripts -->
    <script>
        // Configuration
        const CONFIG = {
            API_BASE: '/src/api',
            STUDENT_ID: 1, // TODO: Get from session/auth
            MOODLE_COURSE_ID: null
        };
    </script>
    <script src="js/angle-light.js"></script>
    <script src="js/smartphone-ui.js"></script>
</body>
</html>
