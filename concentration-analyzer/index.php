<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>집중도 분석기 - Concentration Analyzer</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <h1>📊 집중도 분석기 (Concentration Analyzer)</h1>
        <p>Moodle LMS 연동 - 학습 집중도 그래프 및 들쭉날쭉 구간 분석</p>
    </header>

    <!-- Main Container -->
    <div class="container">
        <!-- Alert Container -->
        <div id="alertContainer"></div>

        <!-- Controls -->
        <section class="controls">
            <h2>⚙️ 분석 설정</h2>

            <div class="form-grid">
                <div class="form-group">
                    <label for="userId">사용자</label>
                    <select id="userId">
                        <option value="">사용자 선택</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="courseId">코스 ID</label>
                    <input type="number" id="courseId" placeholder="코스 ID 입력">
                </div>

                <div class="form-group">
                    <label for="startDate">시작 날짜</label>
                    <input type="date" id="startDate">
                </div>

                <div class="form-group">
                    <label for="endDate">종료 날짜</label>
                    <input type="date" id="endDate">
                </div>
            </div>

            <div class="btn-group">
                <button id="syncBtn" class="btn btn-success">
                    🔄 Moodle 데이터 동기화
                </button>
                <button id="analyzeBtn" class="btn btn-primary">
                    🔍 집중도 분석 실행
                </button>
                <button id="loadDataBtn" class="btn btn-secondary">
                    📈 데이터 불러오기
                </button>
            </div>
        </section>

        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">평균 집중도</div>
                <div class="stat-value" id="avgScore">0.0</div>
                <div class="stat-change positive">점 (0-100)</div>
            </div>

            <div class="stat-card">
                <div class="stat-label">총 세션 수</div>
                <div class="stat-value" id="totalSessions">0</div>
                <div class="stat-change">개 시간 윈도우</div>
            </div>

            <div class="stat-card warning">
                <div class="stat-label">변동 구간 수</div>
                <div class="stat-value" id="totalFluctuations">0</div>
                <div class="stat-change">개 감지됨</div>
            </div>

            <div class="stat-card danger">
                <div class="stat-label">높은 심각도 변동</div>
                <div class="stat-value" id="highSeverityCount">0</div>
                <div class="stat-change">개 주의 필요</div>
            </div>
        </div>

        <!-- Chart Section -->
        <section class="chart-section">
            <h2>📉 집중도 그래프 (시간별 추이)</h2>
            <div class="chart-container">
                <canvas id="concentrationChart"></canvas>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 1rem;">
                💡 <strong>그래프 해석:</strong> 급격한 상승/하락 구간이 들쭉날쭉한 패턴을 나타냅니다.
                일정한 패턴은 안정적인 집중 상태를 의미합니다.
            </p>
        </section>

        <!-- Fluctuations Table -->
        <section class="fluctuations-section">
            <h2>⚠️ 들쭉날쭉한 구간 분석 결과</h2>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">
                통계적 방법(Z-점수 기반)으로 탐지된 비정상적인 집중도 변동 구간입니다.
            </p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>시간</th>
                            <th>변동 유형</th>
                            <th>심각도</th>
                            <th>기준 점수</th>
                            <th>Z-점수</th>
                            <th>설명</th>
                        </tr>
                    </thead>
                    <tbody id="fluctuationsBody">
                        <tr>
                            <td colspan="6" class="empty-state">
                                <p>데이터를 불러오려면 위의 "데이터 불러오기" 버튼을 클릭하세요.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Information Section -->
        <section class="chart-section" style="margin-top: 2rem;">
            <h2>ℹ️ 사용 방법</h2>
            <div style="line-height: 1.8; color: var(--text-secondary);">
                <ol style="padding-left: 1.5rem;">
                    <li><strong>Moodle 데이터 동기화:</strong> Moodle LMS에서 사용자 활동 로그를 가져옵니다.</li>
                    <li><strong>사용자 및 기간 선택:</strong> 분석할 사용자와 날짜 범위를 선택합니다.</li>
                    <li><strong>집중도 분석 실행:</strong> 선택한 기간의 집중도를 계산하고 패턴을 분석합니다.</li>
                    <li><strong>결과 확인:</strong> 그래프와 표를 통해 집중도 추이와 이상 구간을 확인합니다.</li>
                </ol>

                <h3 style="margin-top: 1.5rem; color: var(--text-primary);">📊 집중도 계산 방법</h3>
                <ul style="padding-left: 1.5rem;">
                    <li><strong>활동 빈도:</strong> 시간 윈도우 내 활동 횟수</li>
                    <li><strong>클릭률:</strong> 분당 클릭 수 (최적: 3-10회/분)</li>
                    <li><strong>일관성:</strong> 활동 간 시간 간격의 균일성</li>
                    <li><strong>응답 시간:</strong> 활동 간 평균 시간</li>
                </ul>

                <h3 style="margin-top: 1.5rem; color: var(--text-primary);">🔍 변동 탐지 알고리즘</h3>
                <p>
                    Z-점수(표준점수) 기반 이상 탐지를 사용합니다.
                    집중도가 평균에서 표준편차의 1.5배 이상 벗어나면 비정상적인 변동으로 판단합니다.
                </p>
                <ul style="padding-left: 1.5rem;">
                    <li><strong>급상승(Spike):</strong> Z-점수 > 1.5</li>
                    <li><strong>급하락(Drop):</strong> Z-점수 < -1.5</li>
                    <li><strong>심각도:</strong> Low (1.5-2.0), Medium (2.0-3.0), High (3.0+)</li>
                </ul>
            </div>
        </section>
    </div>

    <!-- Scripts -->
    <script src="assets/vendor/chart.min.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
