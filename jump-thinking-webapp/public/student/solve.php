<?php
/**
 * Student Problem Solving Interface
 */

require_once __DIR__ . '/../../src/autoload.php';

use JumpThinking\Database\Connection;

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'student') {
    http_response_code(403);
    die('Access denied. Please launch from Moodle.');
}

$db = Connection::getInstance();
$userId = $_SESSION['user_id'];
$resourceLinkId = $_SESSION['resource_link_id'] ?? null;

// Get or create session
$sessionId = $_GET['session_id'] ?? null;

if (!$sessionId) {
    // Create new session - for demo, use problem set 1
    $setId = $_GET['set_id'] ?? 1;

    $sql = "INSERT INTO student_sessions (student_id, set_id, lti_resource_link_id, session_token, status)
            VALUES (?, ?, ?, ?, 'in_progress')";

    $sessionId = $db->insert($sql, [
        $userId,
        $setId,
        $resourceLinkId,
        bin2hex(random_bytes(16))
    ]);

    header("Location: solve.php?session_id=$sessionId");
    exit;
}

// Get session info
$sql = "SELECT ss.*, ps.title as set_title, ps.description as set_description
        FROM student_sessions ss
        JOIN problem_sets ps ON ss.set_id = ps.id
        WHERE ss.id = ? AND ss.student_id = ?";

$session = $db->fetchOne($sql, [$sessionId, $userId]);

if (!$session) {
    die('Session not found');
}

// Get problems for this set
$sql = "SELECT * FROM problems WHERE set_id = ? ORDER BY problem_order ASC";
$problems = $db->fetchAll($sql, [$session['set_id']]);

// Get existing attempts
$sql = "SELECT * FROM attempts WHERE session_id = ?";
$attempts = $db->fetchAll($sql, [$sessionId]);
$attemptedProblemIds = array_column($attempts, 'problem_id');

// Get current problem (first unattempted required problem)
$currentProblem = null;
foreach ($problems as $problem) {
    if (!in_array($problem['id'], $attemptedProblemIds)) {
        $currentProblem = $problem;
        break;
    }
}

