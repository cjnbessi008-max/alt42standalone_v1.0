<?php
/**
 * Teacher - Create Question Page
 * Allows teachers to create quiz questions with explanations
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

ensureSession();
requireRole('teacher');

$db = Database::getInstance();
$user = getCurrentUser();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!validateCsrfToken($_POST['csrf_token'])) {
            throw new Exception('Invalid CSRF token');
        }

        $quizId = intval($_POST['quiz_id']);
        $questionText = sanitize($_POST['question_text']);
        $questionType = sanitize($_POST['question_type']);
        $points = floatval($_POST['points']);
        $explanationWeight = floatval($_POST['explanation_weight']);
        $modelExplanation = sanitize($_POST['model_explanation']);
        $difficultyLevel = sanitize($_POST['difficulty_level']);

        // Validate inputs
        if (empty($questionText)) {
            throw new Exception('Question text is required');
        }

        if (!isset($_POST['options']) || count($_POST['options']) < 2) {
            throw new Exception('At least 2 options are required');
        }

        if (!isset($_POST['correct_option'])) {
            throw new Exception('Please select the correct answer');
        }

        $db->beginTransaction();

        // Insert question
        $questionResult = $db->execute(
            'INSERT INTO questions (quiz_id, question_text, question_type, points, explanation_weight, model_explanation, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$quizId, $questionText, $questionType, $points, $explanationWeight, $modelExplanation, $difficultyLevel]
        );

        $questionId = $questionResult['last_insert_id'];

        // Insert options
        $correctOption = intval($_POST['correct_option']);
        foreach ($_POST['options'] as $index => $optionText) {
            $optionText = sanitize($optionText);
            if (!empty($optionText)) {
                $isCorrect = ($index + 1) == $correctOption ? 1 : 0;
                $db->execute(
                    'INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES (?, ?, ?, ?)',
                    [$questionId, $optionText, $isCorrect, $index + 1]
                );
            }
        }

        // Insert keywords if provided
        if (isset($_POST['keywords']) && is_array($_POST['keywords'])) {
            foreach ($_POST['keywords'] as $index => $keyword) {
                $keyword = sanitize($keyword);
                if (!empty($keyword)) {
                    $keywordType = sanitize($_POST['keyword_types'][$index]);
                    $keywordWeight = floatval($_POST['keyword_weights'][$index]);

                    $db->execute(
                        'INSERT INTO explanation_keywords (question_id, keyword, keyword_type, weight) VALUES (?, ?, ?, ?)',
                        [$questionId, $keyword, $keywordType, $keywordWeight]
                    );
                }
            }
        }

        $db->commit();

        $_SESSION['success_message'] = 'Question created successfully!';
        header('Location: create_question.php?quiz_id=' . $quizId);
        exit;

    } catch (Exception $e) {
        $db->rollback();
        $errorMessage = $e->getMessage();
    }
}

// Get quiz list
$quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
$quizzes = $db->query(
    'SELECT * FROM quizzes WHERE teacher_id = ? ORDER BY created_at DESC',
    [$user['id']]
);

$selectedQuiz = null;
if ($quizId) {
    $selectedQuiz = $db->queryOne(
        'SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?',
        [$quizId, $user['id']]
    );
}

$title = 'Create Question';
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

<div class="row">
    <div class="col-lg-10 mx-auto">
        <div class="card">
            <div class="card-header">
                <h4 class="mb-0">
                    <i class="fas fa-plus-circle"></i> Create New Question
                </h4>
            </div>
            <div class="card-body">
                <?php if (empty($quizzes)): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> You need to create a quiz first before adding questions.
                        <a href="manage_quiz.php" class="alert-link">Create Quiz</a>
                    </div>
                <?php else: ?>
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCsrfToken(); ?>">

                        <!-- Quiz Selection -->
                        <div class="form-group">
                            <label for="quiz_id"><strong>Select Quiz <span class="text-danger">*</span></strong></label>
                            <select name="quiz_id" id="quiz_id" class="form-control" required onchange="window.location.href='create_question.php?quiz_id='+this.value">
                                <option value="">-- Select Quiz --</option>
                                <?php foreach ($quizzes as $quiz): ?>
                                    <option value="<?php echo $quiz['id']; ?>" <?php echo $quizId == $quiz['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($quiz['title']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <?php if ($selectedQuiz): ?>
                            <hr>

                            <!-- Question Text -->
                            <div class="form-group">
                                <label for="question_text"><strong>Question Text <span class="text-danger">*</span></strong></label>
                                <textarea name="question_text" id="question_text" class="form-control" rows="3" required placeholder="Enter your question here..."></textarea>
                            </div>

                            <!-- Question Type and Points -->
                            <div class="form-row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="question_type"><strong>Question Type</strong></label>
                                        <select name="question_type" id="question_type" class="form-control">
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="points"><strong>Points</strong></label>
                                        <input type="number" name="points" id="points" class="form-control" value="10" step="0.5" min="0" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="difficulty_level"><strong>Difficulty</strong></label>
                                        <select name="difficulty_level" id="difficulty_level" class="form-control">
                                            <option value="easy">Easy</option>
                                            <option value="medium" selected>Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Options -->
                            <div class="form-group">
                                <label><strong>Answer Options <span class="text-danger">*</span></strong></label>
                                <div id="options-container">
                                    <?php for ($i = 1; $i <= 4; $i++): ?>
                                        <div class="option-item" id="option-<?php echo $i; ?>">
                                            <div class="form-row">
                                                <div class="col-md-8">
                                                    <input type="text" name="options[]" class="form-control" placeholder="Option <?php echo $i; ?>" required>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="custom-control custom-radio">
                                                        <input type="radio" class="custom-control-input" name="correct_option" value="<?php echo $i; ?>" id="correct-<?php echo $i; ?>" <?php echo $i == 1 ? 'checked' : ''; ?>>
                                                        <label class="custom-control-label" for="correct-<?php echo $i; ?>">
                                                            Correct Answer
                                                        </label>
                                                    </div>
                                                </div>
                                                <?php if ($i > 2): ?>
                                                    <div class="col-md-1">
                                                        <button type="button" class="btn btn-danger btn-sm" onclick="removeOption(<?php echo $i; ?>)">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addOption()">
                                    <i class="fas fa-plus"></i> Add Option
                                </button>
                            </div>

                            <!-- Explanation Settings -->
                            <div class="form-group">
                                <label for="explanation_weight"><strong>Explanation Weight (0-1)</strong></label>
                                <input type="number" name="explanation_weight" id="explanation_weight" class="form-control" value="0.30" step="0.05" min="0" max="1">
                                <small class="form-text text-muted">How much the explanation counts toward the total score (0.30 = 30%)</small>
                            </div>

                            <!-- Model Explanation -->
                            <div class="form-group">
                                <label for="model_explanation"><strong>Model/Ideal Explanation</strong></label>
                                <textarea name="model_explanation" id="model_explanation" class="form-control" rows="3" placeholder="Provide a model explanation that students can reference..."></textarea>
                                <small class="form-text text-muted">This will help in evaluating student explanations</small>
                            </div>

                            <!-- Keywords for Evaluation -->
                            <div class="form-group">
                                <label><strong>Evaluation Keywords (Optional)</strong></label>
                                <small class="d-block text-muted mb-2">Add keywords to automatically evaluate student explanations</small>

                                <div id="keywords-container">
                                    <!-- Keywords will be added dynamically -->
                                </div>

                                <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addKeyword()">
                                    <i class="fas fa-plus"></i> Add Keyword
                                </button>

                                <div class="alert alert-info mt-3 mb-0">
                                    <small>
                                        <strong>Keyword Types:</strong><br>
                                        <span class="badge badge-danger">Required</span> - Must appear in explanation<br>
                                        <span class="badge badge-success">Bonus</span> - Extra points if mentioned<br>
                                        <span class="badge badge-warning">Negative</span> - Deduct points if mentioned (wrong concepts)
                                    </small>
                                </div>
                            </div>

                            <hr>

                            <!-- Submit Buttons -->
                            <div class="form-group mb-0">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Create Question
                                </button>
                                <a href="manage_questions.php?quiz_id=<?php echo $quizId; ?>" class="btn btn-secondary">
                                    <i class="fas fa-arrow-left"></i> Back to Questions
                                </a>
                            </div>
                        <?php endif; ?>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script>
// Initialize option and keyword counters
let optionCount = 4;
let keywordCount = 0;
</script>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>
