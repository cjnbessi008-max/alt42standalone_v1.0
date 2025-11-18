<?php
/**
 * Learning Summary System - Main Entry Point
 * Standalone web app integrated with Moodle LMS
 */

session_start();

// Load configuration
require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/controllers/SummaryController.php';

// Simple router
$action = $_GET['action'] ?? 'home';
$controller = new SummaryController();

// Handle API requests
if (isset($_GET['api'])) {
    header('Content-Type: application/json');

    switch ($action) {
        case 'process_attempt':
            $attemptId = $_POST['attempt_id'] ?? $_GET['attempt_id'] ?? null;
            if (!$attemptId) {
                echo json_encode(['success' => false, 'error' => 'Attempt ID required']);
                exit;
            }
            $result = $controller->processAttempt($attemptId);
            echo json_encode($result);
            break;

        case 'get_summary':
            $sessionId = $_GET['session_id'] ?? null;
            if (!$sessionId) {
                echo json_encode(['success' => false, 'error' => 'Session ID required']);
                exit;
            }
            $result = $controller->getSummary($sessionId);
            echo json_encode($result);
            break;

        case 'save_reflection':
            $sessionId = $_POST['session_id'] ?? null;
            if (!$sessionId) {
                echo json_encode(['success' => false, 'error' => 'Session ID required']);
                exit;
            }
            $reflectionData = [
                'what_i_learned' => $_POST['what_i_learned'] ?? '',
                'what_was_difficult' => $_POST['what_was_difficult'] ?? '',
                'what_i_want_to_learn' => $_POST['what_i_want_to_learn'] ?? '',
                'confidence_rating' => $_POST['confidence_rating'] ?? null
            ];
            $result = $controller->saveReflection($sessionId, $reflectionData);
            echo json_encode($result);
            break;

        case 'get_progress':
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                echo json_encode(['success' => false, 'error' => 'User ID required']);
                exit;
            }
            $result = $controller->getUserProgress($userId);
            echo json_encode($result);
            break;

        case 'test_connections':
            $result = $controller->testConnections();
            echo json_encode($result);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
    exit;
}

