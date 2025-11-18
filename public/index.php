<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stat Story Mode - 통계 스토리 학습</title>
    <link rel="stylesheet" href="css/smartphone.css">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <!-- 스마트폰 가상 화면 (우측 하단 고정) -->
    <div id="smartphone-container">
        <!-- 스마트폰 프레임 -->
        <div class="smartphone-frame">
            <!-- 상단 바 -->
            <div class="smartphone-header">
                <div class="status-bar">
                    <span class="time" id="current-time">12:00</span>
                    <div class="status-icons">
                        <span class="battery">🔋</span>
                        <span class="signal">📶</span>
                    </div>
                </div>
                <div class="app-header">
                    <button class="back-btn" id="back-btn" style="display:none;">←</button>
                    <h1 class="app-title">Stat Story Mode</h1>
                    <button class="menu-btn" id="menu-btn">☰</button>
                </div>
            </div>

            <!-- 메인 화면 -->
            <div class="smartphone-screen" id="screen">
                <!-- 홈 화면 -->
                <div id="home-screen" class="screen-content active">
                    <div class="welcome-section">
                        <div class="welcome-icon">📊</div>
                        <h2>통계 스토리 모드</h2>
                        <p>스토리를 통해 즐겁게 통계를 배워보세요!</p>
                    </div>

                    <div class="student-info" id="student-info">
                        <p>학생 ID: <span id="student-id">입력 필요</span></p>
                        <button class="btn-primary" id="set-student-btn">학생 ID 설정</button>
                    </div>

                    <div class="scenarios-list" id="scenarios-list">
                        <h3>스토리 목록</h3>
                        <div class="loading">로딩 중...</div>
                    </div>
                </div>

                <!-- 스토리 상세 화면 -->
                <div id="story-screen" class="screen-content">
                    <div class="story-header">
                        <h2 id="story-title"></h2>
                        <p id="story-description"></p>
                        <div class="story-meta">
                            <span class="badge" id="story-difficulty"></span>
                            <span class="badge" id="story-grade"></span>
                        </div>
                    </div>

                    <div class="story-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                        </div>
                        <p class="progress-text"><span id="progress-current">0</span> / <span id="progress-total">0</span> 단계</p>
                    </div>

                    <div class="story-content" id="story-content">
                        <!-- 동적으로 채워짐 -->
                    </div>

                    <div class="story-actions">
                        <button class="btn-secondary" id="hint-btn" style="display:none;">💡 힌트</button>
                        <button class="btn-primary" id="next-btn" style="display:none;">다음</button>
                        <button class="btn-primary" id="submit-btn" style="display:none;">제출</button>
                    </div>
                </div>

                <!-- 결과 화면 -->
                <div id="result-screen" class="screen-content">
                    <div class="result-container">
                        <div class="result-icon" id="result-icon">🎉</div>
                        <h2 id="result-title">완료!</h2>
                        <p id="result-message"></p>
                        <div class="result-stats">
                            <div class="stat-item">
                                <span class="stat-label">점수</span>
                                <span class="stat-value" id="final-score">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">정답률</span>
                                <span class="stat-value" id="accuracy">0%</span>
                            </div>
                        </div>
                        <button class="btn-primary" id="home-btn">홈으로</button>
                    </div>
                </div>

                <!-- 메뉴 화면 -->
                <div id="menu-screen" class="screen-content">
                    <div class="menu-list">
                        <button class="menu-item" id="my-progress-btn">📈 내 진행 상황</button>
                        <button class="menu-item" id="concepts-btn">📚 통계 개념</button>
                        <button class="menu-item" id="settings-btn">⚙️ 설정</button>
                        <button class="menu-item" id="close-menu-btn">✕ 닫기</button>
                    </div>
                </div>

                <!-- 진행 상황 화면 -->
                <div id="progress-screen" class="screen-content">
                    <h2>내 진행 상황</h2>
                    <div id="progress-list" class="progress-list">
                        <div class="loading">로딩 중...</div>
                    </div>
                </div>

                <!-- 통계 개념 화면 -->
                <div id="concepts-screen" class="screen-content">
                    <h2>통계 개념</h2>
                    <div id="concepts-list" class="concepts-list">
                        <div class="loading">로딩 중...</div>
                    </div>
                </div>
            </div>

            <!-- 하단 네비게이션 -->
            <div class="smartphone-footer">
                <button class="nav-btn" id="nav-home">🏠</button>
                <button class="nav-btn" id="nav-story">📖</button>
                <button class="nav-btn" id="nav-profile">👤</button>
            </div>
        </div>

        <!-- 최소화/최대화 버튼 -->
        <button class="toggle-btn" id="toggle-btn">_</button>
    </div>

    <!-- JavaScript -->
    <script src="js/app.js"></script>
    <script src="js/story-mode.js"></script>

    <script>
        // 시간 업데이트
        function updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('current-time').textContent = `${hours}:${minutes}`;
        }
        updateTime();
        setInterval(updateTime, 60000);
    </script>
</body>
</html>
