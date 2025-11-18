<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>넓이 채우기 애니메이션 - KAIST Touch Math</title>

    <!-- Styles -->
    <link rel="stylesheet" href="css/styles.css">

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📐</text></svg>">
</head>
<body>
    <!-- Smartphone Frame -->
    <div class="smartphone-frame">
        <div class="screen">
            <!-- App Header -->
            <header class="app-header">
                <h1>📐 넓이 채우기 학습</h1>
                <p>KAIST Touch Math Academy</p>
            </header>

            <!-- App Content -->
            <div class="app-content">
                <!-- Problem Card -->
                <div class="problem-card">
                    <div class="problem-title" id="problemTitle">문제를 불러오는 중...</div>
                    <div class="problem-text" id="problemText">잠시만 기다려주세요.</div>
                </div>

                <!-- Animation Container -->
                <div class="animation-container">
                    <div class="animation-title">넓이 시각화</div>
                    <canvas id="animationCanvas" width="300" height="300"></canvas>

                    <!-- Control Buttons -->
                    <div class="controls">
                        <button class="btn btn-primary" id="startBtn">
                            ▶ 시작
                        </button>
                        <button class="btn btn-secondary" id="pauseBtn">
                            ⏸ 일시정지
                        </button>
                        <button class="btn btn-secondary" id="resetBtn">
                            ↻ 초기화
                        </button>
                    </div>

                    <!-- Progress Info -->
                    <div class="progress-info">
                        <div class="info-item">
                            <span class="info-label">진행률</span>
                            <span class="info-value" id="progressValue">0%</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">현재 넓이</span>
                            <span class="info-value" id="currentArea">0cm²</span>
                        </div>
                    </div>

                    <!-- Answer Display -->
                    <div class="answer-display" id="answerDisplay">
                        정답: 0cm²
                    </div>
                </div>

                <!-- New Problem Button -->
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-new-problem" id="newProblemBtn">
                        🔄 새 문제
                    </button>
                </div>

                <!-- Footer Info -->
                <div style="text-align: center; margin-top: 30px; padding: 15px; font-size: 11px; color: #999;">
                    <p>Moodle 3.7 연동 | PHP 7.1.9 | MySQL 5.7</p>
                    <p style="margin-top: 5px;">KAIST Touch Math Academy © 2025</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/area-fill-animation.js"></script>

    <!-- Debug Info (remove in production) -->
    <script>
        // Log system info for debugging
        console.log('%c넓이 채우기 애니메이션 앱', 'color: #667eea; font-size: 16px; font-weight: bold;');
        console.log('Moodle 3.7 연동 준비 완료');
        console.log('Canvas Animation Engine 초기화 완료');
    </script>
</body>
</html>
