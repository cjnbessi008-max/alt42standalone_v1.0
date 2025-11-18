<?php
/**
 * Student Dashboard - Problem Solving Interface
 * Auto-recommendation system
 */

require_once __DIR__ . '/../../src/autoload.php';

use App\Core\Auth;
use App\Database\Connection;
use App\Services\RecommendationEngine;
use App\Services\CacheService;

$auth = Auth::getInstance();
$auth->requireAuth();

if (!$auth->isStudent()) {
    header('Location: /admin/');
    exit;
}

$config = require __DIR__ . '/../../config/database.php';
$db = Connection::getInstance($config);
$cache = new CacheService($config);
$recommender = new RecommendationEngine($db, $config);

$studentId = $auth->id();

// Handle question submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_answer'])) {
    $questionId = (int)$_POST['question_id'];
    $questionType = $_POST['question_type'];
    $categoryId = (int)$_POST['category_id'];

    $isCorrect = false;
    $answerText = null;
    $selectedOptionId = null;

    // Check answer based on question type
    if ($questionType === 'multiple_choice') {
        $selectedOptionId = (int)$_POST['answer'];

        $optionQuery = "SELECT is_correct FROM answer_options WHERE id = :id LIMIT 1";
        $option = $db->fetchOne($optionQuery, ['id' => $selectedOptionId]);
        $isCorrect = $option && $option['is_correct'] == 1;
    } elseif ($questionType === 'numeric') {
        $answerValue = (float)$_POST['answer'];

        $correctQuery = "SELECT answer_value, tolerance FROM correct_answers WHERE question_id = :qid LIMIT 1";
        $correct = $db->fetchOne($correctQuery, ['qid' => $questionId]);

        if ($correct) {
            $tolerance = $correct['tolerance'] ?? 0.01;
            $isCorrect = abs($answerValue - $correct['answer_value']) <= $tolerance;
        }
    } else {
        $answerText = trim($_POST['answer']);

        $correctQuery = "SELECT answer_text, is_case_sensitive FROM correct_answers WHERE question_id = :qid LIMIT 1";
        $correct = $db->fetchOne($correctQuery, ['qid' => $questionId]);

        if ($correct) {
            $isCaseSensitive = $correct['is_case_sensitive'] == 1;
            $correctAnswer = $correct['answer_text'];

            if ($isCaseSensitive) {
                $isCorrect = $answerText === $correctAnswer;
            } else {
                $isCorrect = strcasecmp($answerText, $correctAnswer) === 0;
            }
        }
    }

    // Get points
    $questionData = $db->fetchOne("SELECT points FROM questions WHERE id = :id", ['id' => $questionId]);
    $pointsEarned = $isCorrect ? $questionData['points'] : 0;

    // Record attempt
    $insertQuery = "INSERT INTO attempts (student_id, question_id, answer_text, selected_option_id, is_correct, points_earned)
                    VALUES (:sid, :qid, :answer, :option, :correct, :points)";

    $db->execute($insertQuery, [
        'sid' => $studentId,
        'qid' => $questionId,
        'answer' => $answerText,
        'option' => $selectedOptionId,
        'correct' => $isCorrect ? 1 : 0,
        'points' => $pointsEarned
    ]);

    // Update student level
    $recommender->updateStudentLevel($studentId, $categoryId, $isCorrect);

    $resultMessage = $isCorrect ? '정답입니다! 🎉' : '틀렸습니다. 다시 시도해보세요!';
}

// Get categories and progress
$categories = $db->fetchAll("SELECT * FROM categories ORDER BY display_order");

// Get student statistics
$statsQuery = "SELECT
                COUNT(*) as total_attempts,
                SUM(is_correct) as correct_attempts,
                SUM(points_earned) as total_points
              FROM attempts
              WHERE student_id = :sid";
$stats = $db->fetchOne($statsQuery, ['sid' => $studentId]);

// Get recommended question
$selectedCategory = isset($_GET['category']) ? (int)$_GET['category'] : null;
$question = $recommender->getNextQuestion($studentId, $selectedCategory);

