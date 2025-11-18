<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Color Pattern Classifier</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Virtual Smartphone Frame -->
    <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">

            <!-- App Container -->
            <div id="app" class="app-container">

                <!-- Header -->
                <header class="app-header">
                    <h1>🎨 Color Pattern</h1>
                    <div class="user-info">
                        <span id="user-level">Lv. 1</span>
                        <span id="user-score">0점</span>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="app-main">

                    <!-- Welcome Screen -->
                    <div id="welcome-screen" class="screen active">
                        <div class="welcome-content">
                            <h2>수열 패턴 분류 게임</h2>
                            <p>수열을 보고 알맞은 색깔로 분류해보세요!</p>

                            <div class="pattern-info">
                                <h3>패턴 종류:</h3>
                                <div class="pattern-list" id="pattern-templates"></div>
                            </div>

                            <div class="start-options">
                                <label>난이도 선택:</label>
                                <select id="difficulty-select">
                                    <option value="1">쉬움</option>
                                    <option value="2">보통</option>
                                    <option value="3">어려움</option>
                                    <option value="4">매우 어려움</option>
                                    <option value="5">전문가</option>
                                </select>
                            </div>

                            <button class="btn btn-primary btn-large" onclick="startGame()">
                                게임 시작
                            </button>
                        </div>
                    </div>

                    <!-- Game Screen -->
                    <div id="game-screen" class="screen">
                        <div class="game-header">
                            <div class="timer">
                                <span>⏱️ <span id="timer">00:00</span></span>
                            </div>
                            <div class="attempt-info">
                                <span>시도: <span id="attempt-number">1</span>/5</span>
                            </div>
                        </div>

                        <div class="problem-container">
                            <h3>수열을 분석하고 패턴을 찾아보세요:</h3>

                            <div class="sequence-display" id="sequence-display">
                                <!-- Sequence numbers will be inserted here -->
                            </div>

                            <div class="question">
                                <p>이 수열은 어떤 패턴인가요?</p>
                            </div>

                            <div class="color-options" id="color-options">
                                <!-- Color buttons will be inserted here -->
                            </div>

                            <div class="selected-answer">
                                <p>선택한 답:</p>
                                <div id="selected-color" class="selected-color-box">
                                    선택 안됨
                                </div>
                            </div>

                            <div class="action-buttons">
                                <button class="btn btn-secondary" onclick="showWelcomeScreen()">
                                    뒤로
                                </button>
                                <button class="btn btn-primary" onclick="submitAnswer()">
                                    제출하기
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Result Screen -->
                    <div id="result-screen" class="screen">
                        <div class="result-content">
                            <div class="result-icon" id="result-icon">
                                <!-- Icon will be inserted -->
                            </div>

                            <h2 id="result-title">결과</h2>
                            <p id="result-message"></p>

                            <div class="score-display">
                                <div class="score-circle">
                                    <span id="result-score">0</span>
                                    <span class="score-label">점</span>
                                </div>
                            </div>

                            <div class="result-details" id="result-details">
                                <!-- Detailed feedback -->
                            </div>

                            <div class="action-buttons">
                                <button class="btn btn-secondary" onclick="showWelcomeScreen()">
                                    메인으로
                                </button>
                                <button class="btn btn-primary" onclick="nextProblem()">
                                    다음 문제
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Screen -->
                    <div id="progress-screen" class="screen">
                        <div class="progress-content">
                            <h2>나의 진행상황</h2>

                            <div class="stats-grid" id="stats-grid">
                                <!-- Statistics will be inserted -->
                            </div>

                            <div class="pattern-progress" id="pattern-progress">
                                <!-- Progress by pattern type -->
                            </div>

                            <button class="btn btn-secondary" onclick="showWelcomeScreen()">
                                뒤로
                            </button>
                        </div>
                    </div>

                </main>

                <!-- Bottom Navigation -->
                <nav class="bottom-nav">
                    <button class="nav-btn" onclick="showWelcomeScreen()">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-label">홈</span>
                    </button>
                    <button class="nav-btn" onclick="showProgressScreen()">
                        <span class="nav-icon">📊</span>
                        <span class="nav-label">진행상황</span>
                    </button>
                    <button class="nav-btn" onclick="showLeaderboard()">
                        <span class="nav-icon">🏆</span>
                        <span class="nav-label">리더보드</span>
                    </button>
                </nav>

            </div>

        </div>
        <div class="phone-home-button"></div>
    </div>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="spinner"></div>
        <p>로딩중...</p>
    </div>

    <script src="js/app.js"></script>
</body>
</html>
