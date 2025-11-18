<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Blend - LMS 연동 수학 학습 앱</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <!-- Left Panel: Control Panel -->
        <div class="control-panel">
            <h1>Graph Blend LMS</h1>
            <p class="subtitle">Moodle 연동 수학 학습 시스템</p>

            <div class="section">
                <h2>문제 선택</h2>
                <div id="problem-list" class="problem-list">
                    <div class="loading">문제를 불러오는 중...</div>
                </div>
            </div>

            <div class="section">
                <h2>문제 정보</h2>
                <div id="problem-info" class="problem-info">
                    <p class="placeholder">문제를 선택해주세요</p>
                </div>
            </div>

            <div class="section">
                <h2>그래프 설정</h2>
                <div class="graph-controls">
                    <label>
                        <span>범위 시작:</span>
                        <input type="number" id="range-start" value="-10" step="0.5">
                    </label>
                    <label>
                        <span>범위 끝:</span>
                        <input type="number" id="range-end" value="10" step="0.5">
                    </label>
                    <label>
                        <span>그리드 간격:</span>
                        <input type="number" id="grid-step" value="1" step="0.5" min="0.1">
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="show-blend" checked>
                        <span>Blend 효과 표시</span>
                    </label>
                    <button id="refresh-graph" class="btn btn-primary">그래프 새로고침</button>
                </div>
            </div>

            <div class="section">
                <h2>통계</h2>
                <div id="statistics" class="statistics">
                    <div class="stat-item">
                        <span class="stat-label">총 문제:</span>
                        <span class="stat-value" id="stat-total">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">풀이 시도:</span>
                        <span class="stat-value" id="stat-attempts">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">정답률:</span>
                        <span class="stat-value" id="stat-accuracy">0%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Smartphone Simulator -->
        <div class="smartphone-simulator">
            <div class="smartphone-frame">
                <div class="smartphone-notch"></div>
                <div class="smartphone-screen">
                    <div class="app-header">
                        <h2>Graph Blend</h2>
                        <div class="problem-title" id="mobile-problem-title">문제를 선택해주세요</div>
                    </div>

                    <div class="app-content">
                        <!-- Canvas for Graph Rendering -->
                        <canvas id="graph-canvas" width="360" height="500"></canvas>

                        <div class="graph-legend" id="graph-legend">
                            <!-- Legend will be dynamically generated -->
                        </div>
                    </div>

                    <div class="app-footer">
                        <button class="action-btn" id="btn-prev">◀ 이전</button>
                        <button class="action-btn primary" id="btn-check">확인</button>
                        <button class="action-btn" id="btn-next">다음 ▶</button>
                    </div>
                </div>
                <div class="smartphone-button"></div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/smartphone-simulator.js"></script>
    <script src="js/graph-blend.js"></script>
    <script>
        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Load problems from API
            loadProblems();

            // Setup event listeners
            setupEventListeners();
        });

        function loadProblems() {
            fetch('api/get_problems.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayProblems(data.problems);
                        updateStatistics(data.statistics);
                    } else {
                        showError('문제를 불러오는데 실패했습니다: ' + data.message);
                    }
                })
                .catch(error => {
                    showError('네트워크 오류: ' + error.message);
                });
        }

        function displayProblems(problems) {
            const problemList = document.getElementById('problem-list');

            if (problems.length === 0) {
                problemList.innerHTML = '<p class="placeholder">등록된 문제가 없습니다.</p>';
                return;
            }

            problemList.innerHTML = problems.map(problem => `
                <div class="problem-item" data-problem-id="${problem.id}" onclick="selectProblem(${problem.id})">
                    <div class="problem-type">${getProblemTypeLabel(problem.problem_type)}</div>
                    <div class="problem-title">${problem.title}</div>
                    <div class="problem-desc">${problem.description || ''}</div>
                </div>
            `).join('');
        }

        function selectProblem(problemId) {
            fetch(`api/get_problems.php?id=${problemId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayProblemInfo(data.problem);
                        renderGraph(data.problem);
                    }
                })
                .catch(error => {
                    showError('문제 정보를 불러오는데 실패했습니다: ' + error.message);
                });

            // Highlight selected problem
            document.querySelectorAll('.problem-item').forEach(item => {
                item.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
        }

        function displayProblemInfo(problem) {
            const infoDiv = document.getElementById('problem-info');
            const mobileTitleDiv = document.getElementById('mobile-problem-title');

            infoDiv.innerHTML = `
                <h3>${problem.title}</h3>
                <p><strong>유형:</strong> ${getProblemTypeLabel(problem.problem_type)}</p>
                <p><strong>설명:</strong> ${problem.description || '설명 없음'}</p>
                <p><strong>범위:</strong> ${problem.min_value} ~ ${problem.max_value}</p>
            `;

            mobileTitleDiv.textContent = problem.title;
        }

        function getProblemTypeLabel(type) {
            const types = {
                'inequality': '부등식',
                'range': '범위',
                'function': '함수',
                'linear': '일차함수',
                'quadratic': '이차함수'
            };
            return types[type] || type;
        }

        function updateStatistics(stats) {
            if (stats) {
                document.getElementById('stat-total').textContent = stats.total || 0;
                document.getElementById('stat-attempts').textContent = stats.attempts || 0;
                document.getElementById('stat-accuracy').textContent = (stats.accuracy || 0) + '%';
            }
        }

        function setupEventListeners() {
            document.getElementById('refresh-graph').addEventListener('click', function() {
                const activeItem = document.querySelector('.problem-item.active');
                if (activeItem) {
                    const problemId = activeItem.dataset.problemId;
                    selectProblem(problemId);
                }
            });

            document.getElementById('show-blend').addEventListener('change', function() {
                // Redraw graph with/without blend effect
                const activeItem = document.querySelector('.problem-item.active');
                if (activeItem) {
                    const problemId = activeItem.dataset.problemId;
                    selectProblem(problemId);
                }
            });
        }

        function showError(message) {
            alert(message);
            console.error(message);
        }
    </script>
</body>
</html>
