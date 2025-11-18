<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rhythm Seq - 리듬 수열 학습 앱</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <!-- Left Side: Control Panel -->
        <div class="control-panel">
            <header>
                <h1>🎵 Rhythm Seq</h1>
                <p class="subtitle">리듬감 있게 배우는 수열</p>
            </header>

            <div class="question-info">
                <h2>문제 정보</h2>
                <div id="question-display">
                    <p class="loading">문제를 불러오는 중...</p>
                </div>
            </div>

            <div class="controls">
                <h3>컨트롤</h3>
                <div class="button-group">
                    <button id="btn-load-question" class="btn btn-primary">
                        <span>📚</span> 문제 불러오기
                    </button>
                    <button id="btn-start-animation" class="btn btn-success" disabled>
                        <span>▶️</span> 애니메이션 시작
                    </button>
                    <button id="btn-pause-animation" class="btn btn-warning" disabled>
                        <span>⏸️</span> 일시정지
                    </button>
                    <button id="btn-reset" class="btn btn-danger" disabled>
                        <span>🔄</span> 초기화
                    </button>
                </div>

                <div class="settings">
                    <label for="speed-slider">애니메이션 속도:</label>
                    <input type="range" id="speed-slider" min="1" max="10" value="5" step="1">
                    <span id="speed-value">5</span>
                </div>

                <div class="settings">
                    <label for="question-select">문제 선택:</label>
                    <select id="question-select" class="form-select">
                        <option value="">문제를 선택하세요</option>
                    </select>
                </div>
            </div>

            <div class="info-panel">
                <h3>앱 정보</h3>
                <ul>
                    <li><strong>버전:</strong> 1.0.0</li>
                    <li><strong>LMS:</strong> Moodle 3.7</li>
                    <li><strong>기술:</strong> PHP 7.1.9, MySQL 5.7</li>
                </ul>
            </div>
        </div>

        <!-- Right Side: Smartphone Display -->
        <div class="smartphone-container">
            <div class="smartphone">
                <div class="smartphone-notch"></div>
                <div class="smartphone-screen">
                    <div class="app-header">
                        <span class="time" id="current-time">12:00</span>
                        <div class="status-icons">
                            <span>📶</span>
                            <span>🔋</span>
                        </div>
                    </div>

                    <div class="app-content">
                        <h2 class="app-title">Rhythm Seq</h2>

                        <div id="sequence-display" class="sequence-display">
                            <p class="placeholder-text">수열 데이터를 불러오세요</p>
                        </div>

                        <div id="animation-stage" class="animation-stage">
                            <!-- Sequence numbers will be animated here -->
                        </div>

                        <div class="progress-bar">
                            <div id="progress-fill" class="progress-fill"></div>
                        </div>
                    </div>

                    <div class="app-footer">
                        <div class="nav-buttons">
                            <button class="nav-btn">🏠</button>
                            <button class="nav-btn">◀️</button>
                            <button class="nav-btn">⏹️</button>
                        </div>
                    </div>
                </div>
                <div class="smartphone-home-button"></div>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast-container"></div>

    <script src="js/rhythm-seq.js"></script>
</body>
</html>