// If all problems done, show completion
$isComplete = ($currentProblem === null);

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($session['set_title']); ?></title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Malgun Gothic', sans-serif; background: #f5f7fa; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
        .header p { color: #7f8c8d; }
        .progress-bar { height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; margin-top: 15px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.3s; }
        .problem-card { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .problem-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .problem-badge { background: #3498db; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
        .problem-title { font-size: 20px; color: #2c3e50; margin-bottom: 10px; }
        .problem-content { font-size: 18px; color: #34495e; line-height: 1.8; margin: 20px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #3498db; }
        .answer-input { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #dce0e3; border-radius: 6px; margin-bottom: 15px; }
        .answer-input:focus { outline: none; border-color: #3498db; }
        .button-group { display: flex; gap: 10px; }
        .btn { padding: 12px 30px; font-size: 16px; border: none; border-radius: 6px; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; }
        .btn-skip { background: #95a5a6; color: white; }
        .btn-skip:hover { background: #7f8c8d; }
        .timer { font-size: 24px; color: #e74c3c; font-weight: bold; }
        .completion { text-align: center; padding: 50px; }
        .completion h2 { color: #2ecc71; font-size: 32px; margin-bottom: 20px; }
        .completion p { font-size: 18px; color: #7f8c8d; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 36px; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        .hint-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; display: none; }
        .hint-button { background: #ffc107; color: #333; padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 15px; }
        .feedback { padding: 15px; border-radius: 6px; margin-bottom: 15px; display: none; }
        .feedback.correct { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .feedback.incorrect { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><?php echo htmlspecialchars($session['set_title']); ?></h1>
            <p><?php echo htmlspecialchars($session['set_description']); ?></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: <?php echo (count($attempts) / count($problems)) * 100; ?>%"></div>
            </div>
            <p style="margin-top: 10px; color: #7f8c8d;">
                진행률: <?php echo count($attempts); ?> / <?php echo count($problems); ?> 문제
            </p>
        </div>

        <?php if ($isComplete): ?>
            <!-- Completion Screen -->
            <div class="problem-card completion">
                <h2>🎉 모든 문제를 완료했습니다!</h2>
                <p>수고하셨습니다. 결과를 분석하고 있습니다...</p>

                <?php
                // Trigger analysis
                require_once __DIR__ . '/../../src/JumpThinking/Detector.php';
                $detector = new \JumpThinking\JumpThinking\Detector();

                try {
                    $analysis = $detector->analyzeSession($sessionId);

                    // Update session status
                    $db->execute("UPDATE student_sessions SET status = 'completed', completed_at = NOW() WHERE id = ?", [$sessionId]);
                ?>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value"><?php echo round($analysis['jump_score']); ?></div>
                        <div class="stat-label">비약 사고 점수</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value"><?php echo $analysis['total_events']; ?></div>
                        <div class="stat-label">감지된 패턴</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value"><?php echo ucfirst($analysis['tendency']); ?></div>
                        <div class="stat-label">학습 성향</div>
                    </div>
                </div>

                <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-bottom: 15px;">분석 결과:</h3>
                    <ul style="line-height: 2;">
                        <li>단계 건너뛰기: <?php echo $analysis['events_by_type']['step_skips']; ?>회</li>
                        <li>빠른 풀이: <?php echo $analysis['events_by_type']['fast_solves']; ?>회</li>
                        <li>순서 위반: <?php echo $analysis['events_by_type']['sequence_violations']; ?>회</li>
                        <li>직접 답 도출: <?php echo $analysis['events_by_type']['direct_answers']; ?>회</li>
                    </ul>

                    <?php if ($analysis['tendency'] === 'jumper'): ?>
                        <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px;">
                            <strong>💡 조언:</strong> 중간 단계를 건너뛰는 경향이 있습니다.
                            체계적인 접근 방법을 연습하면 더 복잡한 문제도 쉽게 풀 수 있습니다.
                        </p>
                    <?php elseif ($analysis['tendency'] === 'sequential'): ?>
                        <p style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 6px;">
                            <strong>✅ 훌륭합니다!</strong> 체계적인 단계별 접근을 잘 하고 있습니다.
                        </p>
                    <?php endif; ?>
                </div>

                <?php
                } catch (\Exception $e) {
                    echo '<p style="color: #e74c3c;">분석 중 오류가 발생했습니다: ' . htmlspecialchars($e->getMessage()) . '</p>';
                }
                ?>

                <?php if (isset($_SESSION['return_url'])): ?>
                    <a href="<?php echo htmlspecialchars($_SESSION['return_url']); ?>" class="btn btn-primary" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                        Moodle로 돌아가기
                    </a>
                <?php endif; ?>
            </div>

        <?php else: ?>
            <!-- Problem Solving Interface -->
            <div class="problem-card">
                <div class="problem-header">
                    <span class="problem-badge">단계 <?php echo $currentProblem['step_level']; ?></span>
                    <span class="timer" id="timer">00:00</span>
                </div>

                <div class="problem-title"><?php echo htmlspecialchars($currentProblem['title']); ?></div>

                <div class="problem-content">
                    <?php echo nl2br(htmlspecialchars($currentProblem['content'])); ?>
                </div>

                <div id="feedback" class="feedback"></div>

                <?php if ($currentProblem['hints']): ?>
                    <button class="hint-button" onclick="showHint()">💡 힌트 보기</button>
                    <div class="hint-box" id="hintBox">
                        <?php
                        $hints = json_decode($currentProblem['hints'], true);
                        if ($hints) {
                            foreach ($hints as $hint) {
                                echo '<p>• ' . htmlspecialchars($hint) . '</p>';
                            }
                        }
                        ?>
                    </div>
                <?php endif; ?>

                <form id="answerForm" onsubmit="return submitAnswer(event)">
                    <input type="text"
                           class="answer-input"
                           id="answer"
                           name="answer"
                           placeholder="답을 입력하세요"
                           autocomplete="off"
                           required>

                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">정답 확인</button>
                        <?php if (!$currentProblem['is_required']): ?>
                            <button type="button" class="btn btn-skip" onclick="skipProblem()">건너뛰기</button>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        <?php endif; ?>
    </div>

    <script>
        const sessionId = <?php echo $sessionId; ?>;
        const problemId = <?php echo $currentProblem ? $currentProblem['id'] : 'null'; ?>;
        const correctAnswer = <?php echo $currentProblem ? json_encode($currentProblem['correct_answer']) : 'null'; ?>;
        let startTime = Date.now();
        let timerInterval;
        let hintsUsed = 0;

        // Timer
        function updateTimer() {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent =
                String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }

        if (problemId) {
            timerInterval = setInterval(updateTimer, 1000);
        }

        function showHint() {
            document.getElementById('hintBox').style.display = 'block';
            hintsUsed++;
        }

        function submitAnswer(event) {
            event.preventDefault();

            const userAnswer = document.getElementById('answer').value.trim();
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);

            // Simple answer check (normalize)
            const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);

            // Save attempt
            fetch('/api/save_attempt.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: sessionId,
                    problem_id: problemId,
                    answer: userAnswer,
                    is_correct: isCorrect,
                    time_spent: timeSpent,
                    hints_used: hintsUsed
                })
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      showFeedback(isCorrect);
                      if (isCorrect) {
                          setTimeout(() => {
                              window.location.reload();
                          }, 2000);
                      }
                  }
              });

            return false;
        }

        function normalizeAnswer(answer) {
            return answer.toLowerCase().replace(/\s+/g, '');
        }

        function showFeedback(isCorrect) {
            const feedback = document.getElementById('feedback');
            feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
            feedback.textContent = isCorrect ? '✓ 정답입니다!' : '✗ 틀렸습니다. 다시 시도해보세요.';
            feedback.style.display = 'block';
        }

        function skipProblem() {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);

            fetch('/api/save_attempt.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    session_id: sessionId,
                    problem_id: problemId,
                    answer: null,
                    is_correct: false,
                    time_spent: timeSpent,
                    hints_used: hintsUsed,
                    skipped: true
                })
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      window.location.reload();
                  }
              });
        }
    </script>
</body>
</html>
