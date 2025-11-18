<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="부등식의 해를 시각적으로 표현하는 교육용 웹앱">
    <meta name="keywords" content="부등식, 수학, 교육, Moodle, LMS">
    <title>Solution Paint - 부등식 해 시각화 앱</title>

    <!-- Styles -->
    <link rel="stylesheet" href="css/smartphone.css">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- 메인 컨테이너 -->
    <div class="main-container">
        <!-- 좌측 정보 패널 -->
        <div class="info-panel">
            <h1>🎨 Solution Paint</h1>
            <p style="font-size: 1.1em; color: #667eea; font-weight: 600;">부등식의 해를 색감으로 표현하는 교육용 앱</p>

            <h2>📱 사용 방법</h2>
            <ul>
                <li>우측 스마트폰 화면에서 문제를 확인하세요</li>
                <li>수직선 위에 터치/드래그로 부등식의 해를 칠하세요</li>
                <li>경계값 포함 여부를 정확히 표시하세요</li>
                <li>완료 후 "제출" 버튼을 눌러 답을 확인하세요</li>
            </ul>

            <h2>✨ 주요 기능</h2>
            <ul>
                <li>직관적인 터치 인터페이스</li>
                <li>실시간 피드백 제공</li>
                <li>Moodle LMS 연동 지원</li>
                <li>학습 기록 자동 저장</li>
                <li>다양한 난이도 문제</li>
            </ul>

            <h2>🔧 기술 스택</h2>
            <p><strong>Backend:</strong> PHP 7.1.9, MySQL 5.7</p>
            <p><strong>Frontend:</strong> HTML5 Canvas, JavaScript ES6</p>
            <p><strong>Integration:</strong> Moodle 3.7 REST API</p>

            <h2>📊 현재 상태</h2>
            <div class="stats-bar">
                <div class="stat-item">
                    <span class="stat-label">문제 수</span>
                    <span class="stat-value" id="totalProblems">-</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">학습자</span>
                    <span class="stat-value" id="totalStudents">-</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">정답률</span>
                    <span class="stat-value" id="accuracyRate">-</span>
                </div>
            </div>
        </div>

        <!-- 우측 스마트폰 프레임 -->
        <div class="smartphone-frame">
            <div class="notch"></div>
            <div class="smartphone-screen">
                <!-- 앱 헤더 -->
                <div class="app-header">
                    <h1>Solution Paint</h1>
                    <div class="subtitle">부등식 해 그리기</div>
                </div>

                <!-- 앱 컨텐츠 -->
                <div class="app-content">
                    <!-- 로딩 표시 -->
                    <div class="loading show">
                        <div class="spinner"></div>
                        <p>문제를 불러오는 중...</p>
                    </div>

                    <!-- 통계 바 -->
                    <div class="stats-bar" id="statsBar" style="display: none;">
                        <div class="stat-item">
                            <span class="stat-label">시도</span>
                            <span class="stat-value" id="attemptCount">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">난이도</span>
                            <span class="stat-value" id="difficulty">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">시간</span>
                            <span class="stat-value" id="timer">00:00</span>
                        </div>
                    </div>

                    <!-- 문제 표시 -->
                    <div class="problem-display" id="problemDisplay" style="display: none;">
                        <div class="problem-text" id="problemText">문제를 불러오는 중...</div>
                        <div class="problem-instruction">수직선 위에 해를 칠해주세요</div>
                    </div>

                    <!-- 도구 버튼 -->
                    <div class="tool-buttons" id="toolButtons" style="display: none;">
                        <button class="tool-btn paint active" id="paintBtn">
                            🖌️ 칠하기
                        </button>
                        <button class="tool-btn erase" id="eraseBtn">
                            🧹 지우기
                        </button>
                        <button class="tool-btn clear" id="clearBtn">
                            🗑️ 초기화
                        </button>
                    </div>

                    <!-- 캔버스 -->
                    <div class="canvas-container" id="canvasContainer" style="display: none;">
                        <canvas id="paintCanvas"></canvas>
                    </div>

                    <!-- 제출 버튼 -->
                    <div class="submit-section" id="submitSection" style="display: none;">
                        <button class="submit-btn" id="submitBtn">
                            ✓ 제출하기
                        </button>
                    </div>

                    <!-- 결과 모달 -->
                    <div class="result-modal" id="resultModal">
                        <h3 id="resultTitle">결과</h3>
                        <div class="result-score" id="resultScore">-</div>
                        <div class="result-feedback" id="resultFeedback">-</div>
                        <button class="next-btn" id="nextBtn">다음 문제</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="js/solution_paint.js"></script>
    <script>
        // 페이지 로드 시 앱 초기화
        document.addEventListener('DOMContentLoaded', function() {
            // 학생 ID (실제로는 Moodle 세션에서 가져옴)
            const studentId = 'student_' + Math.random().toString(36).substr(2, 9);
            const studentName = '테스트 학생';

            // 앱 시작
            const app = new SolutionPaintApp({
                studentId: studentId,
                studentName: studentName,
                apiUrl: 'api/'
            });

            app.init();

            // 통계 로드 (선택적)
            loadStatistics();
        });

        // 통계 데이터 로드
        function loadStatistics() {
            // 실제 구현에서는 API 호출
            setTimeout(() => {
                document.getElementById('totalProblems').textContent = '5';
                document.getElementById('totalStudents').textContent = '0';
                document.getElementById('accuracyRate').textContent = '0%';
            }, 500);
        }
    </script>
</body>
</html>
