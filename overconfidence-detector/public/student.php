<?php
/**
 * Student Warning Page
 * 학생 과신 오류 경고 페이지
 */

require_once __DIR__ . '/../src/autoload.php';

use OverconfidenceDetector\Controllers\DashboardController;
use OverconfidenceDetector\Utils\Database;

$controller = new DashboardController();
$db = Database::getInstance('main');

// 학생 ID (실제로는 Moodle 세션에서 가져와야 함)
$moodleUserId = $_GET['userid'] ?? null;

if (!$moodleUserId) {
    die('학생 ID가 필요합니다.');
}

// 학생 정보 가져오기
$student = $db->selectOne(
    "SELECT * FROM students WHERE moodle_user_id = ?",
    [$moodleUserId]
);

if (!$student) {
    die('학생 정보를 찾을 수 없습니다.');
}

// 학생 상세 정보
$details = $controller->getStudentDetails($student['id']);
$stats = $details['stats'];
$recentFlags = $details['recent_flags'];
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>학습 패턴 피드백</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .main-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-top: 30px;
        }
        .header-section {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 40px;
            border-radius: 15px 15px 0 0;
            text-align: center;
        }
        .warning-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .stat-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 10px 0;
            text-align: center;
        }
        .tip-card {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-card">
            <!-- 헤더 -->
            <div class="header-section">
                <div class="warning-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <h2>
                    <?php echo htmlspecialchars($student['firstname'] . ' ' . $student['lastname']); ?>님의
                    <br>학습 패턴 피드백
                </h2>
            </div>

            <div class="p-5">
                <?php if ($stats['total_flags'] > 0): ?>
                    <!-- 경고 메시지 -->
                    <div class="alert alert-warning">
                        <h5>
                            <i class="fas fa-exclamation-triangle"></i>
                            과신 오류 감지
                        </h5>
                        <p class="mb-0">
                            최근 문제를 너무 빨리 푸는 경향이 감지되었습니다.
                            부주의로 인한 실수가 발생할 수 있으니, 문제를 천천히 읽고 신중하게 풀어보세요.
                        </p>
                    </div>

                    <!-- 통계 -->
                    <div class="row mt-4">
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h3 class="text-primary"><?php echo $stats['total_flags']; ?></h3>
                                <p class="text-muted mb-0">전체 경고</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h3 class="text-danger"><?php echo $stats['danger_count']; ?></h3>
                                <p class="text-muted mb-0">위험 (빨강)</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h3 class="text-success"><?php echo $stats['fast_correct']; ?></h3>
                                <p class="text-muted mb-0">빠른 정답</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h3 class="text-warning"><?php echo $stats['fast_incorrect']; ?></h3>
                                <p class="text-muted mb-0">빠른 오답</p>
                            </div>
                        </div>
                    </div>

                    <!-- 개선 팁 -->
                    <div class="mt-5">
                        <h4><i class="fas fa-star"></i> 학습 개선 팁</h4>

                        <div class="tip-card">
                            <h6><i class="fas fa-book-reader"></i> 1. 문제를 천천히 읽으세요</h6>
                            <p class="mb-0">
                                문제를 읽는데 충분한 시간을 투자하세요. 중요한 키워드나 조건을 놓치지 않도록 주의깊게 읽어보세요.
                            </p>
                        </div>

                        <div class="tip-card">
                            <h6><i class="fas fa-check-double"></i> 2. 답을 검토하세요</h6>
                            <p class="mb-0">
                                답을 제출하기 전에 한 번 더 확인하세요. 계산 실수나 단순 오류를 발견할 수 있습니다.
                            </p>
                        </div>

                        <div class="tip-card">
                            <h6><i class="fas fa-brain"></i> 3. 이해하고 풀기</h6>
                            <p class="mb-0">
                                단순히 빠르게 푸는 것보다, 문제를 완전히 이해하고 푸는 것이 중요합니다.
                                속도보다 정확성에 집중하세요.
                            </p>
                        </div>

                        <div class="tip-card">
                            <h6><i class="fas fa-clock"></i> 4. 적절한 시간 배분</h6>
                            <p class="mb-0">
                                각 문제에 적절한 시간을 할애하세요. 너무 빨리 풀면 실수할 가능성이 높아집니다.
                            </p>
                        </div>
                    </div>

                    <!-- 최근 과신 오류 기록 -->
                    <?php if (!empty($recentFlags)): ?>
                        <div class="mt-5">
                            <h4><i class="fas fa-history"></i> 최근 기록</h4>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>날짜</th>
                                            <th>퀴즈</th>
                                            <th>내 시간</th>
                                            <th>평균 시간</th>
                                            <th>정답</th>
                                            <th>수준</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach (array_slice($recentFlags, 0, 10) as $flag): ?>
                                            <tr>
                                                <td><?php echo date('m-d', strtotime($flag['created_at'])); ?></td>
                                                <td><?php echo htmlspecialchars(substr($flag['quiz_name'], 0, 30)); ?></td>
                                                <td class="text-danger">
                                                    <strong><?php echo $flag['time_spent_seconds']; ?>초</strong>
                                                </td>
                                                <td><?php echo $flag['avg_time_seconds']; ?>초</td>
                                                <td>
                                                    <?php if ($flag['is_correct']): ?>
                                                        <span class="text-success">O</span>
                                                    <?php else: ?>
                                                        <span class="text-danger">X</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php
                                                    $levelColors = [
                                                        'caution' => 'warning',
                                                        'warning' => 'warning',
                                                        'danger' => 'danger'
                                                    ];
                                                    $levelTexts = [
                                                        'caution' => '주의',
                                                        'warning' => '경고',
                                                        'danger' => '위험'
                                                    ];
                                                    ?>
                                                    <span class="badge badge-<?php echo $levelColors[$flag['flag_level']]; ?>">
                                                        <?php echo $levelTexts[$flag['flag_level']]; ?>
                                                    </span>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    <?php endif; ?>

                <?php else: ?>
                    <!-- 긍정적 피드백 -->
                    <div class="alert alert-success text-center py-5">
                        <i class="fas fa-check-circle fa-3x mb-3"></i>
                        <h4>훌륭합니다!</h4>
                        <p class="mb-0">
                            현재 적절한 속도로 문제를 풀고 있습니다. 계속 이렇게 신중하게 학습하세요!
                        </p>
                    </div>

                    <div class="text-center mt-4">
                        <img src="https://via.placeholder.com/300x200/4CAF50/ffffff?text=Keep+Going!" alt="Good Job" class="img-fluid rounded">
                    </div>
                <?php endif; ?>

                <!-- 동기부여 메시지 -->
                <div class="mt-5 p-4 bg-light rounded text-center">
                    <h5><i class="fas fa-quote-left"></i> 기억하세요!</h5>
                    <p class="lead mb-0">
                        "빠르게 푸는 것보다 <strong>정확하게</strong> 푸는 것이 중요합니다."
                    </p>
                </div>

                <div class="text-center mt-4">
                    <a href="javascript:history.back()" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> 돌아가기
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
