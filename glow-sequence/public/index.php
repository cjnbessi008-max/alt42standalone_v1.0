<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glow Sequence - 수열 학습 게임</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Glow Sequence</h1>
            <p class="subtitle">빛나는 수열 패턴을 찾아보세요!</p>
        </header>

        <main>
            <div class="content-area">
                <div class="info-panel">
                    <h2>게임 설명</h2>
                    <p>
                        <strong>Glow Sequence</strong>는 수열의 규칙을 찾아 다음 숫자를 맞히는 학습 게임입니다.
                    </p>
                    <ul>
                        <li>🎯 수열 패턴을 관찰하세요</li>
                        <li>💡 빛나는 애니메이션이 힌트를 줍니다</li>
                        <li>⏱️ 시간 제한 내에 정답을 입력하세요</li>
                        <li>⭐ 정확하고 빠르게 풀수록 높은 점수를 획득합니다</li>
                    </ul>

                    <div class="stats-box">
                        <h3>학습 통계</h3>
                        <div id="student-stats">
                            <p>사용자를 선택하면 통계가 표시됩니다.</p>
                        </div>
                    </div>

                    <div class="controls">
                        <h3>사용자 선택</h3>
                        <div class="user-select">
                            <label for="moodle-user-id">Moodle 사용자 ID:</label>
                            <input type="number" id="moodle-user-id" placeholder="예: 1" value="1">
                            <button id="load-user-btn" class="btn btn-primary">사용자 로드</button>
                        </div>

                        <div class="difficulty-select" style="margin-top: 20px;">
                            <label for="difficulty">난이도:</label>
                            <select id="difficulty">
                                <option value="">전체</option>
                                <option value="easy">쉬움</option>
                                <option value="medium">보통</option>
                                <option value="hard">어려움</option>
                            </select>
                            <button id="load-problems-btn" class="btn btn-secondary">문제 불러오기</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 우측 하단 가상 스마트폰 화면 -->
            <div class="smartphone-container">
                <div class="smartphone-frame">
                    <div class="smartphone-notch"></div>
                    <div class="smartphone-screen">
                        <iframe id="app-iframe" src="app.html" frameborder="0"></iframe>
                    </div>
                    <div class="smartphone-home-button"></div>
                </div>
            </div>
        </main>
    </div>

    <script src="js/game.js"></script>
    <script>
        // Load user and sync with Moodle
        document.getElementById('load-user-btn').addEventListener('click', async () => {
            const moodleUserId = document.getElementById('moodle-user-id').value;
            if (!moodleUserId) {
                alert('Moodle 사용자 ID를 입력해주세요.');
                return;
            }

            try {
                const response = await fetch('../moodle/sync_user.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ moodle_user_id: parseInt(moodleUserId) })
                });

                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('student_id', data.data.student_id);
                    localStorage.setItem('username', data.data.username);
                    alert(`사용자 로드 완료: ${data.data.username}`);
                    loadStudentStats(data.data.student_id);

                    // Send student info to iframe
                    const iframe = document.getElementById('app-iframe');
                    iframe.contentWindow.postMessage({
                        type: 'USER_LOADED',
                        student_id: data.data.student_id,
                        username: data.data.username
                    }, '*');
                } else {
                    alert('오류: ' + data.error);
                }
            } catch (error) {
                console.error('Error loading user:', error);
                alert('사용자 로드 중 오류가 발생했습니다.');
            }
        });

        // Load problems
        document.getElementById('load-problems-btn').addEventListener('click', async () => {
            const difficulty = document.getElementById('difficulty').value;
            const studentId = localStorage.getItem('student_id');

            if (!studentId) {
                alert('먼저 사용자를 로드해주세요.');
                return;
            }

            try {
                let url = `../api/get_problems.php?student_id=${studentId}&limit=20`;
                if (difficulty) {
                    url += `&difficulty=${difficulty}`;
                }

                const response = await fetch(url);
                const data = await response.json();

                if (data.success) {
                    // Send problems to iframe
                    const iframe = document.getElementById('app-iframe');
                    iframe.contentWindow.postMessage({
                        type: 'PROBLEMS_LOADED',
                        problems: data.data.problems
                    }, '*');
                    alert(`${data.data.problems.length}개의 문제를 불러왔습니다.`);
                } else {
                    alert('오류: ' + data.error);
                }
            } catch (error) {
                console.error('Error loading problems:', error);
                alert('문제 불러오기 중 오류가 발생했습니다.');
            }
        });

        // Load student statistics
        async function loadStudentStats(studentId) {
            try {
                const response = await fetch(`../api/get_progress.php?student_id=${studentId}`);
                const data = await response.json();

                if (data.success) {
                    const stats = data.data.summary;
                    const statsHtml = `
                        <div class="stat-item">
                            <span class="stat-label">총 문제:</span>
                            <span class="stat-value">${stats.total_sequences}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">완료:</span>
                            <span class="stat-value">${stats.completed}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">진행중:</span>
                            <span class="stat-value">${stats.in_progress}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">평균 숙련도:</span>
                            <span class="stat-value">${stats.avg_mastery.toFixed(1)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">총 점수:</span>
                            <span class="stat-value">${stats.total_best_score}</span>
                        </div>
                    `;
                    document.getElementById('student-stats').innerHTML = statsHtml;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Listen for messages from iframe
        window.addEventListener('message', (event) => {
            if (event.data.type === 'ANSWER_SUBMITTED') {
                const studentId = localStorage.getItem('student_id');
                if (studentId) {
                    loadStudentStats(studentId);
                }
            }
        });
    </script>
</body>
</html>
