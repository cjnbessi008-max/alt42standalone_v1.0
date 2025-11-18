<?php
/**
 * Student - Take Quiz Page
 * Allows students to take quizzes and provide explanations for answers
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('student');

$db = Database::getInstance();
$user = getCurrentUser();

$quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : 0;

if (!$quizId) {
    header('Location: index.php');
    exit;
}

// Get quiz details
$quiz = $db->queryOne(
    'SELECT * FROM quizzes WHERE id = ? AND status = "active"',
    [$quizId]
);

if (!$quiz) {
    die('Quiz not found or not available.');
}

// Handle quiz submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!validateCsrfToken($_POST['csrf_token'])) {
            throw new Exception('Invalid CSRF token');
        }

        $answers = $_POST['answers'] ?? [];
        $explanations = $_POST['explanations'] ?? [];
        $timeSpent = isset($_POST['time_spent']) ? intval($_POST['time_spent']) : 0;

        if (empty($answers)) {
            throw new Exception('Please answer at least one question');
        }

        $db->beginTransaction();

        // Get the next attempt number for this student
        $lastAttempt = $db->queryOne(
            'SELECT MAX(attempt_number) as last_attempt FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
            [$quizId, $user['id']]
        );
        $attemptNumber = ($lastAttempt['last_attempt'] ?? 0) + 1;

        // Create quiz attempt
        $attemptResult = $db->execute(
            'INSERT INTO quiz_attempts (quiz_id, student_id, attempt_number, started_at, time_spent) VALUES (?, ?, ?, ?, ?)',
            [$quizId, $user['id'], $attemptNumber, date('Y-m-d H:i:s', strtotime('-' . $timeSpent . ' seconds')), $timeSpent]
        );

        $attemptId = $attemptResult['last_insert_id'];

        // Process each answer
        $totalScore = 0;
        $totalPoints = 0;

        foreach ($answers as $questionId => $selectedOptionId) {
            $questionId = intval($questionId);
            $selectedOptionId = intval($selectedOptionId);
            $explanation = $explanations[$questionId] ?? '';

            // Get question and option details
            $question = $db->queryOne(
                'SELECT * FROM questions WHERE id = ?',
                [$questionId]
            );

            if (!$question) continue;

            $selectedOption = $db->queryOne(
                'SELECT * FROM question_options WHERE id = ?',
                [$selectedOptionId]
            );

            if (!$selectedOption) continue;

            $totalPoints += floatval($question['points']);

            // Calculate answer score
            $answerScore = $selectedOption['is_correct']
                ? floatval($question['points']) * (1 - floatval($question['explanation_weight']))
                : 0;

            // Calculate explanation score using keyword evaluation
            $keywords = $db->query(
                'SELECT * FROM explanation_keywords WHERE question_id = ?',
                [$questionId]
            );

            $evaluation = evaluateExplanation($explanation, $keywords);
            $explanationScore = (floatval($question['points']) * floatval($question['explanation_weight'])) * ($evaluation['score'] / 100);

            // Total score for this question
            $questionTotal = $answerScore + $explanationScore;

            // Insert student answer
            $answerResult = $db->execute(
                'INSERT INTO student_answers (attempt_id, question_id, selected_option_id, explanation_text, answer_score, explanation_score, total_score, auto_evaluated, answered_at, evaluated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
                [$attemptId, $questionId, $selectedOptionId, $explanation, $answerScore, $explanationScore, $questionTotal, date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]
            );

            $answerId = $answerResult['last_insert_id'];

            // Insert evaluation details
            foreach ($evaluation['details'] as $detail) {
                $db->execute(
                    'INSERT INTO explanation_evaluations (answer_id, keyword_id, found, match_context, score_contribution) VALUES (?, ?, ?, ?, ?)',
                    [$answerId, $detail['keyword_id'], $detail['found'] ? 1 : 0, $detail['match_context'], $detail['weight']]
                );
            }

            $totalScore += $questionTotal;
        }

        // Calculate final score percentage
        $scorePercentage = $totalPoints > 0 ? ($totalScore / $totalPoints) * 100 : 0;
        $passing = $scorePercentage >= floatval($quiz['passing_score']);

        // Update quiz attempt
        $db->execute(
            'UPDATE quiz_attempts SET completed_at = ?, total_score = ?, passing = ? WHERE id = ?',
            [date('Y-m-d H:i:s'), $scorePercentage, $passing ? 1 : 0, $attemptId]
        );

        $db->commit();

        // Redirect to results page
        header('Location: view_results.php?attempt_id=' . $attemptId);
        exit;

    } catch (Exception $e) {
        $db->rollback();
        $errorMessage = $e->getMessage();
    }
}

// Get quiz questions with options
$questions = $db->query(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_num, id',
    [$quizId]
);

foreach ($questions as &$question) {
    $question['options'] = $db->query(
        'SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order',
        [$question['id']]
    );
}

$title = 'Take Quiz - ' . htmlspecialchars($quiz['title']);
require_once __DIR__ . '/../templates/header.php';
?>

<div id="alert-container">
    <?php if (isset($errorMessage)): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <?php echo htmlspecialchars($errorMessage); ?>
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    <?php endif; ?>
</div>

<!-- Timer (if quiz has time limit) -->
<?php if ($quiz['time_limit']): ?>
    <div class="quiz-timer">
        <div class="text-center">
            <i class="fas fa-clock"></i> <strong>Time Remaining:</strong><br>
            <span id="timer-display" class="h4">--:--</span>
        </div>
    </div>
<?php endif; ?>

<!-- Quiz Header -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0">
                    <i class="fas fa-clipboard-question"></i> <?php echo htmlspecialchars($quiz['title']); ?>
                </h3>
            </div>
            <div class="card-body">
                <?php if ($quiz['description']): ?>
                    <p><?php echo nl2br(htmlspecialchars($quiz['description'])); ?></p>
                <?php endif; ?>

                <div class="row text-center">
                    <div class="col-md-4">
                        <i class="fas fa-list-ol text-primary"></i>
                        <strong><?php echo count($questions); ?></strong> Questions
                    </div>
                    <?php if ($quiz['time_limit']): ?>
                        <div class="col-md-4">
                            <i class="fas fa-clock text-warning"></i>
                            <strong><?php echo $quiz['time_limit']; ?></strong> Minutes
                        </div>
                    <?php endif; ?>
                    <div class="col-md-4">
                        <i class="fas fa-check-circle text-success"></i>
                        Passing: <strong><?php echo $quiz['passing_score']; ?>%</strong>
                    </div>
                </div>

                <div class="alert alert-info mt-3 mb-0">
                    <strong><i class="fas fa-info-circle"></i> Important:</strong>
                    <ul class="mb-0 mt-2">
                        <li>Select the correct answer for each question</li>
                        <li><strong>Explain why your answer is correct</strong> - explanations are graded!</li>
                        <li>Minimum 20 characters required for each explanation</li>
                        <li>You can only submit once, so review carefully before submitting</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Quiz Form -->
<form method="POST" action="" id="quiz-form" onsubmit="return validateQuizSubmission()">
    <input type="hidden" name="csrf_token" value="<?php echo generateCsrfToken(); ?>">
    <input type="hidden" name="time_spent" id="time_spent" value="0">

    <?php foreach ($questions as $index => $question): ?>
        <div class="question-container" data-question-id="<?php echo $question['id']; ?>">
            <h5>
                <span class="badge badge-primary">Question <?php echo $index + 1; ?></span>
                <span class="badge badge-secondary"><?php echo $question['points']; ?> points</span>
                <span class="badge badge-info"><?php echo ucfirst($question['difficulty_level']); ?></span>
            </h5>

            <p class="question-text"><?php echo nl2br(htmlspecialchars($question['question_text'])); ?></p>

            <!-- Options -->
            <div class="mb-3">
                <?php foreach ($question['options'] as $option): ?>
                    <div class="form-check quiz-option p-3 mb-2 border rounded">
                        <input class="form-check-input" type="radio" name="answers[<?php echo $question['id']; ?>]" value="<?php echo $option['id']; ?>" id="option-<?php echo $option['id']; ?>" required>
                        <label class="form-check-label w-100 cursor-pointer" for="option-<?php echo $option['id']; ?>">
                            <strong><?php echo chr(65 + $option['option_order'] - 1); ?>.</strong>
                            <?php echo htmlspecialchars($option['option_text']); ?>
                        </label>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Explanation -->
            <div class="form-group">
                <label for="explanation-<?php echo $question['id']; ?>">
                    <strong><i class="fas fa-comment-dots"></i> Explain why your answer is correct: <span class="text-danger">*</span></strong>
                </label>
                <textarea class="form-control explanation-textarea" name="explanations[<?php echo $question['id']; ?>]" id="explanation-<?php echo $question['id']; ?>" rows="4" placeholder="Write a detailed explanation of why you chose this answer..." required minlength="20"></textarea>
                <small class="form-text text-muted">
                    <i class="fas fa-info-circle"></i> Your explanation counts for <?php echo intval($question['explanation_weight'] * 100); ?>% of the question score. Be thorough and specific!
                </small>
            </div>
        </div>
    <?php endforeach; ?>

    <!-- Submit Button -->
    <div class="card bg-light">
        <div class="card-body text-center">
            <button type="submit" class="btn btn-success btn-lg">
                <i class="fas fa-paper-plane"></i> Submit Quiz
            </button>
            <a href="index.php" class="btn btn-secondary btn-lg ml-2">
                <i class="fas fa-times"></i> Cancel
            </a>

            <p class="text-muted mt-3 mb-0">
                <small><i class="fas fa-exclamation-triangle"></i> Make sure to review all your answers and explanations before submitting!</small>
            </p>
        </div>
    </div>
</form>

<script>
// Track time spent
let startTime = Date.now();

setInterval(function() {
    let timeSpent = Math.floor((Date.now() - startTime) / 1000);
    $('#time_spent').val(timeSpent);
}, 1000);

// Start timer if quiz has time limit
<?php if ($quiz['time_limit']): ?>
    startTimer(<?php echo $quiz['time_limit']; ?>);
<?php endif; ?>

// Confirm before leaving page
let formSubmitted = false;
$('#quiz-form').on('submit', function() {
    formSubmitted = true;
});

$(window).on('beforeunload', function() {
    if (!formSubmitted) {
        return 'Are you sure you want to leave? Your quiz progress will be lost.';
    }
});

// Character counter for explanations
$('.explanation-textarea').each(function() {
    const $textarea = $(this);
    const $counter = $('<div class="text-right mt-1"><small class="char-count text-muted">0 characters</small></div>');

    $textarea.after($counter);

    $textarea.on('input', function() {
        const length = $(this).val().length;
        $counter.find('.char-count').text(length + ' characters');

        if (length < 20) {
            $counter.find('.char-count').removeClass('text-success').addClass('text-danger');
        } else {
            $counter.find('.char-count').removeClass('text-danger').addClass('text-success');
        }
    });
});
</script>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
