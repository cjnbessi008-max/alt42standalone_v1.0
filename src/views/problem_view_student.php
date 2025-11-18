<?php include __DIR__ . '/layout/header.php'; ?>

<div class="row">
    <div class="col-12">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/student/dashboard">Dashboard</a></li>
                <li class="breadcrumb-item active"><?php echo htmlspecialchars($problem['title']); ?></li>
            </ol>
        </nav>
    </div>
</div>

<?php if ($existingSubmission && $existingSubmission['status'] !== 'draft'): ?>
    <!-- Show existing submission -->
    <div class="alert alert-info">
        <i class="fas fa-info-circle"></i> You have already submitted this problem.
        <a href="/submission/view?id=<?php echo $existingSubmission['id']; ?>" class="alert-link">
            View your submission
        </a>
    </div>
<?php endif; ?>

<div class="row">
    <div class="col-lg-8">
        <!-- Problem Statement -->
        <div class="card mb-3">
            <div class="card-header">
                <h4 class="mb-0">
                    <i class="fas fa-question-circle"></i> <?php echo htmlspecialchars($problem['title']); ?>
                </h4>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <span class="badge badge-secondary"><?php echo htmlspecialchars($problem['problem_type']); ?></span>
                    <span class="badge badge-info">Difficulty: <?php echo str_repeat('⭐', $problem['difficulty_level']); ?></span>
                    <span class="badge badge-success"><?php echo $problem['points']; ?> points</span>
                    <?php if ($problem['time_limit_minutes']): ?>
                        <span class="badge badge-warning">
                            <i class="fas fa-clock"></i> <?php echo $problem['time_limit_minutes']; ?> minutes
                        </span>
                    <?php endif; ?>
                </div>

                <?php if ($problem['description']): ?>
                    <p class="text-muted"><?php echo nl2br(htmlspecialchars($problem['description'])); ?></p>
                <?php endif; ?>

                <hr>

                <div class="problem-statement" style="font-size: 1.1em; line-height: 1.8;">
                    <?php echo nl2br(htmlspecialchars($problem['problem_statement'])); ?>
                </div>

                <?php if ($problem['hints']): ?>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-info" type="button" data-toggle="collapse" data-target="#hints">
                            <i class="fas fa-lightbulb"></i> Show Hints
                        </button>
                        <div class="collapse mt-2" id="hints">
                            <div class="alert alert-info">
                                <?php echo nl2br(htmlspecialchars($problem['hints'])); ?>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Solution Form -->
        <?php if (!$existingSubmission || $existingSubmission['status'] === 'draft'): ?>
        <form method="POST" action="/submission/submit" id="submission-form">
            <input type="hidden" name="problem_id" value="<?php echo $problem['id']; ?>">
            <?php if ($existingSubmission): ?>
                <input type="hidden" name="submission_id" value="<?php echo $existingSubmission['id']; ?>">
            <?php endif; ?>

            <!-- Your Answer -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        <i class="fas fa-pen"></i> Your Answer
                    </h5>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="student_answer">
                            Your Answer <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control form-control-lg" id="student_answer"
                               name="student_answer" required
                               value="<?php echo htmlspecialchars($existingSubmission['student_answer'] ?? ''); ?>"
                               placeholder="Enter your answer here">
                        <small class="form-text text-muted">
                            Enter your final answer clearly (e.g., 5/6, 0.833, or x=5)
                        </small>
                    </div>
                </div>
            </div>

            <!-- Show Your Work -->
            <?php if ($problem['requires_work_shown']): ?>
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-file-alt"></i> Show Your Work
                    </h5>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="work_shown">
                            Explain your solution process
                            <?php if ($problem['requires_work_shown']): ?>
                                <span class="text-danger">*</span>
                            <?php endif; ?>
                        </label>
                        <textarea class="form-control" id="work_shown" name="work_shown" rows="6"
                                  <?php echo $problem['requires_work_shown'] ? 'required' : ''; ?>
                                  placeholder="Write your solution steps here...&#10;&#10;Example:&#10;Step 1: ...&#10;Step 2: ...&#10;Step 3: ..."><?php echo htmlspecialchars($existingSubmission['work_shown'] ?? ''); ?></textarea>
                        <small class="form-text text-muted">
                            Show all your calculation steps clearly
                        </small>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Self-Verification (검산 근거) - KEY FEATURE -->
            <?php if ($problem['requires_verification']): ?>
            <div class="card mb-3 verification-box">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0">
                        <i class="fas fa-check-double"></i> Self-Verification (검산 근거)
                    </h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-info-circle"></i> What is Self-Verification?</h6>
                        <p class="mb-0">
                            Explain <strong>how you checked your answer</strong> to make sure it's correct.
                            This helps you think critically about your solution!
                        </p>
                    </div>

                    <div class="form-group">
                        <label for="self_verification" class="verification-label">
                            How did you verify your answer is correct? <span class="text-danger">*</span>
                        </label>
                        <textarea class="form-control" id="self_verification" name="self_verification" rows="8"
                                  required
                                  placeholder="Explain how you verified your answer...&#10;&#10;Examples:&#10;- 'I plugged my answer back into the equation and both sides were equal'&#10;- 'I used a different method to solve and got the same answer'&#10;- 'I estimated the answer mentally and my calculation is close to my estimate'&#10;- 'I checked each step for calculation errors'&#10;&#10;Be specific about what you did!"><?php echo htmlspecialchars($existingSubmission['self_verification'] ?? ''); ?></textarea>
                        <small class="form-text text-muted">
                            <strong>Tips:</strong> Describe your checking process in detail. What did you do to make sure your answer is right?
                        </small>
                    </div>

                    <div class="card bg-light">
                        <div class="card-body">
                            <h6><i class="fas fa-lightbulb"></i> Good Self-Verification Examples:</h6>
                            <ul class="small mb-0">
                                <li>"I substituted my answer back into the original equation to check if it works"</li>
                                <li>"I solved the problem using two different methods and got the same answer"</li>
                                <li>"I estimated the answer should be around 3, and my answer 2.98 is very close"</li>
                                <li>"I checked each calculation step carefully and found no errors"</li>
                                <li>"I drew a diagram to visualize the problem and my answer makes sense"</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Submit Button -->
            <div class="card">
                <div class="card-body">
                    <div class="form-group mb-0">
                        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submit-btn">
                            <i class="fas fa-paper-plane"></i> Submit Solution
                        </button>
                        <button type="button" class="btn btn-secondary btn-lg btn-block" id="save-draft-btn">
                            <i class="fas fa-save"></i> Save as Draft
                        </button>
                        <a href="/student/dashboard" class="btn btn-outline-secondary btn-block">
                            <i class="fas fa-times"></i> Cancel
                        </a>
                    </div>

                    <div class="text-center mt-3 text-muted">
                        <small>
                            <i class="fas fa-clock"></i> Time spent: <span id="time-spent">0:00</span>
                        </small>
                    </div>
                </div>
            </div>
        </form>
        <?php endif; ?>
    </div>

    <!-- Sidebar -->
    <div class="col-lg-4">
        <!-- Instructions -->
        <div class="card mb-3">
            <div class="card-header bg-info text-white">
                <i class="fas fa-clipboard-list"></i> Instructions
            </div>
            <div class="card-body">
                <ol class="small">
                    <li>Read the problem carefully</li>
                    <li>Write your final answer</li>
                    <?php if ($problem['requires_work_shown']): ?>
                        <li>Show all your work and steps</li>
                    <?php endif; ?>
                    <?php if ($problem['requires_verification']): ?>
                        <li><strong>Explain how you checked your answer</strong></li>
                    <?php endif; ?>
                    <li>Review everything before submitting</li>
                </ol>
            </div>
        </div>

        <?php if ($problem['requires_verification']): ?>
        <!-- AI Grading Info -->
        <div class="card mb-3">
            <div class="card-header bg-success text-white">
                <i class="fas fa-robot"></i> AI-Powered Feedback
            </div>
            <div class="card-body">
                <p class="small mb-0">
                    Your self-verification will be analyzed by AI to assess:
                </p>
                <ul class="small">
                    <li><strong>Logical Reasoning</strong></li>
                    <li><strong>Completeness</strong></li>
                    <li><strong>Clarity</strong></li>
                </ul>
                <p class="small mb-0">
                    <strong><?php echo round(VERIFICATION_WEIGHT * 100); ?>%</strong> of your grade comes from
                    the quality of your verification!
                </p>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php
$additionalScripts = <<<'JS'
<script>
    // Timer
    let startTime = Date.now();
    setInterval(function() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        $('#time-spent').text(minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
    }, 1000);

    // Save draft
    $('#save-draft-btn').click(function() {
        const formData = $('#submission-form').serialize() + '&save_draft=1';
        $.post('/submission/submit', formData, function(response) {
            alert('Draft saved successfully!');
        }).fail(function() {
            alert('Failed to save draft');
        });
    });

    // Add time spent to form
    $('#submission-form').submit(function() {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        $('<input>').attr({
            type: 'hidden',
            name: 'time_spent_seconds',
            value: timeSpent
        }).appendTo(this);
    });

    // MathJax rendering
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise();
    }
</script>
JS;
include __DIR__ . '/layout/footer.php';
?>
