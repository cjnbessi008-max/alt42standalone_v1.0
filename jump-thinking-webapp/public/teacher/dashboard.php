<?php
/**
 * Teacher Dashboard - Jump Thinking Analytics
 */

require_once __DIR__ . '/../../src/autoload.php';

use JumpThinking\Database\Connection;

session_start();

// Check if user is logged in as teacher
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'teacher') {
    http_response_code(403);
    die('Access denied. Teacher access required.');
}

$db = Connection::getInstance();
$teacherId = $_SESSION['user_id'];

// Get teacher info
$sql = "SELECT * FROM users WHERE id = ?";
$teacher = $db->fetchOne($sql, [$teacherId]);

// Get problem sets created by this teacher
$sql = "SELECT * FROM problem_sets WHERE teacher_id = ? ORDER BY created_at DESC";
$problemSets = $db->fetchAll($sql, [$teacherId]);

// Get statistics
$selectedSetId = $_GET['set_id'] ?? ($problemSets[0]['id'] ?? null);

if ($selectedSetId) {
    // Get students who attempted this set
    $sql = "SELECT
                u.id,
                u.full_name,
                u.email,
                COUNT(DISTINCT ss.id) as total_sessions,
                AVG(jts.jump_score) as avg_jump_score,
                lp.tendency
            FROM users u
            JOIN student_sessions ss ON u.id = ss.student_id
            LEFT JOIN jump_thinking_scores jts ON ss.id = jts.session_id
            LEFT JOIN learning_patterns lp ON u.id = lp.student_id
            WHERE ss.set_id = ? AND u.role = 'student'
            GROUP BY u.id
            ORDER BY avg_jump_score DESC";

    $students = $db->fetchAll($sql, [$selectedSetId]);

    // Get recent sessions
    $sql = "SELECT
                ss.*,
                u.full_name as student_name,
                jts.jump_score,
                jts.total_events,
                jts.step_skips,
                jts.fast_solves
            FROM student_sessions ss
            JOIN users u ON ss.student_id = u.id
            LEFT JOIN jump_thinking_scores jts ON ss.id = jts.session_id
            WHERE ss.set_id = ?
            ORDER BY ss.started_at DESC
            LIMIT 10";

    $recentSessions = $db->fetchAll($sql, [$selectedSetId]);

    // Get event statistics
    $sql = "SELECT
                event_type,
                COUNT(*) as count,
                AVG(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) * 100 as high_severity_pct
            FROM jump_thinking_events jte
            JOIN student_sessions ss ON jte.session_id = ss.id
            WHERE ss.set_id = ?
            GROUP BY event_type";

    $eventStats = $db->fetchAll($sql, [$selectedSetId]);

    // Overall statistics
    $sql = "SELECT
                COUNT(DISTINCT ss.student_id) as total_students,
                COUNT(DISTINCT ss.id) as total_sessions,
                AVG(jts.jump_score) as avg_jump_score,
                SUM(CASE WHEN jts.jump_score >= 60 THEN 1 ELSE 0 END) as jumper_count,
                SUM(CASE WHEN jts.jump_score < 30 THEN 1 ELSE 0 END) as sequential_count
            FROM student_sessions ss
            LEFT JOIN jump_thinking_scores jts ON ss.id = jts.session_id
            WHERE ss.set_id = ? AND ss.status = 'completed'";

    $overallStats = $db->fetchOne($sql, [$selectedSetId]);
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>교사 대시보드 - Jump Thinking Analytics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Malgun Gothic', sans-serif; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; }
        .header-content { max-width: 1200px; margin: 0 auto; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .controls { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .controls select { padding: 10px; font-size: 16px; border: 2px solid #dce0e3; border-radius: 6px; width: 100%; max-width: 400px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #7f8c8d; font-size: 14px; font-weight: normal; margin-bottom: 10px; }
        .stat-card .value { font-size: 36px; font-weight: bold; color: #2c3e50; }
        .stat-card .subtext { color: #95a5a6; font-size: 14px; margin-top: 5px; }
        .card { background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h2 { font-size: 20px; color: #2c3e50; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #dee2e6; }
        table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-jumper { background: #fee; color: #c00; }
        .badge-sequential { background: #efe; color: #080; }
        .badge-mixed { background: #ffeaa7; color: #856404; }
        .score { font-weight: bold; font-size: 18px; }
        .score.high { color: #e74c3c; }
        .score.medium { color: #f39c12; }
        .score.low { color: #27ae60; }
        .chart-bar { height: 30px; background: #ecf0f1; border-radius: 4px; overflow: hidden; margin: 10px 0; position: relative; }
        .chart-fill { height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.3s; }
        .chart-label { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: 600; color: #2c3e50; }
        .no-data { text-align: center; padding: 40px; color: #95a5a6; }
        .event-icon { font-size: 24px; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <h1>🎓 비약 사고 분석 대시보드</h1>
            <p>교사: <?php echo htmlspecialchars($teacher['full_name']); ?></p>
        </div>
    </div>

    <div class="container">
        <div class="controls">
            <label for="setSelect"><strong>문제 세트 선택:</strong></label>
            <select id="setSelect" onchange="changeProblemSet(this.value)">
                <option value="">-- 문제 세트를 선택하세요 --</option>
                <?php foreach ($problemSets as $set): ?>
                    <option value="<?php echo $set['id']; ?>"
                            <?php echo $selectedSetId == $set['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($set['title']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <?php if ($selectedSetId && $overallStats): ?>

            <!-- Overall Statistics -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>총 학생 수</h3>
                    <div class="value"><?php echo $overallStats['total_students']; ?></div>
                    <div class="subtext"><?php echo $overallStats['total_sessions']; ?> 세션</div>
                </div>

                <div class="stat-card">
                    <h3>평균 비약 점수</h3>
                    <div class="value"><?php echo round($overallStats['avg_jump_score'] ?? 0); ?></div>
                    <div class="subtext">0-100 점수</div>
                </div>

                <div class="stat-card">
                    <h3>비약 사고형 학생</h3>
                    <div class="value" style="color: #e74c3c;"><?php echo $overallStats['jumper_count']; ?></div>
                    <div class="subtext">점수 ≥ 60</div>
                </div>

                <div class="stat-card">
                    <h3>순차 사고형 학생</h3>
                    <div class="value" style="color: #27ae60;"><?php echo $overallStats['sequential_count']; ?></div>
                    <div class="subtext">점수 < 30</div>
                </div>
            </div>

            <!-- Event Statistics -->
            <div class="card">
                <h2>📊 감지된 패턴 유형</h2>
                <?php if ($eventStats): ?>
                    <?php
                    $eventNames = [
                        'step_skip' => '단계 건너뛰기',
                        'fast_solve' => '빠른 풀이',
                        'sequence_violation' => '순서 위반',
                        'direct_answer' => '직접 답 도출'
                    ];
                    $maxCount = max(array_column($eventStats, 'count'));
                    ?>
                    <?php foreach ($eventStats as $stat): ?>
                        <div>
                            <strong><?php echo $eventNames[$stat['event_type']] ?? $stat['event_type']; ?>:</strong>
                            <?php echo $stat['count']; ?>회
                            (심각도 높음: <?php echo round($stat['high_severity_pct']); ?>%)
                            <div class="chart-bar">
                                <div class="chart-fill" style="width: <?php echo ($stat['count'] / $maxCount) * 100; ?>%"></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="no-data">아직 분석 데이터가 없습니다.</div>
                <?php endif; ?>
            </div>

            <!-- Student List -->
            <div class="card">
                <h2>👥 학생별 분석</h2>
                <?php if ($students): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>학생 이름</th>
                                <th>세션 수</th>
                                <th>평균 비약 점수</th>
                                <th>학습 성향</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($students as $student): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($student['full_name']); ?></td>
                                    <td><?php echo $student['total_sessions']; ?></td>
                                    <td>
                                        <?php
                                        $score = round($student['avg_jump_score'] ?? 0);
                                        $scoreClass = $score >= 60 ? 'high' : ($score >= 30 ? 'medium' : 'low');
                                        ?>
                                        <span class="score <?php echo $scoreClass; ?>"><?php echo $score; ?></span>
                                    </td>
                                    <td>
                                        <?php
                                        $tendency = $student['tendency'] ?? 'mixed';
                                        $badgeClass = $tendency === 'jumper' ? 'badge-jumper' :
                                                     ($tendency === 'sequential' ? 'badge-sequential' : 'badge-mixed');
                                        $tendencyText = [
                                            'jumper' => '비약형',
                                            'sequential' => '순차형',
                                            'mixed' => '혼합형'
                                        ];
                                        ?>
                                        <span class="badge <?php echo $badgeClass; ?>">
                                            <?php echo $tendencyText[$tendency]; ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div class="no-data">아직 학생 데이터가 없습니다.</div>
                <?php endif; ?>
            </div>

            <!-- Recent Sessions -->
            <div class="card">
                <h2>🕒 최근 세션</h2>
                <?php if ($recentSessions): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>학생</th>
                                <th>시작 시간</th>
                                <th>상태</th>
                                <th>비약 점수</th>
                                <th>이벤트</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recentSessions as $session): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($session['student_name']); ?></td>
                                    <td><?php echo date('Y-m-d H:i', strtotime($session['started_at'])); ?></td>
                                    <td>
                                        <?php
                                        $statusText = [
                                            'in_progress' => '진행중',
                                            'completed' => '완료',
                                            'abandoned' => '중단'
                                        ];
                                        echo $statusText[$session['status']] ?? $session['status'];
                                        ?>
                                    </td>
                                    <td>
                                        <?php if ($session['jump_score'] !== null): ?>
                                            <?php
                                            $score = round($session['jump_score']);
                                            $scoreClass = $score >= 60 ? 'high' : ($score >= 30 ? 'medium' : 'low');
                                            ?>
                                            <span class="score <?php echo $scoreClass; ?>"><?php echo $score; ?></span>
                                        <?php else: ?>
                                            <span style="color: #95a5a6;">-</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($session['total_events']): ?>
                                            단계 건너뛰기: <?php echo $session['step_skips']; ?>,
                                            빠른 풀이: <?php echo $session['fast_solves']; ?>
                                        <?php else: ?>
                                            <span style="color: #95a5a6;">-</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div class="no-data">아직 세션 데이터가 없습니다.</div>
                <?php endif; ?>
            </div>

        <?php elseif ($selectedSetId): ?>
            <div class="card">
                <div class="no-data">선택한 문제 세트에 대한 데이터가 없습니다.</div>
            </div>
        <?php else: ?>
            <div class="card">
                <div class="no-data">문제 세트를 선택하세요.</div>
            </div>
        <?php endif; ?>

        <?php if (isset($_SESSION['return_url'])): ?>
            <div style="text-align: center; margin-top: 30px;">
                <a href="<?php echo htmlspecialchars($_SESSION['return_url']); ?>"
                   style="display: inline-block; padding: 12px 30px; background: #3498db; color: white; text-decoration: none; border-radius: 6px;">
                    Moodle로 돌아가기
                </a>
            </div>
        <?php endif; ?>
    </div>

    <script>
        function changeProblemSet(setId) {
            if (setId) {
                window.location.href = '?set_id=' + setId;
            }
        }
    </script>
</body>
</html>
