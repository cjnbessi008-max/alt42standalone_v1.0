<?php
/**
 * Student Problem View
 * Interactive interface for reading problems and checking conditions
 */

require_once __DIR__ . '/../config/database.php';
session_start();

// For demo purposes, we'll use URL parameters
// In production, use proper authentication
$studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 1;
$problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : 1;

$db = getDB();

// Get problem details
$problem = $db->fetchOne(
    "SELECT * FROM problems WHERE id = ? AND is_active = 1",
    [$problemId]
);

if (!$problem) {
    die("Problem not found");
}

// Get conditions
$conditions = $db->fetchAll(
    "SELECT * FROM conditions WHERE problem_id = ? ORDER BY condition_order ASC",
    [$problemId]
);

// Get student info
$student = $db->fetchOne(
    "SELECT * FROM students WHERE id = ?",
    [$studentId]
);

if (!$student) {
    die("Student not found");
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($problem['title']); ?> - Condition Verification System</title>
    <link rel="stylesheet" href="../assets/css/student.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1><?php echo APP_NAME; ?></h1>
                <div class="student-info">
                    <span class="student-name"><?php echo htmlspecialchars($student['name']); ?></span>
                    <span class="student-grade">학년: <?php echo htmlspecialchars($student['grade_level']); ?></span>
                </div>
            </div>
        </header>

        <main class="main-content">
            <div class="problem-header">
                <h2><?php echo htmlspecialchars($problem['title']); ?></h2>
                <div class="problem-meta">
                    <span class="badge"><?php echo htmlspecialchars($problem['subject']); ?></span>
                    <span class="badge difficulty-<?php echo htmlspecialchars($problem['difficulty_level']); ?>">
                        <?php echo htmlspecialchars($problem['difficulty_level']); ?>
                    </span>
                </div>
            </div>

            <?php if ($problem['description']): ?>
            <div class="problem-description">
                <?php echo nl2br(htmlspecialchars($problem['description'])); ?>
            </div>
            <?php endif; ?>

            <div class="reading-timer">
                <div class="timer-icon">⏱️</div>
                <div class="timer-text">
                    읽기 시간: <span id="reading-time">00:00</span>
                    <span class="min-time-indicator" id="min-time-indicator">
                        (최소 <?php echo $problem['min_reading_time']; ?>초 필요)
                    </span>
                </div>
            </div>

            <div class="problem-content">
                <h3>문제</h3>
                <div class="problem-text">
                    <?php echo nl2br(htmlspecialchars($problem['problem_text'])); ?>
                </div>
            </div>

            <div class="conditions-section">
                <h3>중요 조건 확인</h3>
                <p class="conditions-instruction">
                    각 조건을 주의깊게 읽고 이해한 후 체크박스를 선택하세요.
                    <?php if ($problem['require_all_conditions']): ?>
                    <strong>모든 조건을 확인해야 답안을 제출할 수 있습니다.</strong>
                    <?php endif; ?>
                </p>

                <div class="conditions-list" id="conditions-list">
                    <?php foreach ($conditions as $condition): ?>
                    <div class="condition-item <?php echo $condition['is_critical'] ? 'critical' : ''; ?>"
                         data-condition-id="<?php echo $condition['id']; ?>"
                         style="border-left-color: <?php echo htmlspecialchars($condition['highlight_color']); ?>;">
                        <div class="condition-checkbox">
                            <input type="checkbox"
                                   id="condition-<?php echo $condition['id']; ?>"
                                   class="condition-check"
                                   data-condition-id="<?php echo $condition['id']; ?>"
                                   <?php echo $condition['is_critical'] ? 'required' : ''; ?>>
                            <label for="condition-<?php echo $condition['id']; ?>"></label>
                        </div>
                        <div class="condition-text">
                            <?php if ($condition['is_critical']): ?>
                            <span class="critical-badge">필수</span>
                            <?php endif; ?>
                            <?php echo nl2br(htmlspecialchars($condition['condition_text'])); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <div class="progress-indicator">
                    <div class="progress-text">
                        조건 확인 진행률: <span id="progress-count">0</span> / <?php echo count($conditions); ?>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
            </div>

            <div class="submission-section">
                <div class="submission-requirements" id="submission-requirements">
                    <h4>제출 전 확인사항</h4>
                    <ul id="requirements-list">
                        <li id="req-time" class="incomplete">
                            ⏱️ 최소 읽기 시간 (<?php echo $problem['min_reading_time']; ?>초)
                        </li>
                        <li id="req-conditions" class="incomplete">
                            ✓ 모든 중요 조건 확인
                        </li>
                    </ul>
                </div>

                <button id="submit-button" class="submit-button" disabled>
                    답안 제출하기
                </button>

                <div class="help-text">
                    문제를 충분히 읽고 모든 조건을 확인한 후 제출할 수 있습니다.
                </div>
            </div>
        </main>
    </div>

    <!-- Hidden data for JavaScript -->
    <input type="hidden" id="student-id" value="<?php echo $studentId; ?>">
    <input type="hidden" id="problem-id" value="<?php echo $problemId; ?>">
    <input type="hidden" id="min-reading-time" value="<?php echo $problem['min_reading_time']; ?>">
    <input type="hidden" id="require-all-conditions" value="<?php echo $problem['require_all_conditions']; ?>">
    <input type="hidden" id="total-conditions" value="<?php echo count($conditions); ?>">

    <script src="../assets/js/student.js"></script>
</body>
</html>
