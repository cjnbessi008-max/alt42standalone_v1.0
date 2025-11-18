<?php
/**
 * Analytics Dashboard
 * View student reading behavior and condition compliance
 */

require_once __DIR__ . '/../config/database.php';
session_start();

$problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

if (!$problemId) {
    die("Problem ID is required");
}

$db = getDB();

// Get problem info
$problem = $db->fetchOne(
    "SELECT * FROM problems WHERE id = ?",
    [$problemId]
);

if (!$problem) {
    die("Problem not found");
}

// Get student progress stats
$stats = $db->fetchOne(
    "SELECT
        COUNT(DISTINCT sp.student_id) as total_students,
        AVG(sp.total_reading_time) as avg_reading_time,
        MIN(sp.total_reading_time) as min_reading_time,
        MAX(sp.total_reading_time) as max_reading_time,
        SUM(CASE WHEN sp.status = 'submitted' OR sp.status = 'completed' THEN 1 ELSE 0 END) as submitted_count,
        AVG(sp.submission_attempts) as avg_attempts
    FROM student_progress sp
    WHERE sp.problem_id = ?",
    [$problemId]
);

// Get condition compliance data
$conditionCompliance = $db->fetchAll(
    "SELECT
        c.id,
        c.condition_text,
        c.is_critical,
        COUNT(DISTINCT cc.student_id) as students_checked,
        AVG(cc.time_to_check) as avg_time_to_check
    FROM conditions c
    LEFT JOIN condition_checks cc ON c.id = cc.condition_id
    WHERE c.problem_id = ?
    GROUP BY c.id
    ORDER BY c.condition_order",
    [$problemId]
);

// Get detailed student progress
$studentProgress = $db->fetchAll(
    "SELECT
        s.name as student_name,
        sp.status,
        sp.total_reading_time,
        sp.submission_attempts,
        sp.started_at,
        sp.first_submission_at,
        COUNT(DISTINCT cc.condition_id) as conditions_checked
    FROM student_progress sp
    JOIN students s ON sp.student_id = s.id
    LEFT JOIN condition_checks cc ON sp.student_id = cc.student_id AND sp.problem_id = cc.problem_id
    WHERE sp.problem_id = ?
    GROUP BY sp.id
    ORDER BY sp.updated_at DESC",
    [$problemId]
);

// Get reading behavior stats
$behaviorStats = $db->fetchAll(
    "SELECT
        AVG(scroll_events) as avg_scroll,
        AVG(mouse_movements) as avg_mouse,
        AVG(focus_lost_count) as avg_focus_lost,
        AVG(duration_seconds) as avg_session_duration
    FROM student_reading_sessions
    WHERE problem_id = ?",
    [$problemId]
);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>분석 - <?php echo htmlspecialchars($problem['title']); ?></title>
    <link rel="stylesheet" href="../assets/css/admin.css">
    <style>
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }

        .stat-card h3 {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .stat-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
        }

        .table-container {
            background: white;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            overflow: hidden;
            margin-bottom: 32px;
        }

        .table-header {
            background: #f7fafc;
            padding: 20px;
            border-bottom: 2px solid #e2e8f0;
        }

        .table-header h3 {
            font-size: 18px;
            color: #2d3748;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 16px 20px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            background: #f7fafc;
            font-weight: 600;
            color: #4a5568;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            color: #2d3748;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .progress-bar-mini {
            background: #e2e8f0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        }

        .progress-bar-mini .fill {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1>분석 대시보드</h1>
                <a href="index.php" class="btn btn-secondary">← 돌아가기</a>
            </div>
        </header>

        <main class="main-content">
            <h2><?php echo htmlspecialchars($problem['title']); ?></h2>

            <div class="analytics-grid">
                <div class="stat-card">
                    <h3>총 학생 수</h3>
                    <div class="value"><?php echo $stats['total_students'] ?? 0; ?></div>
                </div>

                <div class="stat-card">
                    <h3>평균 읽기 시간</h3>
                    <div class="value"><?php echo gmdate("i:s", $stats['avg_reading_time'] ?? 0); ?></div>
                </div>

                <div class="stat-card">
                    <h3>제출 완료</h3>
                    <div class="value"><?php echo $stats['submitted_count'] ?? 0; ?></div>
                </div>

                <div class="stat-card">
                    <h3>평균 제출 시도</h3>
                    <div class="value"><?php echo number_format($stats['avg_attempts'] ?? 0, 1); ?></div>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>조건별 준수율</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>조건</th>
                            <th>필수 여부</th>
                            <th>확인한 학생 수</th>
                            <th>평균 확인 시간</th>
                            <th>준수율</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($conditionCompliance as $cond): ?>
                        <tr>
                            <td><?php echo htmlspecialchars(substr($cond['condition_text'], 0, 100)); ?></td>
                            <td>
                                <?php if ($cond['is_critical']): ?>
                                    <span class="badge" style="background: #fed7d7; color: #742a2a;">필수</span>
                                <?php else: ?>
                                    <span class="badge">선택</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo $cond['students_checked'] ?? 0; ?></td>
                            <td><?php echo gmdate("i:s", $cond['avg_time_to_check'] ?? 0); ?></td>
                            <td>
                                <?php
                                $totalStudents = $stats['total_students'] ?? 1;
                                $compliance = $totalStudents > 0 ? ($cond['students_checked'] / $totalStudents * 100) : 0;
                                ?>
                                <?php echo number_format($compliance, 1); ?>%
                                <div class="progress-bar-mini">
                                    <div class="fill" style="width: <?php echo $compliance; ?>%"></div>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>학생별 진행 상황</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>학생명</th>
                            <th>상태</th>
                            <th>읽기 시간</th>
                            <th>조건 확인</th>
                            <th>제출 시도</th>
                            <th>시작 시간</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($studentProgress)): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; color: #718096;">
                                아직 학생 데이터가 없습니다.
                            </td>
                        </tr>
                        <?php else: ?>
                            <?php foreach ($studentProgress as $progress): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($progress['student_name']); ?></td>
                                <td>
                                    <span class="badge"><?php echo htmlspecialchars($progress['status']); ?></span>
                                </td>
                                <td><?php echo gmdate("i:s", $progress['total_reading_time']); ?></td>
                                <td><?php echo $progress['conditions_checked']; ?> / <?php echo count($conditionCompliance); ?></td>
                                <td><?php echo $progress['submission_attempts']; ?></td>
                                <td><?php echo date('Y-m-d H:i', strtotime($progress['started_at'])); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>
</body>
</html>
