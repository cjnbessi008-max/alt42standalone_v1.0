<?php
/**
 * Main Dashboard - Shows rhythm and routine analysis
 */

session_start();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/api/moodle_connector.php';
require_once __DIR__ . '/../src/models/learning_data.php';
require_once __DIR__ . '/../src/analysis/rhythm_analyzer.php';
require_once __DIR__ . '/../src/analysis/routine_analyzer.php';
require_once __DIR__ . '/../src/utils/helpers.php';

// Check login
if (!isLoggedIn()) {
    redirect('index.php');
}

$user_id = getCurrentUserId();
$moodle_user_id = $_SESSION['moodle_user_id'] ?? null;

// Handle data collection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    try {
        if ($action === 'collect_data') {
            $learningData = new LearningData();
            $count = $learningData->collectQuizData($moodle_user_id, 30);
            $learningData->buildLearningSessions($user_id, 30);

            setFlashMessage('success', "학습 데이터 수집 완료! ($count 개 활동)");
            redirect('dashboard.php');
        } else if ($action === 'analyze') {
            $rhythmAnalyzer = new RhythmAnalyzer();
            $routineAnalyzer = new RoutineAnalyzer();

            $rhythmAnalyzer->analyzeRhythm($user_id, 30);
            $routineAnalyzer->analyzeRoutine($user_id, 30);

            // Generate daily snapshots
            for ($i = 0; $i < 30; $i++) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $rhythmAnalyzer->generateDailySnapshot($user_id, $date);
            }

            setFlashMessage('success', '분석 완료!');
            redirect('dashboard.php');
        } else if ($action === 'logout') {
            session_destroy();
            redirect('index.php');
        }
    } catch (Exception $e) {
        setFlashMessage('error', '오류: ' . $e->getMessage());
    }
}

// Get user info
$db = new Database();
$conn = $db->getConnection();

$query = "SELECT * FROM users WHERE id = :user_id";
$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();
$user = $stmt->fetch();

// Get analysis results
$rhythmAnalyzer = new RhythmAnalyzer();
$routineAnalyzer = new RoutineAnalyzer();

$rhythmPattern = $rhythmAnalyzer->getLatestPattern($user_id);
$thinkingRoutine = $routineAnalyzer->getLatestRoutine($user_id);

// Get daily snapshots
$query = "SELECT * FROM daily_focus_snapshots
         WHERE user_id = :user_id
         AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         ORDER BY snapshot_date ASC";
$stmt = $conn->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();
$daily_snapshots = $stmt->fetchAll();

// Get response time distribution
$responseDistribution = $routineAnalyzer->getResponseTimeDistribution($user_id, 30);

// Get accuracy by type
$accuracyByType = $routineAnalyzer->getAccuracyByType($user_id, 30);

