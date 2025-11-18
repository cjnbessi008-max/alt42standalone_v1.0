<?php
/**
 * Main Entry Point
 * 메인 페이지
 */

require_once __DIR__ . '/../src/autoload.php';

use OverconfidenceDetector\Controllers\DashboardController;

$controller = new DashboardController();
$stats = $controller->getSummaryStats();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>과신 오류 탐지 시스템</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-brain"></i> 과신 오류 탐지 시스템
            </a>
            <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/dashboard.php">
                        <i class="fas fa-chart-line"></i> 대시보드
                    </a>
                </li>
            </ul>
        </div>
    </nav>

    <div class="container mt-5">
        <div class="jumbotron">
            <h1 class="display-4">
                <i class="fas fa-exclamation-triangle text-warning"></i>
                과신 오류 탐지 시스템
            </h1>
            <p class="lead">
                학생들의 문제 풀이 속도를 분석하여 지나치게 빠른 풀이(과신 오류)를 자동으로 탐지하고 경고합니다.
            </p>
            <hr class="my-4">
            <p>
                통계 기반 Z-score 알고리즘을 사용하여 평균 대비 비정상적으로 빠른 풀이를 식별하고,
                교사에게 실시간으로 알려줍니다.
            </p>
        </div>

        <h2 class="mb-4">
            <i class="fas fa-chart-bar"></i> 최근 7일 통계
        </h2>

        <div class="row">
            <div class="col-md-3 mb-3">
                <div class="card border-info">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">전체 플래그</h5>
                        <h2 class="text-info">
                            <?php echo number_format($stats['total_flags'] ?? 0); ?>
                        </h2>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card border-warning">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">Level 1 (주의)</h5>
                        <h2 class="text-warning">
                            <?php echo number_format($stats['caution_count'] ?? 0); ?>
                        </h2>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card border-warning">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">Level 2 (경고)</h5>
                        <h2 class="text-warning">
                            <?php echo number_format($stats['warning_count'] ?? 0); ?>
                        </h2>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card border-danger">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">Level 3 (위험)</h5>
                        <h2 class="text-danger">
                            <?php echo number_format($stats['danger_count'] ?? 0); ?>
                        </h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">
                            <i class="fas fa-users"></i> 영향받은 학생
                        </h5>
                        <h3><?php echo number_format($stats['affected_students'] ?? 0); ?>명</h3>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">
                            <i class="fas fa-clipboard-list"></i> 관련 퀴즈
                        </h5>
                        <h3><?php echo number_format($stats['affected_quizzes'] ?? 0); ?>개</h3>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h5 class="card-title text-muted">
                            <i class="fas fa-bell"></i> 미검토 건
                        </h5>
                        <h3 class="text-danger">
                            <?php echo number_format($stats['unreviewed_count'] ?? 0); ?>건
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-5 text-center">
            <a href="/dashboard.php" class="btn btn-primary btn-lg">
                <i class="fas fa-tachometer-alt"></i> 교사 대시보드 열기
            </a>
        </div>

        <div class="mt-5">
            <h3><i class="fas fa-info-circle"></i> 주요 기능</h3>
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-search text-primary"></i> 자동 탐지
                            </h5>
                            <p class="card-text">
                                Z-score 알고리즘으로 비정상적으로 빠른 풀이를 자동 탐지
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-chart-line text-success"></i> 시각화
                            </h5>
                            <p class="card-text">
                                풀이 시간 분포와 위험 구간을 그래프로 시각화
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-user-shield text-warning"></i> 피드백
                            </h5>
                            <p class="card-text">
                                학생에게 자기 성찰을 유도하는 맞춤형 경고 메시지
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-light mt-5 py-4">
        <div class="container text-center text-muted">
            <p>KAIST Touch Math Academy - Overconfidence Error Detection System v1.0</p>
        </div>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
