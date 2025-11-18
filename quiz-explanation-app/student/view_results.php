<?php
/**
 * Student - View Quiz Results
 * Shows detailed results including scores and feedback
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('student');

$db = Database::getInstance();
$user = getCurrentUser();

$attemptId = isset($_GET['attempt_id']) ? intval($_GET['attempt_id']) : 0;

if (!$attemptId) {
    header('Location: index.php');
    exit;
}

// Get attempt details
$attempt = $db->queryOne(
    'SELECT qa.*, q.title as quiz_title, q.passing_score, q.show_feedback
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.id = ? AND qa.student_id = ?',
    [$attemptId, $user['id']]
);

if (!$attempt) {
    die('Quiz attempt not found or access denied.');
}

// Get all answers for this attempt
$answers = $db->query(
    'SELECT
        sa.*,
        q.question_text,
        q.points as question_points,
        q.explanation_weight,
        q.model_explanation,
        qo.option_text as selected_option,
        qo.is_correct,
        correct_opt.option_text as correct_option
     FROM student_answers sa
     JOIN questions q ON sa.question_id = q.id
     LEFT JOIN question_options qo ON sa.selected_option_id = qo.id
     LEFT JOIN question_options correct_opt ON q.id = correct_opt.question_id AND correct_opt.is_correct = 1
     WHERE sa.attempt_id = ?
     ORDER BY sa.id',
    [$attemptId]
);

// Get evaluation details for each answer
foreach ($answers as &$answer) {
    $answer['evaluation_details'] = $db->query(
        'SELECT ee.*, ek.keyword, ek.keyword_type, ek.description
         FROM explanation_evaluations ee
         JOIN explanation_keywords ek ON ee.keyword_id = ek.id
         WHERE ee.answer_id = ?',
        [$answer['id']]
    );
}

$title = 'Quiz Results - ' . htmlspecialchars($attempt['quiz_title']);
require_once __DIR__ . '/../templates/header.php';
?>

<!-- Results Header -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header bg-<?php echo $attempt['passing'] ? 'success' : 'danger'; ?> text-white">
                <h3 class="mb-0">
                    <i class="fas fa-poll"></i> Quiz Results: <?php echo htmlspecialchars($attempt['quiz_title']); ?>
                </h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 text-center">
                        <div class="score-circle score-<?php echo $attempt['passing'] ? 'pass' : 'fail'; ?>">
                            <?php echo number_format($attempt['total_score'], 1); ?>%
                        </div>
                        <h5 class="mt-3">
                            <?php if ($attempt['passing']): ?>
                                <i class="fas fa-check-circle text-success"></i> Passed!
                            <?php else: ?>
                                <i class="fas fa-times-circle text-danger"></i> Not Passed
                            <?php endif; ?>
                        </h5>
                        <p class="text-muted">Passing Score: <?php echo $attempt['passing_score']; ?>%</p>
                    </div>

                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-number"><?php echo count($answers); ?></div>
                                    <div class="stat-label">Total Questions</div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-number text-success"><?php echo count(array_filter($answers, function($a) { return $a['is_correct']; })); ?></div>
                                    <div class="stat-label">Correct Answers</div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-number text-info">
                                        <?php
                                        $avgExplanationScore = 0;
                                        if (count($answers) > 0) {
                                            $totalExplanation = array_sum(array_map(function($a) {
                                                return ($a['explanation_score'] / ($a['question_points'] * $a['explanation_weight'])) * 100;
                                            }, $answers));
                                            $avgExplanationScore = $totalExplanation / count($answers);
                                        }
                                        echo number_format($avgExplanationScore, 1);
                                        ?>%
                                    </div>
                                    <div class="stat-label">Avg Explanation Score</div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-number text-warning"><?php echo gmdate('i:s', $attempt['time_spent']); ?></div>
                                    <div class="stat-label">Time Spent</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="text-muted">
                    <i class="fas fa-calendar"></i> Completed: <?php echo formatDate($attempt['completed_at'], 'M d, Y H:i'); ?>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <i class="fas fa-redo"></i> Attempt #<?php echo $attempt['attempt_number']; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Detailed Results -->
<div class="row">
    <div class="col-12">
        <h4 class="mb-3">Detailed Results</h4>

        <?php foreach ($answers as $index => $answer): ?>
            <div class="card mb-3 answer-review <?php echo $answer['is_correct'] ? 'correct' : 'incorrect'; ?>">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="mb-0">
                                Question <?php echo $index + 1; ?>
                                <?php if ($answer['is_correct']): ?>
                                    <span class="badge badge-success"><i class="fas fa-check"></i> Correct</span>
                                <?php else: ?>
                                    <span class="badge badge-danger"><i class="fas fa-times"></i> Incorrect</span>
                                <?php endif; ?>
                            </h5>
                        </div>
                        <div class="col-md-4 text-right">
                            <strong>Score: <?php echo number_format($answer['total_score'], 2); ?> / <?php echo number_format($answer['question_points'], 2); ?></strong>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <!-- Question Text -->
                    <p class="font-weight-bold"><?php echo nl2br(htmlspecialchars($answer['question_text'])); ?></p>

                    <!-- Your Answer -->
                    <div class="mb-3">
                        <strong>Your Answer:</strong>
                        <div class="p-2 border rounded bg-light">
                            <?php echo htmlspecialchars($answer['selected_option']); ?>
                            <?php if ($answer['is_correct']): ?>
                                <span class="text-success"><i class="fas fa-check-circle"></i></span>
                            <?php else: ?>
                                <span class="text-danger"><i class="fas fa-times-circle"></i></span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <?php if (!$answer['is_correct']): ?>
                        <div class="mb-3">
                            <strong>Correct Answer:</strong>
                            <div class="p-2 border rounded bg-success text-white">
                                <?php echo htmlspecialchars($answer['correct_option']); ?>
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Your Explanation -->
                    <div class="mb-3">
                        <strong>Your Explanation:</strong>
                        <div class="p-3 border rounded bg-white">
                            <?php echo nl2br(htmlspecialchars($answer['explanation_text'])); ?>
                        </div>
                    </div>

                    <!-- Score Breakdown -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <small class="text-muted">Answer Score:</small><br>
                                    <strong class="text-<?php echo $answer['is_correct'] ? 'success' : 'danger'; ?>">
                                        <?php echo number_format($answer['answer_score'], 2); ?> / <?php echo number_format($answer['question_points'] * (1 - $answer['explanation_weight']), 2); ?>
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <small class="text-muted">Explanation Score:</small><br>
                                    <strong class="text-primary">
                                        <?php echo number_format($answer['explanation_score'], 2); ?> / <?php echo number_format($answer['question_points'] * $answer['explanation_weight'], 2); ?>
                                        (<?php echo number_format(($answer['explanation_score'] / ($answer['question_points'] * $answer['explanation_weight'])) * 100, 1); ?>%)
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Evaluation Details -->
                    <?php if ($attempt['show_feedback'] && !empty($answer['evaluation_details'])): ?>
                        <div class="mb-3">
                            <strong>Explanation Evaluation:</strong>
                            <div class="mt-2">
                                <?php foreach ($answer['evaluation_details'] as $detail): ?>
                                    <div class="badge badge-<?php echo $detail['found'] ? 'success' : 'secondary'; ?> mr-1 mb-1">
                                        <?php echo htmlspecialchars($detail['keyword']); ?>
                                        <?php if ($detail['found']): ?>
                                            <i class="fas fa-check"></i>
                                        <?php else: ?>
                                            <i class="fas fa-times"></i>
                                        <?php endif; ?>
                                        <small>(<?php echo $detail['keyword_type']; ?>)</small>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <small class="text-muted d-block mt-2">
                                <i class="fas fa-info-circle"></i> Keywords found in your explanation are highlighted above
                            </small>
                        </div>
                    <?php endif; ?>

                    <!-- Model Explanation -->
                    <?php if ($attempt['show_feedback'] && !empty($answer['model_explanation'])): ?>
                        <div class="alert alert-info mb-3">
                            <strong><i class="fas fa-lightbulb"></i> Model Explanation:</strong><br>
                            <?php echo nl2br(htmlspecialchars($answer['model_explanation'])); ?>
                        </div>
                    <?php endif; ?>

                    <!-- Teacher Feedback -->
                    <?php if ($answer['teacher_reviewed'] && $answer['teacher_feedback']): ?>
                        <div class="alert alert-warning mb-0">
                            <strong><i class="fas fa-chalkboard-teacher"></i> Teacher Feedback:</strong><br>
                            <?php echo nl2br(htmlspecialchars($answer['teacher_feedback'])); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- Actions -->
<div class="row mt-4">
    <div class="col-12 text-center">
        <a href="index.php" class="btn btn-primary btn-lg">
            <i class="fas fa-arrow-left"></i> Back to Quizzes
        </a>
        <button onclick="window.print()" class="btn btn-secondary btn-lg">
            <i class="fas fa-print"></i> Print Results
        </button>
    </div>
</div>

<style media="print">
    .navbar, footer, .btn { display: none !important; }
    .card { page-break-inside: avoid; }
</style>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
