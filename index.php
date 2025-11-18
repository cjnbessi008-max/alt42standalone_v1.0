<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slope Heat Map - Moodle Learning Analytics</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header>
            <h1>Slope Heat Map</h1>
            <p class="subtitle">Moodle LMS 연동 학습 난이도 분석 시스템</p>
        </header>

        <div class="main-content">
            <!-- Desktop Panel - Left Side -->
            <div class="desktop-panel">
                <div class="panel-header">
                    <h2>학습 기울기 분석</h2>
                    <button class="btn" id="refresh-btn">데이터 새로고침</button>
                </div>

                <!-- Controls -->
                <div class="controls">
                    <div class="control-group">
                        <label for="course-select">코스 선택</label>
                        <select id="course-select">
                            <option value="">전체 코스</option>
                            <option value="1">코스 1</option>
                            <option value="2">코스 2</option>
                            <option value="3">코스 3</option>
                        </select>
                    </div>

                    <div class="control-group">
                        <label for="min-slope">최소 기울기</label>
                        <input type="number" id="min-slope" value="0" min="0" max="20" step="1">
                    </div>

                    <div class="control-group">
                        <label for="max-slope">최대 기울기</label>
                        <input type="number" id="max-slope" value="20" min="0" max="50" step="1">
                    </div>
                </div>

                <!-- Heat Map Chart -->
                <div class="chart-container">
                    <canvas id="heatmap-canvas"></canvas>
                </div>

                <!-- Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">총 문제 수</div>
                        <div class="stat-value" id="stat-total">-</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">평균 기울기</div>
                        <div class="stat-value" id="stat-avg-slope">-</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">평균 성공률</div>
                        <div class="stat-value" id="stat-avg-success">-</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">총 시도 횟수</div>
                        <div class="stat-value" id="stat-total-attempts">-</div>
                    </div>
                </div>
            </div>

            <!-- Mobile Phone Frame - Right Side -->
            <div class="mobile-panel">
                <div class="phone-frame">
                    <div class="phone-notch"></div>
                    <div class="phone-screen">
                        <div class="phone-header">
                            <h3>학습 진도</h3>
                            <div class="status" id="phone-status">데이터 로딩 중...</div>
                        </div>
                        <div class="phone-content" id="phone-content">
                            <div class="loading">
                                Moodle에서 문제 데이터를 불러오는 중입니다...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/slope-engine.js"></script>
    <script src="js/heatmap-renderer.js"></script>
    <script>
        // Application Controller
        class SlopeHeatMapApp {
            constructor() {
                this.slopeEngine = new SlopeEngine({
                    minSlope: 0,
                    maxSlope: 20
                });
                this.renderer = new HeatMapRenderer('heatmap-canvas', this.slopeEngine);
                this.data = [];

                this.initializeControls();
                this.loadData();
            }

            initializeControls() {
                // Refresh button
                document.getElementById('refresh-btn').addEventListener('click', () => {
                    this.loadData();
                });

                // Course selection
                document.getElementById('course-select').addEventListener('change', (e) => {
                    this.loadData(e.target.value);
                });

                // Slope range controls
                document.getElementById('min-slope').addEventListener('change', (e) => {
                    this.slopeEngine.minSlope = parseFloat(e.target.value);
                    this.renderer.render();
                });

                document.getElementById('max-slope').addEventListener('change', (e) => {
                    this.slopeEngine.maxSlope = parseFloat(e.target.value);
                    this.renderer.render();
                });

                // Window resize
                window.addEventListener('resize', () => {
                    this.renderer.resize();
                    this.renderer.render();
                });
            }

            async loadData(courseId = '') {
                const refreshBtn = document.getElementById('refresh-btn');
                refreshBtn.disabled = true;
                refreshBtn.textContent = '로딩 중...';

                try {
                    const url = `api/get_questions.php${courseId ? '?course_id=' + courseId : ''}`;
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error('서버 응답 오류: ' + response.status);
                    }

                    const result = await response.json();

                    if (result.success) {
                        this.data = result.questions;
                        this.updateVisualization();
                        this.updateStatistics();
                        this.updatePhoneView();
                    } else {
                        throw new Error(result.error || '데이터 로딩 실패');
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                    this.showError(error.message);
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.textContent = '데이터 새로고침';
                }
            }

            updateVisualization() {
                this.renderer.setData(this.data);
            }

            updateStatistics() {
                const total = this.data.length;
                const avgSlope = total > 0
                    ? (this.data.reduce((sum, d) => sum + d.slope, 0) / total).toFixed(2)
                    : 0;
                const avgSuccess = total > 0
                    ? (this.data.reduce((sum, d) => sum + d.successRate, 0) / total).toFixed(1)
                    : 0;
                const totalAttempts = this.data.reduce((sum, d) => sum + d.attemptCount, 0);

                document.getElementById('stat-total').textContent = total;
                document.getElementById('stat-avg-slope').textContent = avgSlope;
                document.getElementById('stat-avg-success').textContent = avgSuccess + '%';
                document.getElementById('stat-total-attempts').textContent = totalAttempts.toLocaleString();
            }

            updatePhoneView() {
                const phoneContent = document.getElementById('phone-content');
                const phoneStatus = document.getElementById('phone-status');

                if (this.data.length === 0) {
                    phoneContent.innerHTML = '<div class="loading">문제 데이터가 없습니다.</div>';
                    phoneStatus.textContent = '데이터 없음';
                    return;
                }

                phoneStatus.textContent = `총 ${this.data.length}개 문제`;

                const questionListHTML = this.data.map(question => {
                    const color = this.slopeEngine.getColor(question.slope);
                    return `
                        <div class="question-item" data-id="${question.id}">
                            <div class="question-header">
                                <span class="question-number">문제 #${question.position}</span>
                                <span class="slope-badge" style="background-color: ${color}">
                                    기울기 ${question.slope.toFixed(1)}
                                </span>
                            </div>
                            <div class="question-details">
                                <div class="question-category">${question.category || '미분류'}</div>
                                <div class="question-stats">
                                    <span>성공률: ${question.successRate}%</span>
                                    <span>시도: ${question.attemptCount}회</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                phoneContent.innerHTML = `<div class="question-list">${questionListHTML}</div>`;

                // Add click handlers for question items
                phoneContent.querySelectorAll('.question-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        // Remove previous selection
                        phoneContent.querySelectorAll('.question-item').forEach(i =>
                            i.classList.remove('selected')
                        );

                        // Add selection
                        item.classList.add('selected');

                        // Update canvas selection
                        this.renderer.selectedIndex = index;
                        this.renderer.render();
                    });
                });
            }

            showError(message) {
                const phoneContent = document.getElementById('phone-content');
                phoneContent.innerHTML = `
                    <div class="error">
                        <strong>오류 발생:</strong><br>
                        ${message}
                        <br><br>
                        config.php에서 Moodle 데이터베이스 연결 설정을 확인하세요.
                    </div>
                `;

                document.getElementById('phone-status').textContent = '오류';
            }
        }

        // Initialize application when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new SlopeHeatMapApp();
        });
    </script>
</body>
</html>
