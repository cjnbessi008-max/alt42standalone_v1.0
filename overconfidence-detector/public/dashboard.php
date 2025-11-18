<?php
/**
 * Teacher Dashboard
 * 교사 대시보드
 */

require_once __DIR__ . '/../src/autoload.php';

use OverconfidenceDetector\Controllers\DashboardController;

$controller = new DashboardController();

// 요청 파라미터
$view = $_GET['view'] ?? 'overview';
$quizId = $_GET['quiz_id'] ?? null;
$studentId = $_GET['student_id'] ?? null;

// 데이터 가져오기
$stats = $controller->getSummaryStats();
$recentDangerFlags = $controller->getRecentDangerFlags(10);
$highRiskStudents = $controller->getHighRiskStudents(10);
$trendData = $controller->getFlagTrendData(7);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>교사 대시보드 - 과신 오류 탐지</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .flag-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .flag-caution {
            background-color: #fff3cd;
            color: #856404;
        }
        .flag-warning {
            background-color: #ffe5b4;
            color: #cc6600;
        }
        .flag-danger {
            background-color: #f8d7da;
            color: #721c24;
        }
        .student-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            cursor: pointer;
        }
        .stat-card {
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
    </style>
</head>
<body>
    <!-- 네비게이션 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">
                <i class="fas fa-brain"></i> 과신 오류 탐지
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item active">
                        <a class="nav-link" href="/dashboard.php">
                            <i class="fas fa-tachometer-alt"></i> 대시보드
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/dashboard.php?view=students">
                            <i class="fas fa-users"></i> 학생 목록
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/dashboard.php?view=quizzes">
                            <i class="fas fa-clipboard-list"></i> 퀴즈 분석
                        </a>
                    </li>
                </ul>
                <span class="navbar-text">
                    <i class="fas fa-user-circle"></i> 교사
                </span>
            </div>
        </div>
    </nav>

    <div class="container-fluid mt-4">
        <div class="row">
            <!-- 사이드바 -->
            <div class="col-md-2 bg-light sidebar">
                <div class="pt-3">
                    <h6 class="text-muted pl-3">메뉴</h6>
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link <?php echo $view === 'overview' ? 'active' : ''; ?>" href="?view=overview">
                                <i class="fas fa-home"></i> 개요
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo $view === 'realtime' ? 'active' : ''; ?>" href="?view=realtime">
                                <i class="fas fa-bolt"></i> 실시간 알림
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo $view === 'students' ? 'active' : ''; ?>" href="?view=students">
                                <i class="fas fa-users"></i> 위험 학생
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo $view === 'quizzes' ? 'active' : ''; ?>" href="?view=quizzes">
                                <i class="fas fa-clipboard-list"></i> 퀴즈 분석
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo $view === 'trends' ? 'active' : ''; ?>" href="?view=trends">
                                <i class="fas fa-chart-line"></i> 추세 분석
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- 메인 컨텐츠 -->
            <div class="col-md-10">
                <!-- 헤더 -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>
                        <i class="fas fa-tachometer-alt text-primary"></i>
                        <?php
                        $titles = [
                            'overview' => '대시보드 개요',
                            'realtime' => '실시간 위험 알림',
                            'students' => '위험 학생 목록',
                            'quizzes' => '퀴즈별 분석',
                            'trends' => '추세 분석',
                        ];
                        echo $titles[$view] ?? '대시보드';
                        ?>
                    </h2>
                    <div>
                        <span class="badge badge-secondary">
                            <i class="fas fa-clock"></i>
                            <?php echo date('Y-m-d H:i'); ?>
                        </span>
                        <button class="btn btn-sm btn-outline-primary ml-2" onclick="location.reload()">
                            <i class="fas fa-sync-alt"></i> 새로고침
                        </button>
                    </div>
                </div>

                <?php if ($view === 'overview'): ?>
                    <!-- 통계 카드 -->
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card border-primary">
                                <div class="card-body text-center">
                                    <i class="fas fa-flag fa-2x text-primary mb-2"></i>
                                    <h6 class="text-muted">전체 플래그 (7일)</h6>
                                    <h2 class="text-primary"><?php echo number_format($stats['total_flags'] ?? 0); ?></h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card border-danger">
                                <div class="card-body text-center">
                                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                                    <h6 class="text-muted">위험 (Level 3)</h6>
                                    <h2 class="text-danger"><?php echo number_format($stats['danger_count'] ?? 0); ?></h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card border-warning">
                                <div class="card-body text-center">
                                    <i class="fas fa-bell fa-2x text-warning mb-2"></i>
                                    <h6 class="text-muted">미검토 건</h6>
                                    <h2 class="text-warning"><?php echo number_format($stats['unreviewed_count'] ?? 0); ?></h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card stat-card border-info">
                                <div class="card-body text-center">
                                    <i class="fas fa-users fa-2x text-info mb-2"></i>
                                    <h6 class="text-muted">영향받은 학생</h6>
                                    <h2 class="text-info"><?php echo number_format($stats['affected_students'] ?? 0); ?></h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 최근 위험 플래그 -->
                    <div class="card mb-4">
                        <div class="card-header bg-danger text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-exclamation-circle"></i>
                                최근 위험 플래그 (Level 3)
                            </h5>
                        </div>
                        <div class="card-body p-0">
                            <?php if (empty($recentDangerFlags)): ?>
                                <div class="alert alert-success m-3">
                                    <i class="fas fa-check-circle"></i>
                                    최근 위험 플래그가 없습니다!
                                </div>
                            <?php else: ?>
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>시간</th>
                                                <th>학생</th>
                                                <th>퀴즈</th>
                                                <th>풀이 시간</th>
                                                <th>평균 시간</th>
                                                <th>Z-Score</th>
                                                <th>정답</th>
                                                <th>패턴</th>
                                                <th>작업</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($recentDangerFlags as $flag): ?>
                                                <tr>
                                                    <td><?php echo date('m-d H:i', strtotime($flag['created_at'])); ?></td>
                                                    <td>
                                                        <a href="?view=student&student_id=<?php echo $flag['moodle_user_id']; ?>">
                                                            <?php echo htmlspecialchars($flag['student_name']); ?>
                                                        </a>
                                                    </td>
                                                    <td><?php echo htmlspecialchars(substr($flag['quiz_name'], 0, 30)); ?></td>
                                                    <td>
                                                        <strong class="text-danger">
                                                            <?php echo $flag['time_spent_seconds']; ?>초
                                                        </strong>
                                                    </td>
                                                    <td><?php echo $flag['avg_time_seconds']; ?>초</td>
                                                    <td>
                                                        <span class="badge badge-danger">
                                                            <?php echo number_format($flag['z_score'], 2); ?>
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <?php if ($flag['is_correct']): ?>
                                                            <span class="text-success"><i class="fas fa-check"></i></span>
                                                        <?php else: ?>
                                                            <span class="text-danger"><i class="fas fa-times"></i></span>
                                                        <?php endif; ?>
                                                    </td>
                                                    <td>
                                                        <small class="text-muted">
                                                            <?php echo $flag['pattern_detected']; ?>
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-primary" onclick="reviewFlag(<?php echo $flag['id']; ?>)">
                                                            <i class="fas fa-check"></i> 검토
                                                        </button>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- 위험 학생 목록 -->
                    <div class="card">
                        <div class="card-header bg-warning">
                            <h5 class="mb-0">
                                <i class="fas fa-user-shield"></i>
                                위험 학생 Top 10
                            </h5>
                        </div>
                        <div class="card-body">
                            <?php if (empty($highRiskStudents)): ?>
                                <div class="alert alert-info">
                                    위험 학생이 없습니다.
                                </div>
                            <?php else: ?>
                                <div class="row">
                                    <?php foreach ($highRiskStudents as $student): ?>
                                        <div class="col-md-6 mb-3">
                                            <div class="card student-card" onclick="location.href='?view=student&student_id=<?php echo $student['student_id']; ?>'">
                                                <div class="card-body">
                                                    <h6>
                                                        <i class="fas fa-user"></i>
                                                        <?php echo htmlspecialchars($student['username']); ?>
                                                    </h6>
                                                    <div class="mt-2">
                                                        <span class="badge badge-danger mr-1">
                                                            위험 <?php echo $student['danger_count']; ?>건
                                                        </span>
                                                        <span class="badge badge-warning mr-1">
                                                            경고 <?php echo $student['warning_count']; ?>건
                                                        </span>
                                                        <span class="badge badge-secondary">
                                                            전체 <?php echo $student['total_flags']; ?>건
                                                        </span>
                                                    </div>
                                                    <div class="mt-2">
                                                        <small class="text-muted">
                                                            평균 Z-Score: <?php echo number_format($student['avg_z_score'], 2); ?>
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                <?php elseif ($view === 'trends'): ?>
                    <!-- 추세 분석 -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-chart-line"></i>
                                일별 플래그 발생 추세 (최근 7일)
                            </h5>
                        </div>
                        <div class="card-body">
                            <canvas id="trendChart" height="100"></canvas>
                        </div>
                    </div>

                    <script>
                        // Chart.js 데이터
                        var trendData = <?php echo json_encode($trendData); ?>;
                    </script>

                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script src="/js/dashboard.js"></script>

    <script>
        function reviewFlag(flagId) {
            if (confirm('이 플래그를 검토 완료 처리하시겠습니까?')) {
                $.post('/api/review-flag.php', {
                    flag_id: flagId,
                    notes: '검토 완료'
                }, function(response) {
                    if (response.success) {
                        alert('검토 완료되었습니다.');
                        location.reload();
                    }
                });
            }
        }

        // 자동 새로고침 (30초)
        setTimeout(function() {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
