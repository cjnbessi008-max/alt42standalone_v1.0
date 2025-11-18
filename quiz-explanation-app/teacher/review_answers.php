<?php
/**
 * Teacher - Review Student Answers
 * Allows teachers to review student explanations and provide feedback
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('teacher');

$db = Database::getInstance();
$user = getCurrentUser();

// Handle feedback submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_feedback'])) {
    try {
        if (!validateCsrfToken($_POST['csrf_token'])) {
            throw new Exception('Invalid CSRF token');
        }

        $answerId = intval($_POST['answer_id']);
        $teacherFeedback = sanitize($_POST['teacher_feedback']);
        $manualExplanationScore = isset($_POST['manual_explanation_score']) ? floatval($_POST['manual_explanation_score']) : null;

        // Get the answer
        $answer = $db->queryOne(
            'SELECT sa.*, q.points, q.explanation_weight
             FROM student_answers sa
             JOIN questions q ON sa.question_id = q.id
             WHERE sa.id = ?',
            [$answerId]
        );

        if (!$answer) {
            throw new Exception('Answer not found');
        }

        // Calculate new total score if manual score provided
        $newTotalScore = $answer['total_score'];
        if ($manualExplanationScore !== null) {
            $answerScore = floatval($answer['answer_score']);
            $newTotalScore = $answerScore + $manualExplanationScore;
        }

        // Update answer with feedback
        $db->execute(
            'UPDATE student_answers SET teacher_feedback = ?, teacher_id = ?, teacher_reviewed = 1, explanation_score = COALESCE(?, explanation_score), total_score = ? WHERE id = ?',
            [$teacherFeedback, $user['id'], $manualExplanationScore, $newTotalScore, $answerId]
        );

        $_SESSION['success_message'] = 'Feedback saved successfully!';
        header('Location: review_answers.php?quiz_id=' . ($_GET['quiz_id'] ?? ''));
        exit;

    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
    }
}

// Get quiz list
$quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
$quizzes = $db->query(
    'SELECT q.*, COUNT(DISTINCT qa.id) as attempt_count
     FROM quizzes q
     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
     WHERE q.teacher_id = ?
     GROUP BY q.id
     ORDER BY q.created_at DESC',
    [$user['id']]
);

// Get student answers
$answers = [];
if ($quizId) {
    $answers = $db->query(
        'SELECT
            sa.*,
            u.full_name as student_name,
            u.email as student_email,
            q.question_text,
            q.points as question_points,
            q.explanation_weight,
            q.model_explanation,
            qo.option_text as selected_option,
            qo.is_correct,
            qa.completed_at,
            qa.attempt_number
         FROM student_answers sa
         JOIN quiz_attempts qa ON sa.attempt_id = qa.id
         JOIN users u ON qa.student_id = u.id
         JOIN questions q ON sa.question_id = q.id
         LEFT JOIN question_options qo ON sa.selected_option_id = qo.id
         WHERE q.quiz_id = ?
         ORDER BY qa.completed_at DESC, u.full_name, sa.id',
        [$quizId]
    );

    // Get keywords for each answer
    foreach ($answers as &$answer) {
        $answer['evaluation_details'] = $db->query(
            'SELECT ee.*, ek.keyword, ek.keyword_type
             FROM explanation_evaluations ee
             JOIN explanation_keywords ek ON ee.keyword_id = ek.id
             WHERE ee.answer_id = ?',
            [$answer['id']]
        );
    }
}

$title = 'Review Student Answers';
require_once __DIR__ . '/../templates/header.php';
?>

<div id="alert-container">
    <?php if (isset($_SESSION['success_message'])): ?>
        <div class="alert alert-success alert-dismissible fade show">
            <?php echo $_SESSION['success_message']; unset($_SESSION['success_message']); ?>
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    <?php endif; ?>

    <?php if (isset($errorMessage)): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <?php echo htmlspecialchars($errorMessage); ?>
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    <?php endif; ?>
</div>

<div class="row mb-4">
    <div class="col-12">
        <h2><i class="fas fa-clipboard-check"></i> Review Student Answers</h2>
    </div>
</div>

<!-- Quiz Selection -->
<div class="row mb-4">
    <div class="col-md-6">
        <div class="card">
            <div class="card-body">
                <label for="quiz_select"><strong>Select Quiz:</strong></label>
                <select id="quiz_select" class="form-control" onchange="window.location.href='review_answers.php?quiz_id='+this.value">
                    <option value="">-- Select Quiz --</option>
                    <?php foreach ($quizzes as $quiz): ?>
                        <option value="<?php echo $quiz['id']; ?>" <?php echo $quizId == $quiz['id'] ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($quiz['title']); ?> (<?php echo $quiz['attempt_count']; ?> attempts)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
    </div>

    <?php if ($quizId): ?>
        <div class="col-md-6">
            <div class="card bg-light">
                <div class="card-body">
                    <div class="row text-center">
                        <div class="col-6">
                            <div class="stat-number"><?php echo count(array_unique(array_column($answers, 'attempt_id'))); ?></div>
                            <div class="stat-label">Total Attempts</div>
                        </div>
                        <div class="col-6">
                            <div class="stat-number"><?php echo count(array_filter($answers, function($a) { return $a['teacher_reviewed'] == 1; })); ?></div>
                            <div class="stat-label">Reviewed</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<!-- Student Answers -->
<?php if ($quizId && !empty($answers)): ?>
    <div class="row">
        <div class="col-12">
            <?php
            $currentStudent = null;
            foreach ($answers as $answer):
                $studentKey = $answer['student_name'] . '_' . $answer['attempt_number'];
                if ($currentStudent !== $studentKey):
                    if ($currentStudent !== null) echo '</div></div>';
                    $currentStudent = $studentKey;
            ?>
                <div class="card mb-4">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-user"></i> <?php echo htmlspecialchars($answer['student_name']); ?>
                            <span class="badge badge-light ml-2">Attempt #<?php echo $answer['attempt_number']; ?></span>
                            <small class="float-right"><?php echo formatDate($answer['completed_at'], 'M d, Y H:i'); ?></small>
                        </h5>
                    </div>
                    <div class="card-body">
            <?php endif; ?>

                        <!-- Answer Item -->
                        <div class="answer-review mb-4 pb-4 border-bottom <?php echo $answer['is_correct'] ? 'correct' : 'incorrect'; ?>">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6 class="font-weight-bold">
                                        <?php echo htmlspecialchars($answer['question_text']); ?>
                                    </h6>

                                    <div class="mb-3">
                                        <strong>Student's Answer:</strong>
                                        <span class="badge badge-<?php echo $answer['is_correct'] ? 'success' : 'danger'; ?>">
                                            <?php echo htmlspecialchars($answer['selected_option']); ?>
                                            <?php echo $answer['is_correct'] ? '✓' : '✗'; ?>
                                        </span>
                                    </div>

                                    <div class="mb-3">
                                        <strong>Student's Explanation:</strong>
                                        <div class="p-3 bg-light rounded">
                                            <?php echo nl2br(htmlspecialchars($answer['explanation_text'])); ?>
                                        </div>
                                    </div>

                                    <?php if (!empty($answer['model_explanation'])): ?>
                                        <div class="mb-3">
                                            <strong>Model Explanation:</strong>
                                            <div class="p-3 bg-white border rounded">
                                                <?php echo nl2br(htmlspecialchars($answer['model_explanation'])); ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    <!-- Auto-Evaluation Details -->
                                    <?php if ($answer['auto_evaluated'] && !empty($answer['evaluation_details'])): ?>
                                        <div class="mb-3">
                                            <strong>Auto-Evaluation Results:</strong>
                                            <div class="mt-2">
                                                <?php foreach ($answer['evaluation_details'] as $detail): ?>
                                                    <span class="badge badge-<?php echo $detail['found'] ? 'success' : 'secondary'; ?> mr-1 mb-1">
                                                        <?php echo htmlspecialchars($detail['keyword']); ?>
                                                        <?php if ($detail['found']): ?>
                                                            ✓ (<?php echo $detail['keyword_type']; ?>)
                                                        <?php else: ?>
                                                            ✗
                                                        <?php endif; ?>
                                                    </span>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    <!-- Teacher Feedback Form -->
                                    <div class="mt-3">
                                        <button class="btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#feedback-<?php echo $answer['id']; ?>">
                                            <i class="fas fa-comment"></i> <?php echo $answer['teacher_reviewed'] ? 'Edit Feedback' : 'Add Feedback'; ?>
                                        </button>

                                        <div class="collapse mt-3 <?php echo $answer['teacher_reviewed'] ? 'show' : ''; ?>" id="feedback-<?php echo $answer['id']; ?>">
                                            <form method="POST" action="">
                                                <input type="hidden" name="csrf_token" value="<?php echo generateCsrfToken(); ?>">
                                                <input type="hidden" name="answer_id" value="<?php echo $answer['id']; ?>">
                                                <input type="hidden" name="submit_feedback" value="1">

                                                <div class="form-group">
                                                    <label><strong>Manual Explanation Score (optional):</strong></label>
                                                    <input type="number" name="manual_explanation_score" class="form-control" step="0.1" min="0" max="<?php echo $answer['question_points'] * $answer['explanation_weight']; ?>" value="<?php echo $answer['explanation_score']; ?>" placeholder="Override auto score">
                                                    <small class="text-muted">Max: <?php echo number_format($answer['question_points'] * $answer['explanation_weight'], 2); ?> points</small>
                                                </div>

                                                <div class="form-group">
                                                    <label><strong>Teacher Feedback:</strong></label>
                                                    <textarea name="teacher_feedback" class="form-control" rows="3" placeholder="Provide feedback to the student..."><?php echo htmlspecialchars($answer['teacher_feedback'] ?? ''); ?></textarea>
                                                </div>

                                                <button type="submit" class="btn btn-success btn-sm">
                                                    <i class="fas fa-save"></i> Save Feedback
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <?php if ($answer['teacher_reviewed'] && $answer['teacher_feedback']): ?>
                                        <div class="alert alert-info mt-3 mb-0">
                                            <strong><i class="fas fa-comment-dots"></i> Teacher Feedback:</strong><br>
                                            <?php echo nl2br(htmlspecialchars($answer['teacher_feedback'])); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <div class="col-md-4">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h6 class="font-weight-bold">Scores</h6>

                                            <div class="mb-2">
                                                <small class="text-muted">Answer Score:</small><br>
                                                <strong class="text-<?php echo $answer['is_correct'] ? 'success' : 'danger'; ?>">
                                                    <?php echo number_format($answer['answer_score'], 2); ?> / <?php echo number_format($answer['question_points'] * (1 - $answer['explanation_weight']), 2); ?>
                                                </strong>
                                            </div>

                                            <div class="mb-2">
                                                <small class="text-muted">Explanation Score:</small><br>
                                                <strong class="text-primary">
                                                    <?php echo number_format($answer['explanation_score'], 2); ?> / <?php echo number_format($answer['question_points'] * $answer['explanation_weight'], 2); ?>
                                                </strong>
                                            </div>

                                            <hr>

                                            <div>
                                                <small class="text-muted">Total Score:</small><br>
                                                <h4 class="mb-0 text-info">
                                                    <?php echo number_format($answer['total_score'], 2); ?> / <?php echo number_format($answer['question_points'], 2); ?>
                                                </h4>
                                            </div>

                                            <hr>

                                            <div class="text-center">
                                                <?php if ($answer['teacher_reviewed']): ?>
                                                    <span class="badge badge-success">
                                                        <i class="fas fa-check-circle"></i> Reviewed
                                                    </span>
                                                <?php else: ?>
                                                    <span class="badge badge-warning">
                                                        <i class="fas fa-clock"></i> Pending Review
                                                    </span>
                                                <?php endif; ?>

                                                <?php if ($answer['auto_evaluated']): ?>
                                                    <br>
                                                    <span class="badge badge-info mt-1">
                                                        <i class="fas fa-robot"></i> Auto-Evaluated
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

            <?php endforeach; ?>
            <?php if ($currentStudent !== null): ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
<?php elseif ($quizId): ?>
    <div class="alert alert-info">
        <i class="fas fa-info-circle"></i> No student attempts found for this quiz yet.
    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
