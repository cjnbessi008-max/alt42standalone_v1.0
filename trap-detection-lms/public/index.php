<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>함정 탐지 LMS - Trap Detection Learning System</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 함정 탐지 학습 시스템</h1>
            <p class="subtitle">이 문제의 함정 찾기 - Moodle LMS 연동</p>
        </header>

        <nav class="main-nav">
            <button class="nav-btn active" data-view="student">학생 모드</button>
            <button class="nav-btn" data-view="teacher">교사 대시보드</button>
            <button class="nav-btn" data-view="analytics">분석</button>
        </nav>

        <!-- Student View -->
        <div id="student-view" class="view-section active">
            <div class="card">
                <h2>문제 풀이</h2>
                <div id="student-info">
                    <label for="student-id-input">학생 ID:</label>
                    <input type="number" id="student-id-input" placeholder="학생 ID를 입력하세요" value="1">
                </div>

                <div id="question-container" class="question-box">
                    <div class="loading">문제를 불러오는 중...</div>
                </div>

                <div id="result-container" class="result-box" style="display:none;">
                    <!-- Results will be displayed here -->
                </div>

                <div id="trap-info-container" class="trap-info" style="display:none;">
                    <!-- Trap information will be displayed here -->
                </div>
            </div>

            <div class="card">
                <h2>📊 나의 함정 현황</h2>
                <div id="student-recommendations">
                    <div class="loading">통계를 불러오는 중...</div>
                </div>
            </div>
        </div>

        <!-- Teacher View -->
        <div id="teacher-view" class="view-section">
            <div class="dashboard-grid">
                <div class="card">
                    <h2>📈 전체 통계</h2>
                    <div id="dashboard-summary">
                        <div class="loading">데이터를 불러오는 중...</div>
                    </div>
                </div>

                <div class="card">
                    <h2>🔥 가장 흔한 함정</h2>
                    <div id="common-traps">
                        <div class="loading">데이터를 불러오는 중...</div>
                    </div>
                </div>

                <div class="card full-width">
                    <h2>⏰ 최근 함정 발생</h2>
                    <div id="recent-incidents">
                        <div class="loading">데이터를 불러오는 중...</div>
                    </div>
                </div>

                <div class="card">
                    <h2>🆘 도움 요청</h2>
                    <div id="help-requests">
                        <div class="loading">데이터를 불러오는 중...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Analytics View -->
        <div id="analytics-view" class="view-section">
            <div class="card">
                <h2>📊 문제 분석</h2>
                <div>
                    <label for="analyze-question-id">문제 ID:</label>
                    <input type="number" id="analyze-question-id" placeholder="문제 ID 입력">
                    <button onclick="analyzeQuestion()">분석하기</button>
                </div>
                <div id="analysis-result"></div>
            </div>
        </div>
    </div>

    <footer>
        <p>&copy; 2025 Trap Detection LMS - KAIST Touch Math Academy</p>
    </footer>

    <script src="js/app.js"></script>
</body>
</html>
