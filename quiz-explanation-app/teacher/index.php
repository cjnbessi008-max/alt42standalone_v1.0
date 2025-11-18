<?php
/**
 * Teacher Dashboard
 * Shows quiz management and statistics
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('teacher');

$db = Database::getInstance();
$user = getCurrentUser();

// Get teacher's quizzes with statistics
$quizzes = $db->query(
    'SELECT q.*,
     COUNT(DISTINCT ques.id) as question_count,
     COUNT(DISTINCT qa.id) as attempt_count,
     AVG(qa.total_score) as avg_score
     FROM quizzes q
     LEFT JOIN questions ques ON q.id = ques.quiz_id
     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.completed_at IS NOT NULL
     WHERE q.teacher_id = ?
     GROUP BY q.id
     ORDER BY q.created_at DESC',
    [$user['id']]
);

// Get pending reviews count
$pendingReviews = $db->queryOne(
    'SELECT COUNT(*) as count
     FROM student_answers sa
     JOIN quiz_attempts qa ON sa.attempt_id = qa.id
     JOIN questions q ON sa.question_id = q.id
     JOIN quizzes quiz ON q.quiz_id = quiz.id
     WHERE quiz.teacher_id = ? AND sa.teacher_reviewed = 0',
    [$user['id']]
);

$title = 'Teacher Dashboard';
require_once __DIR__ . '/../templates/header.php';
?>

<div class="row mb-4">
    <div class="col-12">
        <h2><i class="fas fa-chalkboard-teacher"></i> Teacher Dashboard</h2>
        <p class="text-muted">Welcome, <?php echo htmlspecialchars($user['full_name']); ?>!</p>
    </div>
</div>

<!-- Statistics -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card bg-primary text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo count($quizzes); ?></div>
                <div class="stat-label">Total Quizzes</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-success text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo count(array_filter($quizzes, function($q) { return $q['status'] == 'active'; })); ?></div>
                <div class="stat-label">Active Quizzes</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-info text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo array_sum(array_column($quizzes, 'attempt_count')); ?></div>
                <div class="stat-label">Total Attempts</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-warning text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo $pendingReviews['count']; ?></div>
                <div class="stat-label">Pending Reviews</div>
            </div>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-bolt"></i> Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-2">
                        <a href="create_question.php" class="btn btn-primary btn-block btn-lg">
                            <i class="fas fa-plus-circle"></i> Create Question
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <a href="review_answers.php" class="btn btn-warning btn-block btn-lg">
                            <i class="fas fa-clipboard-check"></i> Review Answers
                            <?php if ($pendingReviews['count'] > 0): ?>
                                <span class="badge badge-light"><?php echo $pendingReviews['count']; ?></span>
                            <?php endif; ?>
                        </a>
                    </div>
                    <div class="col-md-4 mb-2">
                        <a href="manage_quiz.php" class="btn btn-success btn-block btn-lg">
                            <i class="fas fa-cog"></i> Manage Quizzes
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- My Quizzes -->
<div class="row">
    <div class="col-12">
        <h4 class="mb-3"><i class="fas fa-list"></i> My Quizzes</h4>

        <?php if (empty($quizzes)): ?>
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> You haven't created any quizzes yet.
                <a href="manage_quiz.php" class="alert-link">Create your first quiz</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th>Quiz Title</th>
                            <th>Status</th>
                            <th>Questions</th>
                            <th>Attempts</th>
                            <th>Avg Score</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($quizzes as $quiz): ?>
                            <tr>
                                <td>
                                    <strong><?php echo htmlspecialchars($quiz['title']); ?></strong>
                                    <?php if ($quiz['description']): ?>
                                        <br><small class="text-muted"><?php echo htmlspecialchars(substr($quiz['description'], 0, 50)) . (strlen($quiz['description']) > 50 ? '...' : ''); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php
                                    $statusColors = ['draft' => 'secondary', 'active' => 'success', 'archived' => 'dark'];
                                    $statusColor = $statusColors[$quiz['status']] ?? 'secondary';
                                    ?>
                                    <span class="badge badge-<?php echo $statusColor; ?>">
                                        <?php echo ucfirst($quiz['status']); ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge badge-info"><?php echo $quiz['question_count']; ?></span>
                                </td>
                                <td><?php echo $quiz['attempt_count']; ?></td>
                                <td>
                                    <?php if ($quiz['avg_score'] !== null): ?>
                                        <strong class="text-<?php echo $quiz['avg_score'] >= $quiz['passing_score'] ? 'success' : 'warning'; ?>">
                                            <?php echo number_format($quiz['avg_score'], 1); ?>%
                                        </strong>
                                    <?php else: ?>
                                        <span class="text-muted">N/A</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <small><?php echo formatDate($quiz['created_at'], 'M d, Y'); ?></small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <a href="create_question.php?quiz_id=<?php echo $quiz['id']; ?>" class="btn btn-primary" title="Add Question">
                                            <i class="fas fa-plus"></i>
                                        </a>
                                        <a href="review_answers.php?quiz_id=<?php echo $quiz['id']; ?>" class="btn btn-warning" title="Review Answers">
                                            <i class="fas fa-clipboard-check"></i>
                                        </a>
                                        <a href="manage_quiz.php?edit=<?php echo $quiz['id']; ?>" class="btn btn-info" title="Edit Quiz">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
