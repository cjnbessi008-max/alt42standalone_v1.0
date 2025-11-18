<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wave Rate - 함수 변화율 시각화</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- 메인 컨텐츠 영역 -->
    <div class="main-content">
        <header>
            <h1>Wave Rate</h1>
            <p>함수 변화율을 파동으로 시각화하는 학습 도구</p>
        </header>

        <div class="control-panel">
            <div class="problem-selector">
                <label for="problem-select">문제 선택:</label>
                <select id="problem-select">
                    <option value="">로딩 중...</option>
                </select>
            </div>

            <div class="function-info">
                <h3 id="question-text">문제를 선택하세요</h3>
                <p>함수: <span id="function-expression">-</span></p>
                <p>난이도: <span id="difficulty-level">-</span></p>
            </div>

            <div class="controls">
                <button id="start-btn" class="btn btn-primary">시작</button>
                <button id="pause-btn" class="btn btn-secondary" disabled>일시정지</button>
                <button id="reset-btn" class="btn btn-warning">초기화</button>
                <button id="submit-btn" class="btn btn-success">제출</button>
            </div>

            <div class="parameters">
                <label>애니메이션 속도:
                    <input type="range" id="speed-slider" min="0.1" max="5" step="0.1" value="1">
                    <span id="speed-value">1.0x</span>
                </label>
                <label>파동 진폭 배율:
                    <input type="range" id="amplitude-slider" min="0.5" max="3" step="0.1" value="1">
                    <span id="amplitude-value">1.0x</span>
                </label>
            </div>
        </div>
    </div>

    <!-- 우측 하단 가상 스마트폰 화면 -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-notch"></div>
            <div class="smartphone-screen">
                <div class="status-bar">
                    <span class="time">12:34</span>
                    <div class="indicators">
                        <span class="battery">🔋</span>
                        <span class="signal">📶</span>
                    </div>
                </div>

                <div class="app-content">
                    <h2 class="app-title">Wave Rate Visualizer</h2>

                    <!-- Canvas for Wave Rate Visualization -->
                    <canvas id="wave-canvas" width="300" height="400"></canvas>

                    <div class="wave-info">
                        <p>X: <span id="current-x">0.00</span></p>
                        <p>f(x): <span id="current-y">0.00</span></p>
                        <p>f'(x): <span id="current-derivative">0.00</span></p>
                        <p>변화율: <span id="rate-percentage">0%</span></p>
                    </div>

                    <div class="legend">
                        <div class="legend-item">
                            <span class="color-box" style="background: #4A90E2;"></span>
                            <span>원함수 f(x)</span>
                        </div>
                        <div class="legend-item">
                            <span class="color-box" style="background: #E74C3C;"></span>
                            <span>도함수 f'(x)</span>
                        </div>
                        <div class="legend-item">
                            <span class="color-box" style="background: #2ECC71;"></span>
                            <span>파동 표현</span>
                        </div>
                    </div>
                </div>

                <div class="home-button"></div>
            </div>
        </div>
    </div>

    <!-- Student ID (Hidden, normally from LMS session) -->
    <input type="hidden" id="student-id" value="1">
    <input type="hidden" id="moodle-attempt-id" value="">

    <script src="js/wave-rate.js"></script>
    <script src="js/smartphone-ui.js"></script>
</body>
</html>
