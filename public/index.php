<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alt42 Standalone - Overlay Substitute</title>
    <link rel="stylesheet" href="css/smartphone.css">
    <link rel="stylesheet" href="css/overlay.css">
</head>
<body>
    <!-- Main Control Panel -->
    <div class="control-panel">
        <h1>Alt42 Standalone v1.0</h1>
        <div class="problem-info">
            <h2 id="problem-title">문제를 불러오는 중...</h2>
            <p id="problem-description"></p>
        </div>
        <div class="controls">
            <button id="load-problem-btn" onclick="loadProblem(1)">문제 1 불러오기</button>
            <button onclick="loadProblem(2)">문제 2 불러오기</button>
            <button id="toggle-overlay-btn" onclick="toggleOverlayMode()">오버레이 모드 전환</button>
        </div>
    </div>

    <!-- Smartphone Container (우측 하단) -->
    <div class="smartphone-container">
        <div class="smartphone-frame">
            <div class="smartphone-screen">
                <div class="smartphone-header">
                    <div class="status-bar">
                        <span class="time">10:30</span>
                        <span class="battery">🔋 80%</span>
                    </div>
                    <div class="app-header">
                        <h3>Overlay Substitute</h3>
                    </div>
                </div>

                <!-- Overlay Substitute Content -->
                <div class="overlay-substitute-container">
                    <!-- Toggle Switch for Before/After -->
                    <div class="overlay-toggle">
                        <button class="toggle-btn active" data-view="before" onclick="switchView('before')">
                            치환 전 (Before)
                        </button>
                        <button class="toggle-btn" data-view="after" onclick="switchView('after')">
                            치환 후 (After)
                        </button>
                    </div>

                    <!-- Code Display Area -->
                    <div class="code-display-wrapper">
                        <!-- Before Code (Original) -->
                        <div class="code-panel active" id="before-panel">
                            <div class="panel-label">원본 코드</div>
                            <pre class="code-block" id="original-code">// 문제를 불러오세요</pre>
                        </div>

                        <!-- After Code (Substituted) -->
                        <div class="code-panel" id="after-panel">
                            <div class="panel-label">치환된 코드</div>
                            <pre class="code-block" id="substituted-code">// 문제를 불러오세요</pre>
                        </div>
                    </div>

                    <!-- Slider View (Alternative visualization) -->
                    <div class="slider-view" style="display: none;">
                        <div class="slider-container">
                            <input type="range"
                                   id="overlay-slider"
                                   min="0"
                                   max="100"
                                   value="50"
                                   class="overlay-slider"
                                   oninput="updateOverlaySlider(this.value)">
                            <div class="slider-labels">
                                <span>치환 전</span>
                                <span>치환 후</span>
                            </div>
                        </div>
                        <div class="slider-code-display">
                            <div class="slider-before" id="slider-before">
                                <pre class="code-block" id="slider-original"></pre>
                            </div>
                            <div class="slider-after" id="slider-after">
                                <pre class="code-block" id="slider-substituted"></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Answer Input Area -->
                <div class="answer-section">
                    <textarea id="user-answer"
                              placeholder="여기에 답을 입력하세요..."
                              rows="4"></textarea>
                    <button class="submit-btn" onclick="submitAnswer()">제출</button>
                </div>

                <div class="result-message" id="result-message"></div>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/overlay-substitute.js"></script>
</body>
</html>
