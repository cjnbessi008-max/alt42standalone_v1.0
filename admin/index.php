<?php
/**
 * Teacher Admin Panel
 * Problem and condition management interface
 */

require_once __DIR__ . '/../config/database.php';
session_start();

// For demo purposes, we'll use URL parameters
// In production, use proper authentication
$teacherId = isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : 1;

$db = getDB();

// Get teacher info
$teacher = $db->fetchOne(
    "SELECT * FROM teachers WHERE id = ?",
    [$teacherId]
);

if (!$teacher) {
    die("Teacher not found");
}

// Get all problems for this teacher
$problems = $db->fetchAll(
    "SELECT p.*,
     COUNT(DISTINCT sp.student_id) as student_count,
     AVG(sp.total_reading_time) as avg_reading_time
     FROM problems p
     LEFT JOIN student_progress sp ON p.id = sp.problem_id
     WHERE p.teacher_id = ?
     GROUP BY p.id
     ORDER BY p.created_at DESC",
    [$teacherId]
);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Admin - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1><?php echo APP_NAME; ?> - 교사 관리</h1>
                <div class="teacher-info">
                    <span class="teacher-name"><?php echo htmlspecialchars($teacher['name']); ?></span>
                    <span class="teacher-email"><?php echo htmlspecialchars($teacher['email']); ?></span>
                </div>
            </div>
        </header>

        <main class="main-content">
            <div class="toolbar">
                <h2>문제 관리</h2>
                <button id="create-problem-btn" class="btn btn-primary">
                    ➕ 새 문제 만들기
                </button>
            </div>

            <div class="problems-grid">
                <?php if (empty($problems)): ?>
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>아직 문제가 없습니다</h3>
                        <p>새 문제 만들기 버튼을 클릭하여 첫 문제를 만들어보세요.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($problems as $problem): ?>
                        <div class="problem-card" data-problem-id="<?php echo $problem['id']; ?>">
                            <div class="problem-card-header">
                                <h3><?php echo htmlspecialchars($problem['title']); ?></h3>
                                <div class="problem-status <?php echo $problem['is_active'] ? 'active' : 'inactive'; ?>">
                                    <?php echo $problem['is_active'] ? '활성' : '비활성'; ?>
                                </div>
                            </div>

                            <div class="problem-card-body">
                                <?php if ($problem['description']): ?>
                                    <p class="problem-description">
                                        <?php echo htmlspecialchars(substr($problem['description'], 0, 100)); ?>
                                        <?php echo strlen($problem['description']) > 100 ? '...' : ''; ?>
                                    </p>
                                <?php endif; ?>

                                <div class="problem-meta">
                                    <span class="badge"><?php echo htmlspecialchars($problem['subject']); ?></span>
                                    <span class="badge difficulty-<?php echo $problem['difficulty_level']; ?>">
                                        <?php echo htmlspecialchars($problem['difficulty_level']); ?>
                                    </span>
                                    <?php if ($problem['grade_level']): ?>
                                        <span class="badge">학년: <?php echo htmlspecialchars($problem['grade_level']); ?></span>
                                    <?php endif; ?>
                                </div>

                                <div class="problem-stats">
                                    <div class="stat">
                                        <span class="stat-label">학생 수</span>
                                        <span class="stat-value"><?php echo $problem['student_count'] ?? 0; ?></span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">평균 읽기 시간</span>
                                        <span class="stat-value">
                                            <?php
                                            $avgTime = $problem['avg_reading_time'] ?? 0;
                                            echo gmdate("i:s", $avgTime);
                                            ?>
                                        </span>
                                    </div>
                                    <div class="stat">
                                        <span class="stat-label">최소 읽기 시간</span>
                                        <span class="stat-value"><?php echo $problem['min_reading_time']; ?>초</span>
                                    </div>
                                </div>
                            </div>

                            <div class="problem-card-footer">
                                <button class="btn btn-sm btn-view" onclick="viewProblem(<?php echo $problem['id']; ?>)">
                                    👁️ 보기
                                </button>
                                <button class="btn btn-sm btn-edit" onclick="editProblem(<?php echo $problem['id']; ?>)">
                                    ✏️ 편집
                                </button>
                                <button class="btn btn-sm btn-analytics" onclick="viewAnalytics(<?php echo $problem['id']; ?>)">
                                    📊 분석
                                </button>
                                <button class="btn btn-sm btn-delete" onclick="deleteProblem(<?php echo $problem['id']; ?>)">
                                    🗑️ 삭제
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </main>
    </div>

    <!-- Create/Edit Problem Modal -->
    <div id="problem-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modal-title">새 문제 만들기</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>

            <form id="problem-form">
                <input type="hidden" id="problem-id" name="problem_id">
                <input type="hidden" name="teacher_id" value="<?php echo $teacherId; ?>">

                <div class="form-group">
                    <label for="title">제목 *</label>
                    <input type="text" id="title" name="title" required placeholder="예: 분수의 덧셈">
                </div>

                <div class="form-group">
                    <label for="description">설명</label>
                    <textarea id="description" name="description" rows="3" placeholder="문제에 대한 간단한 설명"></textarea>
                </div>

                <div class="form-group">
                    <label for="problem-text">문제 내용 *</label>
                    <textarea id="problem-text" name="problem_text" rows="8" required
                              placeholder="문제 내용을 입력하세요..."></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="subject">과목</label>
                        <select id="subject" name="subject">
                            <option value="mathematics">수학</option>
                            <option value="science">과학</option>
                            <option value="language">언어</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="difficulty-level">난이도</label>
                        <select id="difficulty-level" name="difficulty_level">
                            <option value="easy">쉬움</option>
                            <option value="medium" selected>보통</option>
                            <option value="hard">어려움</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="grade-level">학년</label>
                        <input type="text" id="grade-level" name="grade_level" placeholder="예: 3">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="min-reading-time">최소 읽기 시간 (초)</label>
                        <input type="number" id="min-reading-time" name="min_reading_time" value="30" min="1">
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="require-all-conditions" name="require_all_conditions" checked value="1">
                            모든 조건 확인 필수
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>조건 목록</label>
                    <div id="conditions-container">
                        <!-- Conditions will be added here dynamically -->
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="addCondition()">
                        ➕ 조건 추가
                    </button>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">취소</button>
                    <button type="submit" class="btn btn-primary">저장</button>
                </div>
            </form>
        </div>
    </div>

    <input type="hidden" id="teacher-id" value="<?php echo $teacherId; ?>">

    <script src="../assets/js/admin.js"></script>
</body>
</html>
