<?php include __DIR__ . '/layout/header.php'; ?>

<div class="row">
    <div class="col-12">
        <h1 class="mb-4">
            <i class="fas fa-plus-circle"></i> Create New Problem
        </h1>
    </div>
</div>

<?php if (!empty($errors)): ?>
    <div class="alert alert-danger">
        <h5><i class="fas fa-exclamation-triangle"></i> Errors:</h5>
        <ul class="mb-0">
            <?php foreach ($errors as $error): ?>
                <li><?php echo htmlspecialchars($error); ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
<?php endif; ?>

<div class="row">
    <div class="col-lg-8">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-edit"></i> Problem Details
            </div>
            <div class="card-body">
                <form method="POST" action="/problem/create">
                    <!-- Title -->
                    <div class="form-group">
                        <label for="title">Problem Title <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="title" name="title"
                               value="<?php echo htmlspecialchars($_POST['title'] ?? ''); ?>"
                               placeholder="e.g., Fraction Addition - Pizza Slices" required>
                    </div>

                    <!-- Description -->
                    <div class="form-group">
                        <label for="description">Description (Optional)</label>
                        <textarea class="form-control" id="description" name="description" rows="2"
                                  placeholder="Brief description for teachers"><?php echo htmlspecialchars($_POST['description'] ?? ''); ?></textarea>
                    </div>

                    <!-- Problem Statement -->
                    <div class="form-group">
                        <label for="problem_statement">Problem Statement <span class="text-danger">*</span></label>
                        <textarea class="form-control" id="problem_statement" name="problem_statement" rows="5"
                                  placeholder="Write the problem here. You can use LaTeX for math: \( \frac{1}{2} + \frac{1}{3} \)"
                                  required><?php echo htmlspecialchars($_POST['problem_statement'] ?? ''); ?></textarea>
                        <small class="form-text text-muted">
                            Use LaTeX notation for math equations: \( ... \) for inline, \[ ... \] for display
                        </small>
                    </div>

                    <!-- Correct Answer -->
                    <div class="form-group">
                        <label for="correct_answer">Correct Answer <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="correct_answer" name="correct_answer"
                               value="<?php echo htmlspecialchars($_POST['correct_answer'] ?? ''); ?>"
                               placeholder="e.g., 5/6 or 0.833" required>
                    </div>

                    <!-- Problem Type -->
                    <div class="form-group">
                        <label for="problem_type">Problem Type</label>
                        <select class="form-control" id="problem_type" name="problem_type">
                            <option value="arithmetic" <?php echo ($_POST['problem_type'] ?? '') === 'arithmetic' ? 'selected' : ''; ?>>Arithmetic</option>
                            <option value="algebra" <?php echo ($_POST['problem_type'] ?? '') === 'algebra' ? 'selected' : ''; ?>>Algebra</option>
                            <option value="geometry" <?php echo ($_POST['problem_type'] ?? '') === 'geometry' ? 'selected' : ''; ?>>Geometry</option>
                            <option value="word_problem" <?php echo ($_POST['problem_type'] ?? '') === 'word_problem' ? 'selected' : ''; ?>>Word Problem</option>
                            <option value="other" <?php echo ($_POST['problem_type'] ?? '') === 'other' ? 'selected' : ''; ?>>Other</option>
                        </select>
                    </div>

                    <!-- Difficulty and Points -->
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label for="difficulty_level">Difficulty Level</label>
                            <select class="form-control" id="difficulty_level" name="difficulty_level">
                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <option value="<?php echo $i; ?>" <?php echo ($_POST['difficulty_level'] ?? 1) == $i ? 'selected' : ''; ?>>
                                        <?php echo str_repeat('⭐', $i); ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="points">Points</label>
                            <input type="number" class="form-control" id="points" name="points"
                                   value="<?php echo $_POST['points'] ?? 10; ?>" min="1" max="100" step="0.5">
                        </div>
                    </div>

                    <!-- Hints -->
                    <div class="form-group">
                        <label for="hints">Hints (Optional)</label>
                        <textarea class="form-control" id="hints" name="hints" rows="3"
                                  placeholder="Provide hints to help students..."><?php echo htmlspecialchars($_POST['hints'] ?? ''); ?></textarea>
                    </div>

                    <!-- Time Limit -->
                    <div class="form-group">
                        <label for="time_limit_minutes">Time Limit (Optional)</label>
                        <input type="number" class="form-control" id="time_limit_minutes" name="time_limit_minutes"
                               value="<?php echo $_POST['time_limit_minutes'] ?? ''; ?>"
                               placeholder="Leave empty for no time limit" min="1">
                        <small class="form-text text-muted">Time limit in minutes</small>
                    </div>

                    <!-- Requirements -->
                    <div class="form-group">
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="requires_work_shown"
                                   name="requires_work_shown" <?php echo isset($_POST['requires_work_shown']) || !isset($_POST['title']) ? 'checked' : ''; ?>>
                            <label class="custom-control-label" for="requires_work_shown">
                                Require students to show their work
                            </label>
                        </div>
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="requires_verification"
                                   name="requires_verification" <?php echo isset($_POST['requires_verification']) || !isset($_POST['title']) ? 'checked' : ''; ?>>
                            <label class="custom-control-label" for="requires_verification">
                                Require students to provide self-verification (검산 근거)
                            </label>
                        </div>
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input" id="active"
                                   name="active" <?php echo isset($_POST['active']) || !isset($_POST['title']) ? 'checked' : ''; ?>>
                            <label class="custom-control-label" for="active">
                                Make problem active immediately
                            </label>
                        </div>
                    </div>

                    <!-- Submit Buttons -->
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="fas fa-save"></i> Create Problem
                        </button>
                        <a href="/teacher/dashboard" class="btn btn-secondary btn-lg">
                            <i class="fas fa-times"></i> Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Preview Panel -->
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-eye"></i> Preview
            </div>
            <div class="card-body">
                <h5 id="preview-title" class="text-muted">Problem Title</h5>
                <hr>
                <div id="preview-statement" class="mb-3 text-muted">
                    Problem statement will appear here...
                </div>
                <div class="alert alert-info">
                    <strong>Answer:</strong> <span id="preview-answer" class="text-muted">...</span>
                </div>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-warning">
                <i class="fas fa-lightbulb"></i> Tips
            </div>
            <div class="card-body">
                <ul class="small mb-0">
                    <li>Use clear, concise problem statements</li>
                    <li>Provide helpful hints to guide learning</li>
                    <li>Always require self-verification for better learning</li>
                    <li>LaTeX format: <code>\( x^2 \)</code></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php
$additionalScripts = <<<'JS'
<script>
    // Live preview
    $('#title').on('input', function() {
        $('#preview-title').text($(this).val() || 'Problem Title');
    });

    $('#problem_statement').on('input', function() {
        const text = $(this).val() || 'Problem statement will appear here...';
        $('#preview-statement').text(text);
        // Trigger MathJax rendering
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([document.getElementById('preview-statement')]);
        }
    });

    $('#correct_answer').on('input', function() {
        $('#preview-answer').text($(this).val() || '...');
    });
</script>
JS;
include __DIR__ . '/layout/footer.php';
?>
