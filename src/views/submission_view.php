<?php include __DIR__ . '/layout/header.php'; ?>

<?php if (isset($_SESSION['flash_message'])): ?>
    <div class="alert alert-success alert-dismissible fade show">
        <i class="fas fa-check-circle"></i> <?php echo htmlspecialchars($_SESSION['flash_message']); ?>
        <button type="button" class="close" data-dismiss="alert">&times;</button>
    </div>
    <?php unset($_SESSION['flash_message']); ?>
<?php endif; ?>

<div class="row">
    <div class="col-12">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a href="/<?php echo $user['role']; ?>/dashboard">Dashboard</a>
                </li>
                <li class="breadcrumb-item active">Submission Details</li>
            </ol>
        </nav>
    </div>
</div>

<div class="row">
    <div class="col-lg-8">
        <!-- Score Card -->
        <div class="card mb-3 <?php echo $submission['is_correct'] ? 'border-success' : 'border-warning'; ?>">
            <div class="card-header <?php echo $submission['is_correct'] ? 'bg-success' : 'bg-warning'; ?> text-white">
                <h4 class="mb-0">
                    <?php if ($submission['is_correct']): ?>
                        <i class="fas fa-check-circle"></i> Correct Answer!
                    <?php else: ?>
                        <i class="fas fa-info-circle"></i> Needs Review
                    <?php endif; ?>
                </h4>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-md-4">
                        <h3>
                            <?php if ($submission['score'] !== null): ?>
                                <span class="badge badge-<?php echo $submission['is_correct'] ? 'success' : 'warning'; ?> score-badge">
                                    <?php echo $submission['score']; ?> / <?php echo $submission['max_score']; ?>
                                </span>
                            <?php else: ?>
                                <span class="text-muted">Pending</span>
                            <?php endif; ?>
                        </h3>
                        <p class="text-muted">Your Score</p>
                    </div>
                    <div class="col-md-4">
                        <h3>
                            <?php if ($submission['is_correct']): ?>
                                <span class="badge badge-success score-badge">
                                    <i class="fas fa-check"></i> Correct
                                </span>
                            <?php else: ?>
                                <span class="badge badge-danger score-badge">
                                    <i class="fas fa-times"></i> Incorrect
                                </span>
                            <?php endif; ?>
                        </h3>
                        <p class="text-muted">Answer Status</p>
                    </div>
                    <div class="col-md-4">
                        <h3>
                            <?php
                            if ($verification && $verification['ai_score']) {
                                $aiScore = round($verification['ai_score']);
                                $color = $aiScore >= 70 ? 'success' : ($aiScore >= 40 ? 'warning' : 'danger');
                                echo "<span class='badge badge-{$color} score-badge'>{$aiScore}%</span>";
                            } else {
                                echo "<span class='text-muted'>N/A</span>";
                            }
                            ?>
                        </h3>
                        <p class="text-muted">Verification Quality</p>
                    </div>
                </div>

                <?php if ($submission['time_spent_seconds']): ?>
                    <p class="text-center text-muted mt-3 mb-0">
                        <i class="fas fa-clock"></i> Time spent: <?php echo gmdate('i:s', $submission['time_spent_seconds']); ?> minutes
                    </p>
                <?php endif; ?>
            </div>
        </div>

        <!-- Problem Statement -->
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-question-circle"></i> Problem</h5>
            </div>
            <div class="card-body">
                <h6><?php echo htmlspecialchars($submission['problem_title']); ?></h6>
                <div class="problem-statement">
                    <?php echo nl2br(htmlspecialchars($problem['problem_statement'])); ?>
                </div>
            </div>
        </div>

        <!-- Your Answer -->
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-pen"></i> Your Answer</h5>
            </div>
            <div class="card-body">
                <h4><?php echo htmlspecialchars($submission['student_answer']); ?></h4>
                <?php if ($user['role'] === 'teacher' || $user['role'] === 'admin'): ?>
                    <hr>
                    <p class="text-muted mb-0">
                        <strong>Correct Answer:</strong> <?php echo htmlspecialchars($problem['correct_answer']); ?>
                    </p>
                <?php endif; ?>
            </div>
        </div>

        <!-- Work Shown -->
        <?php if ($submission['work_shown']): ?>
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-file-alt"></i> Your Work</h5>
            </div>
            <div class="card-body">
                <pre class="mb-0" style="white-space: pre-wrap;"><?php echo htmlspecialchars($submission['work_shown']); ?></pre>
            </div>
        </div>
        <?php endif; ?>

        <!-- Self-Verification -->
        <div class="card mb-3 verification-box">
            <div class="card-header bg-warning text-dark">
                <h5 class="mb-0">
                    <i class="fas fa-check-double"></i> Your Self-Verification
                </h5>
            </div>
            <div class="card-body">
                <pre class="mb-0" style="white-space: pre-wrap;"><?php echo htmlspecialchars($submission['self_verification']); ?></pre>
            </div>
        </div>

        <!-- AI Feedback -->
        <?php if ($verification): ?>
        <div class="card mb-3 ai-feedback">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                    <i class="fas fa-robot"></i> AI Analysis of Your Verification
                </h5>
            </div>
            <div class="card-body">
                <!-- Score Breakdown -->
                <div class="row text-center mb-3">
                    <div class="col-md-4">
                        <h4 class="text-primary"><?php echo round($verification['logic_score']); ?>%</h4>
                        <p class="text-muted small">Logic Score</p>
                    </div>
                    <div class="col-md-4">
                        <h4 class="text-primary"><?php echo round($verification['completeness_score']); ?>%</h4>
                        <p class="text-muted small">Completeness</p>
                    </div>
                    <div class="col-md-4">
                        <h4 class="text-primary"><?php echo round($verification['clarity_score']); ?>%</h4>
                        <p class="text-muted small">Clarity</p>
                    </div>
                </div>

                <!-- AI Feedback -->
                <?php if ($verification['ai_feedback']): ?>
                    <div class="alert alert-primary">
                        <h6><i class="fas fa-comment"></i> Feedback:</h6>
                        <p class="mb-0"><?php echo nl2br(htmlspecialchars($verification['ai_feedback'])); ?></p>
                    </div>
                <?php endif; ?>

                <!-- AI Suggestions -->
                <?php if ($verification['ai_suggestions']): ?>
                    <div class="alert alert-info">
                        <h6><i class="fas fa-lightbulb"></i> Suggestions for Improvement:</h6>
                        <p class="mb-0"><?php echo nl2br(htmlspecialchars($verification['ai_suggestions'])); ?></p>
                    </div>
                <?php endif; ?>

                <p class="text-muted small mb-0">
                    <i class="fas fa-clock"></i> Processed in <?php echo $verification['processing_time_ms']; ?>ms
                    by <?php echo ucfirst($verification['processed_by']); ?>
                </p>
            </div>
        </div>
        <?php endif; ?>

        <!-- Teacher Feedback -->
        <?php if ($submission['teacher_feedback']): ?>
        <div class="card mb-3">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fas fa-chalkboard-teacher"></i> Teacher Feedback
                </h5>
            </div>
            <div class="card-body">
                <?php echo nl2br(htmlspecialchars($submission['teacher_feedback'])); ?>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <!-- Sidebar -->
    <div class="col-lg-4">
        <!-- Status Card -->
        <div class="card mb-3">
            <div class="card-header bg-secondary text-white">
                <i class="fas fa-info-circle"></i> Submission Info
            </div>
            <div class="card-body">
                <dl class="row mb-0 small">
                    <dt class="col-sm-5">Student:</dt>
                    <dd class="col-sm-7"><?php echo htmlspecialchars($submission['student_name']); ?></dd>

                    <dt class="col-sm-5">Submitted:</dt>
                    <dd class="col-sm-7">
                        <?php echo $submission['submitted_at'] ? date('Y-m-d H:i', strtotime($submission['submitted_at'])) : 'Not submitted'; ?>
                    </dd>

                    <dt class="col-sm-5">Status:</dt>
                    <dd class="col-sm-7">
                        <span class="badge badge-<?php echo $submission['status'] === 'graded' ? 'success' : 'warning'; ?>">
                            <?php echo ucfirst($submission['status']); ?>
                        </span>
                    </dd>

                    <dt class="col-sm-5">Attempt:</dt>
                    <dd class="col-sm-7">#<?php echo $submission['attempt_number']; ?></dd>
                </dl>
            </div>
        </div>

        <!-- Actions -->
        <div class="card mb-3">
            <div class="card-header">
                <i class="fas fa-cogs"></i> Actions
            </div>
            <div class="card-body">
                <?php if ($user['role'] === 'student'): ?>
                    <a href="/student/dashboard" class="btn btn-primary btn-block">
                        <i class="fas fa-home"></i> Back to Dashboard
                    </a>
                    <a href="/problem/view?id=<?php echo $submission['problem_id']; ?>" class="btn btn-outline-primary btn-block">
                        <i class="fas fa-redo"></i> Try Again
                    </a>
                <?php else: ?>
                    <a href="/teacher/dashboard" class="btn btn-primary btn-block">
                        <i class="fas fa-home"></i> Back to Dashboard
                    </a>
                    <a href="/problem/view?id=<?php echo $submission['problem_id']; ?>" class="btn btn-outline-primary btn-block">
                        <i class="fas fa-eye"></i> View Problem
                    </a>
                <?php endif; ?>
            </div>
        </div>

        <!-- Scoring Breakdown -->
        <?php if ($submission['score'] !== null): ?>
        <div class="card">
            <div class="card-header bg-success text-white">
                <i class="fas fa-calculator"></i> Score Breakdown
            </div>
            <div class="card-body">
                <?php
                $answerPoints = $submission['is_correct'] ? ($submission['max_score'] * ANSWER_WEIGHT) : 0;
                $verificationPoints = $submission['score'] - $answerPoints;
                ?>
                <dl class="row mb-0 small">
                    <dt class="col-7">Answer Correctness:</dt>
                    <dd class="col-5 text-right"><?php echo round($answerPoints, 2); ?> pts</dd>

                    <dt class="col-7">Verification Quality:</dt>
                    <dd class="col-5 text-right"><?php echo round($verificationPoints, 2); ?> pts</dd>

                    <dt class="col-7 border-top pt-2"><strong>Total:</strong></dt>
                    <dd class="col-5 text-right border-top pt-2">
                        <strong><?php echo $submission['score']; ?> / <?php echo $submission['max_score']; ?></strong>
                    </dd>
                </dl>

                <hr>

                <p class="small text-muted mb-0">
                    <i class="fas fa-info-circle"></i>
                    <?php echo round(ANSWER_WEIGHT * 100); ?>% from answer correctness,
                    <?php echo round(VERIFICATION_WEIGHT * 100); ?>% from verification quality
                </p>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php
$additionalScripts = <<<'JS'
<script>
    // MathJax rendering
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise();
    }
</script>
JS;
include __DIR__ . '/layout/footer.php';
?>