$flash = getFlashMessage();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>학습 리듬 분석 대시보드</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <div class="header-content">
                <h1>학습 리듬 분석 대시보드</h1>
                <div class="user-info">
                    <span class="user-name"><?= e($user['fullname']) ?></span>
                    <form method="POST" style="display: inline;">
                        <input type="hidden" name="action" value="logout">
                        <button type="submit" class="btn btn-sm btn-secondary">로그아웃</button>
                    </form>
                </div>
            </div>
        </header>

        <?php if ($flash): ?>
            <div class="alert alert-<?= e($flash['type']) ?>">
                <?= e($flash['message']) ?>
            </div>
        <?php endif; ?>

        <div class="action-bar">
            <form method="POST" style="display: inline;">
                <input type="hidden" name="action" value="collect_data">
                <button type="submit" class="btn btn-primary">📥 데이터 수집</button>
            </form>

            <form method="POST" style="display: inline;">
                <input type="hidden" name="action" value="analyze">
                <button type="submit" class="btn btn-success">📊 분석 실행</button>
            </form>
        </div>

        <?php if (!$rhythmPattern && !$thinkingRoutine): ?>
            <div class="info-card">
                <h2>시작하기</h2>
                <p>학습 데이터를 수집하고 분석을 실행하여 리듬 패턴을 확인하세요.</p>
                <ol>
                    <li>먼저 "데이터 수집" 버튼을 클릭하여 Moodle에서 학습 데이터를 가져옵니다.</li>
                    <li>그 다음 "분석 실행" 버튼을 클릭하여 리듬과 루틴을 분석합니다.</li>
                </ol>
            </div>
        <?php else: ?>

            <!-- Rhythm Pattern Section -->
            <?php if ($rhythmPattern): ?>
                <div class="analysis-section">
                    <h2>📈 학습 리듬 패턴</h2>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">패턴 유형</div>
                            <div class="stat-value"><?= e(getPatternTypeKorean($rhythmPattern['pattern_type'])) ?></div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">규칙성 점수</div>
                            <div class="stat-value <?= getScoreColorClass($rhythmPattern['consistency_score']) ?>">
                                <?= e(number_format($rhythmPattern['consistency_score'], 1)) ?>점
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">패턴 강도</div>
                            <div class="stat-value <?= getScoreColorClass($rhythmPattern['pattern_strength']) ?>">
                                <?= e(number_format($rhythmPattern['pattern_strength'], 1)) ?>점
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">최적 학습 시간</div>
                            <div class="stat-value"><?= e($rhythmPattern['optimal_session_duration']) ?>분</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">평균 학습 간격</div>
                            <div class="stat-value"><?= e(number_format($rhythmPattern['avg_session_gap_hours'], 1)) ?>시간</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">최적 학습 시간대</div>
                            <div class="stat-value">
                                <?php
                                $peak_hours = json_decode($rhythmPattern['peak_hours'], true);
                                $peak_hours_str = array_map(function($h) {
                                    return $h . '시';
                                }, array_slice($peak_hours, 0, 3));
                                echo e(implode(', ', $peak_hours_str));
                                ?>
                            </div>
                        </div>
                    </div>

                    <?php if (!empty($daily_snapshots)): ?>
                        <div class="chart-container">
                            <h3>일일 집중도 추이 (30일)</h3>
                            <canvas id="focusChart"></canvas>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <!-- Thinking Routine Section -->
            <?php if ($thinkingRoutine): ?>
                <div class="analysis-section">
                    <h2>🧠 사고 루틴 분석</h2>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">루틴 유형</div>
                            <div class="stat-value"><?= e(getRoutineTypeKorean($thinkingRoutine['routine_type'])) ?></div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">평균 응답 시간</div>
                            <div class="stat-value"><?= formatTime(round($thinkingRoutine['avg_response_time'])) ?></div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">빠른 문제 비율</div>
                            <div class="stat-value"><?= e(number_format($thinkingRoutine['quick_question_ratio'], 1)) ?>%</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">신중한 문제 비율</div>
                            <div class="stat-value"><?= e(number_format($thinkingRoutine['slow_question_ratio'], 1)) ?>%</div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">반복 학습 패턴</div>
                            <div class="stat-value"><?= e(getRevisionPatternKorean($thinkingRoutine['revision_pattern'])) ?></div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">오답 수정률</div>
                            <div class="stat-value <?= getScoreColorClass($thinkingRoutine['error_correction_rate']) ?>">
                                <?= e(number_format($thinkingRoutine['error_correction_rate'], 1)) ?>%
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-label">문제 풀이 방식</div>
                            <div class="stat-value"><?= e(getApproachKorean($thinkingRoutine['problem_solving_approach'])) ?></div>
                        </div>
                    </div>

                    <div class="charts-row">
                        <?php if (!empty($responseDistribution)): ?>
                            <div class="chart-container">
                                <h3>응답 시간 분포</h3>
                                <canvas id="responseTimeChart"></canvas>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($accuracyByType)): ?>
                            <div class="chart-container">
                                <h3>문제 유형별 정확도</h3>
                                <canvas id="accuracyChart"></canvas>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>

        <?php endif; ?>
    </div>

    <script>
        // Daily Focus Chart
        <?php if (!empty($daily_snapshots)): ?>
        const focusData = {
            labels: <?= json_encode(array_map(function($s) { return date('m/d', strtotime($s['snapshot_date'])); }, $daily_snapshots)) ?>,
            datasets: [{
                label: '집중도 점수',
                data: <?= json_encode(array_map(function($s) { return $s['focus_score']; }, $daily_snapshots)) ?>,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true
            }]
        };

        new Chart(document.getElementById('focusChart'), {
            type: 'line',
            data: focusData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        <?php endif; ?>

        // Response Time Distribution Chart
        <?php if (!empty($responseDistribution)): ?>
        const responseTimeData = {
            labels: <?= json_encode(array_keys($responseDistribution)) ?>,
            datasets: [{
                label: '문제 수',
                data: <?= json_encode(array_values($responseDistribution)) ?>,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ]
            }]
        };

        new Chart(document.getElementById('responseTimeChart'), {
            type: 'bar',
            data: responseTimeData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        <?php endif; ?>

        // Accuracy by Type Chart
        <?php if (!empty($accuracyByType)): ?>
        const accuracyData = {
            labels: <?= json_encode(array_map(function($a) { return $a['question_type']; }, $accuracyByType)) ?>,
            datasets: [{
                label: '정확도 (%)',
                data: <?= json_encode(array_map(function($a) { return round($a['accuracy'], 1); }, $accuracyByType)) ?>,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        new Chart(document.getElementById('accuracyChart'), {
            type: 'bar',
            data: accuracyData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        <?php endif; ?>
    </script>
</body>
</html>
