<?php
/**
 * Student Dashboard
 * Shows available quizzes and student's quiz history
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('student');

$db = Database::getInstance();
$user = getCurrentUser();

// Get available quizzes
$availableQuizzes = $db->query(
    'SELECT q.*, u.full_name as teacher_name,
     COUNT(DISTINCT ques.id) as question_count
     FROM quizzes q
     JOIN users u ON q.teacher_id = u.id
     LEFT JOIN questions ques ON q.id = ques.quiz_id
     WHERE q.status = "active"
     GROUP BY q.id
     ORDER BY q.created_at DESC'
);

// Get student's quiz attempts
$myAttempts = $db->query(
    'SELECT qa.*, q.title as quiz_title, q.passing_score
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.student_id = ?
     ORDER BY qa.completed_at DESC
     LIMIT 10',
    [$user['id']]
);

$title = 'My Quizzes';
require_once __DIR__ . '/../templates/header.php';
?>

<div class="row mb-4">
    <div class="col-12">
        <h2><i class="fas fa-book-reader"></i> Welcome, <?php echo htmlspecialchars($user['full_name']); ?>!</h2>
        <p class="text-muted">Select a quiz to get started</p>
    </div>
</div>

<!-- Statistics -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card bg-primary text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo count($myAttempts); ?></div>
                <div class="stat-label">Quizzes Taken</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-success text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo count(array_filter($myAttempts, function($a) { return $a['passing']; })); ?></div>
                <div class="stat-label">Passed</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-info text-white">
            <div class="card-body stat-card">
                <div class="stat-number">
                    <?php
                    $avgScore = 0;
                    if (count($myAttempts) > 0) {
                        $avgScore = array_sum(array_column($myAttempts, 'total_score')) / count($myAttempts);
                    }
                    echo number_format($avgScore, 1);
                    ?>%
                </div>
                <div class="stat-label">Average Score</div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-warning text-white">
            <div class="card-body stat-card">
                <div class="stat-number"><?php echo count($availableQuizzes); ?></div>
                <div class="stat-label">Available Quizzes</div>
            </div>
        </div>
    </div>
</div>

<!-- Available Quizzes -->
<div class="row mb-4">
    <div class="col-12">
        <h4 class="mb-3"><i class="fas fa-list"></i> Available Quizzes</h4>

        <?php if (empty($availableQuizzes)): ?>
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No quizzes available at the moment. Check back later!
            </div>
        <?php else: ?>
            <div class="row">
                <?php foreach ($availableQuizzes as $quiz): ?>
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0"><?php echo htmlspecialchars($quiz['title']); ?></h5>
                            </div>
                            <div class="card-body">
                                <?php if ($quiz['description']): ?>
                                    <p class="text-muted"><?php echo htmlspecialchars(substr($quiz['description'], 0, 100)) . (strlen($quiz['description']) > 100 ? '...' : ''); ?></p>
                                <?php endif; ?>

                                <ul class="list-unstyled">
                                    <li><i class="fas fa-user text-primary"></i> <strong>Teacher:</strong> <?php echo htmlspecialchars($quiz['teacher_name']); ?></li>
                                    <li><i class="fas fa-question-circle text-info"></i> <strong>Questions:</strong> <?php echo $quiz['question_count']; ?></li>
                                    <?php if ($quiz['time_limit']): ?>
                                        <li><i class="fas fa-clock text-warning"></i> <strong>Time:</strong> <?php echo $quiz['time_limit']; ?> minutes</li>
                                    <?php endif; ?>
                                    <li><i class="fas fa-check-circle text-success"></i> <strong>Passing:</strong> <?php echo $quiz['passing_score']; ?>%</li>
                                </ul>
                            </div>
                            <div class="card-footer">
                                <a href="take_quiz.php?quiz_id=<?php echo $quiz['id']; ?>" class="btn btn-primary btn-block">
                                    <i class="fas fa-play"></i> Start Quiz
                                </a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Recent Attempts -->
<?php if (!empty($myAttempts)): ?>
    <div class="row">
        <div class="col-12">
            <h4 class="mb-3"><i class="fas fa-history"></i> Recent Quiz Attempts</h4>

            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th>Quiz</th>
                            <th>Attempt</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Completed</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($myAttempts as $attempt): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($attempt['quiz_title']); ?></td>
                                <td>#<?php echo $attempt['attempt_number']; ?></td>
                                <td>
                                    <strong class="text-<?php echo $attempt['passing'] ? 'success' : 'danger'; ?>">
                                        <?php echo number_format($attempt['total_score'], 1); ?>%
                                    </strong>
                                </td>
                                <td>
                                    <?php if ($attempt['passing']): ?>
                                        <span class="badge badge-success"><i class="fas fa-check"></i> Passed</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger"><i class="fas fa-times"></i> Failed</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo formatDate($attempt['completed_at'], 'M d, Y H:i'); ?></td>
                                <td>
                                    <a href="view_results.php?attempt_id=<?php echo $attempt['id']; ?>" class="btn btn-sm btn-info">
                                        <i class="fas fa-eye"></i> View Results
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
