<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stat Digest - 문제 통계 자동 요약</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Stat Digest</h1>
            <p class="subtitle">Moodle 문제 데이터 자동 요약 시스템</p>
        </header>

        <main>
            <!-- Virtual Smartphone Screen (우측 하단) -->
            <div id="smartphone-screen" class="smartphone-container">
                <div class="smartphone-frame">
                    <div class="smartphone-header">
                        <span class="time" id="current-time">00:00</span>
                        <div class="status-icons">
                            <span class="wifi-icon">📶</span>
                            <span class="battery-icon">🔋</span>
                        </div>
                    </div>

                    <div class="smartphone-content">
                        <div class="stat-digest-widget">
                            <h2>📈 Stat Digest</h2>

                            <div class="summary-card loading" id="summary-card">
                                <div class="loading-spinner">Loading...</div>
                            </div>

                            <div class="stats-grid" id="stats-grid" style="display: none;">
                                <div class="stat-item">
                                    <div class="stat-label">총 문제 수</div>
                                    <div class="stat-value" id="total-problems">-</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">총 시도 횟수</div>
                                    <div class="stat-value" id="total-attempts">-</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">평균 정확도</div>
                                    <div class="stat-value" id="avg-accuracy">-</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">평균 난이도</div>
                                    <div class="stat-value" id="avg-difficulty">-</div>
                                </div>
                            </div>

                            <div class="insights-section" id="insights-section" style="display: none;">
                                <h3>🎯 인사이트</h3>
                                <div class="insight-item">
                                    <span class="insight-label">가장 어려운 주제:</span>
                                    <span class="insight-value" id="difficult-topic">-</span>
                                </div>
                                <div class="insight-item">
                                    <span class="insight-label">학습 트렌드:</span>
                                    <span class="insight-value trend" id="trend">-</span>
                                </div>
                            </div>

                            <div class="category-breakdown" id="category-breakdown" style="display: none;">
                                <h3>📊 카테고리별 분석</h3>
                                <div id="category-list"></div>
                            </div>

                            <button class="refresh-btn" id="refresh-btn">🔄 새로고침</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Control Panel -->
            <div class="control-panel">
                <h2>⚙️ 제어 패널</h2>

                <div class="panel-section">
                    <h3>Moodle 동기화</h3>
                    <div class="input-group">
                        <label for="quiz-id">퀴즈 ID:</label>
                        <input type="number" id="quiz-id" placeholder="1">
                        <button onclick="syncQuiz()">문제 동기화</button>
                    </div>
                    <div id="sync-status" class="status-message"></div>
                </div>

                <div class="panel-section">
                    <h3>통계 계산</h3>
                    <button onclick="computeStats()">전체 통계 재계산</button>
                    <div id="compute-status" class="status-message"></div>
                </div>

                <div class="panel-section">
                    <h3>데이터베이스 설정</h3>
                    <button onclick="testConnection()">연결 테스트</button>
                    <div id="db-status" class="status-message"></div>
                </div>
            </div>
        </main>
    </div>

    <script src="js/app.js"></script>
</body>
</html>