// Get answer options if multiple choice
$options = [];
if ($question && $question['question_type'] === 'multiple_choice') {
    $optionsQuery = "SELECT * FROM answer_options WHERE question_id = :qid ORDER BY display_order";
    $options = $db->fetchAll($optionsQuery, ['qid' => $question['id']]);
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>학생 대시보드 - Math Learning</title>
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .student-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 2em;
        }
        .question-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .question-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .difficulty-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }
        .difficulty-1 { background: #d4edda; color: #155724; }
        .difficulty-2 { background: #d1ecf1; color: #0c5460; }
        .difficulty-3 { background: #fff3cd; color: #856404; }
        .difficulty-4 { background: #f8d7da; color: #721c24; }
        .difficulty-5 { background: #d6d8db; color: #383d41; }
        .question-text {
            font-size: 1.3em;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .options {
            margin-bottom: 20px;
        }
        .option {
            padding: 15px;
            margin-bottom: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .option:hover {
            border-color: #667eea;
            background: #f8f9fa;
        }
        .option input[type="radio"] {
            margin-right: 10px;
        }
        .btn {
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6c757d;
        }
        .result-message {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 1.2em;
            font-weight: 600;
        }
        .result-correct {
            background: #d4edda;
            color: #155724;
        }
        .result-incorrect {
            background: #f8d7da;
            color: #721c24;
        }
        .input-answer {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1.1em;
            margin-bottom: 20px;
        }
        .logout-btn {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="student-container">
        <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1>👋 <?php echo htmlspecialchars($auth->user()['full_name']); ?>님 환영합니다!</h1>
                    <p>추천 문제로 학습을 시작하세요</p>
                </div>
                <a href="/logout.php" class="logout-btn">로그아웃</a>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3><?php echo $stats['total_attempts'] ?? 0; ?></h3>
                <p>푼 문제</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['correct_attempts'] ?? 0; ?></h3>
                <p>정답</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['total_points'] ?? 0; ?></h3>
                <p>획득 포인트</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['total_attempts'] > 0 ? round(($stats['correct_attempts'] / $stats['total_attempts']) * 100) : 0; ?>%</h3>
                <p>정답률</p>
            </div>
        </div>

        <?php if (isset($resultMessage)): ?>
            <div class="result-message <?php echo $isCorrect ? 'result-correct' : 'result-incorrect'; ?>">
                <?php echo $resultMessage; ?>
                <?php if (!$isCorrect && $question): ?>
                    <br><small>정답: <?php
                        if ($questionType === 'multiple_choice') {
                            $correctOpt = array_filter($options, function($o) { return $o['is_correct'] == 1; });
                            $correctOpt = reset($correctOpt);
                            echo htmlspecialchars($correctOpt['option_text']);
                        }
                    ?></small>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php if ($question): ?>
            <div class="question-card">
                <div class="question-header">
                    <h2><?php echo htmlspecialchars($question['title']); ?></h2>
                    <span class="difficulty-badge difficulty-<?php echo $question['difficulty_level']; ?>">
                        난이도 <?php echo $question['difficulty_level']; ?>
                    </span>
                </div>

                <div class="question-text">
                    <?php echo nl2br(htmlspecialchars($question['question_text'])); ?>
                </div>

                <form method="POST" action="">
                    <input type="hidden" name="question_id" value="<?php echo $question['id']; ?>">
                    <input type="hidden" name="question_type" value="<?php echo $question['question_type']; ?>">
                    <input type="hidden" name="category_id" value="<?php echo $question['category_id']; ?>">

                    <?php if ($question['question_type'] === 'multiple_choice'): ?>
                        <div class="options">
                            <?php foreach ($options as $option): ?>
                                <label class="option">
                                    <input type="radio" name="answer" value="<?php echo $option['id']; ?>" required>
                                    <?php echo htmlspecialchars($option['option_text']); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    <?php elseif ($question['question_type'] === 'numeric'): ?>
                        <input type="number" step="0.01" name="answer" class="input-answer" placeholder="답을 입력하세요" required>
                    <?php else: ?>
                        <input type="text" name="answer" class="input-answer" placeholder="답을 입력하세요" required>
                    <?php endif; ?>

                    <button type="submit" name="submit_answer" class="btn">제출하기</button>
                    <button type="button" class="btn btn-secondary" onclick="location.reload()">다음 문제</button>
                </form>
            </div>
        <?php else: ?>
            <div class="question-card">
                <p style="text-align: center; font-size: 1.2em; color: #6c757d;">
                    🎉 모든 문제를 완료했습니다!<br>
                    <small>관리자에게 새로운 문제를 요청하세요.</small>
                </p>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