// Web UI routes
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>학습 요약 시스템 - Learning Summary System</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        .form-group input[type="number"],
        .form-group input[type="text"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        .btn:active {
            transform: translateY(0);
        }
        .btn-secondary {
            background: #6c757d;
        }
        #result {
            margin-top: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            display: none;
        }
        .success {
            color: #28a745;
            padding: 15px;
            background: #d4edda;
            border-radius: 8px;
            margin: 10px 0;
        }
        .error {
            color: #dc3545;
            padding: 15px;
            background: #f8d7da;
            border-radius: 8px;
            margin: 10px 0;
        }
        .loading {
            text-align: center;
            padding: 20px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .feature-card h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 학습 요약 시스템</h1>
            <p>AI 기반 학습 인사이트 & Moodle LMS 연동</p>
        </div>

        <div class="content">
            <?php if ($action === 'home'): ?>
                <!-- Home Page -->
                <div class="card">
                    <h2>환영합니다!</h2>
                    <p>이 시스템은 Moodle LMS와 연동하여 학생들의 퀴즈 성과를 AI로 분석하고 맞춤형 학습 요약을 제공합니다.</p>

                    <div class="feature-grid">
                        <div class="feature-card">
                            <h3>🤖 AI 분석</h3>
                            <p>Claude AI가 학습 패턴을 분석하여 인사이트를 제공합니다</p>
                        </div>
                        <div class="feature-card">
                            <h3>📊 학습 추적</h3>
                            <p>개념별 숙달도와 학습 진행 상황을 추적합니다</p>
                        </div>
                        <div class="feature-card">
                            <h3>💭 성찰 노트</h3>
                            <p>학생이 직접 배운 내용을 정리할 수 있습니다</p>
                        </div>
                        <div class="feature-card">
                            <h3>🔗 Moodle 연동</h3>
                            <p>Moodle 퀴즈 데이터를 자동으로 가져옵니다</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2>퀴즈 완료 후 학습 요약 생성</h2>
                    <p style="margin-bottom: 20px;">Moodle에서 퀴즈를 완료한 후, Attempt ID를 입력하여 AI 학습 요약을 생성하세요.</p>

                    <div class="form-group">
                        <label for="attempt_id">Moodle Quiz Attempt ID:</label>
                        <input type="number" id="attempt_id" placeholder="예: 12345">
                    </div>

                    <button class="btn" onclick="processAttempt()">학습 요약 생성</button>
                    <button class="btn btn-secondary" onclick="testConnections()" style="margin-left: 10px;">연결 테스트</button>

                    <div id="result"></div>
                </div>

                <div class="card">
                    <h2>내 학습 요약 보기</h2>
                    <p style="margin-bottom: 20px;">생성된 학습 요약을 확인하세요.</p>

                    <div class="form-group">
                        <label for="session_id">Session ID:</label>
                        <input type="number" id="session_id" placeholder="예: 1">
                    </div>

                    <button class="btn" onclick="viewSummary()">요약 보기</button>
                </div>

            <?php elseif ($action === 'summary'): ?>
                <!-- Summary View Page -->
                <div id="summary-container"></div>
                <script>
                    const sessionId = <?php echo intval($_GET['session_id'] ?? 0); ?>;
                    if (sessionId) {
                        loadSummary(sessionId);
                    }
                </script>

            <?php endif; ?>
        </div>
    </div>

    <script>
        async function processAttempt() {
            const attemptId = document.getElementById('attempt_id').value;
            if (!attemptId) {
                showResult('Attempt ID를 입력해주세요.', 'error');
                return;
            }

            showLoading();

            try {
                const response = await fetch(`?api=1&action=process_attempt&attempt_id=${attemptId}`, {
                    method: 'POST'
                });
                const data = await response.json();

                if (data.success) {
                    showResult(`
                        <div class="success">
                            <h3>✅ 학습 요약이 생성되었습니다!</h3>
                            <p>Session ID: ${data.session_id}</p>
                            <button class="btn" onclick="location.href='?action=summary&session_id=${data.session_id}'">
                                요약 보기
                            </button>
                        </div>
                    `);
                } else {
                    showResult(`<div class="error">❌ 오류: ${data.error}</div>`);
                }
            } catch (error) {
                showResult(`<div class="error">❌ 요청 실패: ${error.message}</div>`);
            }
        }

        async function viewSummary() {
            const sessionId = document.getElementById('session_id').value;
            if (!sessionId) {
                showResult('Session ID를 입력해주세요.', 'error');
                return;
            }

            location.href = `?action=summary&session_id=${sessionId}`;
        }

        async function loadSummary(sessionId) {
            showLoading();

            try {
                const response = await fetch(`?api=1&action=get_summary&session_id=${sessionId}`);
                const data = await response.json();

                if (data.success) {
                    displaySummary(data.data);
                } else {
                    showResult(`<div class="error">❌ 오류: ${data.error}</div>`);
                }
            } catch (error) {
                showResult(`<div class="error">❌ 요청 실패: ${error.message}</div>`);
            }
        }

        async function testConnections() {
            showLoading();

            try {
                const response = await fetch('?api=1&action=test_connections');
                const data = await response.json();

                let html = '<h3>연결 테스트 결과</h3>';

                html += '<div style="margin: 20px 0;">';
                html += '<h4>Moodle 연결:</h4>';
                if (data.moodle.success) {
                    html += `<div class="success">✅ 연결 성공<br>Site: ${data.moodle.sitename}<br>Version: ${data.moodle.version}</div>`;
                } else {
                    html += `<div class="error">❌ 연결 실패: ${data.moodle.error}</div>`;
                }
                html += '</div>';

                html += '<div style="margin: 20px 0;">';
                html += '<h4>Claude AI 연결:</h4>';
                if (data.claude.success) {
                    html += `<div class="success">✅ 연결 성공<br>Model: ${data.claude.model}</div>`;
                } else {
                    html += `<div class="error">❌ 연결 실패: ${data.claude.error}</div>`;
                }
                html += '</div>';

                showResult(html);
            } catch (error) {
                showResult(`<div class="error">❌ 요청 실패: ${error.message}</div>`);
            }
        }

        function displaySummary(session) {
            // Implementation in separate view file
            const container = document.getElementById('summary-container') || document.getElementById('result');

            let html = `
                <div class="card">
                    <h2>📝 ${session.quiz_name}</h2>
                    <p><strong>학생:</strong> ${session.student_name}</p>
                    <p><strong>점수:</strong> ${session.score}% (${session.correct_answers}/${session.total_questions})</p>
                    <p><strong>완료 시간:</strong> ${session.completed_at || session.created_at}</p>
                </div>
            `;

            if (session.summary) {
                const summary = session.summary;
                html += `
                    <div class="card">
                        <h2>🤖 AI 학습 요약</h2>

                        ${summary.concepts_learned ? `
                            <div style="margin: 20px 0;">
                                <h3>학습한 핵심 개념</h3>
                                <p>${summary.concepts_learned}</p>
                            </div>
                        ` : ''}

                        ${summary.strengths ? `
                            <div style="margin: 20px 0;">
                                <h3>강점</h3>
                                <p>${summary.strengths}</p>
                            </div>
                        ` : ''}

                        ${summary.weaknesses ? `
                            <div style="margin: 20px 0;">
                                <h3>개선이 필요한 부분</h3>
                                <p>${summary.weaknesses}</p>
                            </div>
                        ` : ''}

                        ${summary.recommendations ? `
                            <div style="margin: 20px 0;">
                                <h3>다음 학습 추천</h3>
                                <p>${summary.recommendations}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            container.innerHTML = html;
            container.style.display = 'block';
        }

        function showLoading() {
            const result = document.getElementById('result');
            result.innerHTML = '<div class="loading"><div class="spinner"></div><p>처리 중...</p></div>';
            result.style.display = 'block';
        }

        function showResult(html, type = '') {
            const result = document.getElementById('result');
            if (type === 'error') {
                result.innerHTML = `<div class="error">${html}</div>`;
            } else if (type === 'success') {
                result.innerHTML = `<div class="success">${html}</div>`;
            } else {
                result.innerHTML = html;
            }
            result.style.display = 'block';
        }
    </script>
</body>
</html>
