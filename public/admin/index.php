<?php
/**
 * Admin Dashboard - Question Management
 */

require_once __DIR__ . '/../../src/autoload.php';

use App\Core\Auth;
use App\Database\Connection;

$auth = Auth::getInstance();
$auth->requireTeacher();

$config = require __DIR__ . '/../../config/database.php';
$db = Connection::getInstance($config);

// Handle question creation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_question'])) {
    $categoryId = (int)$_POST['category_id'];
    $title = $_POST['title'];
    $questionText = $_POST['question_text'];
    $questionType = $_POST['question_type'];
    $difficulty = (int)$_POST['difficulty_level'];
    $points = (int)$_POST['points'];

    $query = "INSERT INTO questions (category_id, title, question_text, question_type, difficulty_level, points, created_by)
              VALUES (:cat, :title, :text, :type, :diff, :points, :teacher)";

    $db->execute($query, [
        'cat' => $categoryId,
        'title' => $title,
        'text' => $questionText,
        'type' => $questionType,
        'diff' => $difficulty,
        'points' => $points,
        'teacher' => $auth->id()
    ]);

    $questionId = $db->lastInsertId();

    // Add options for multiple choice
    if ($questionType === 'multiple_choice') {
        $options = $_POST['options'] ?? [];
        $correctOption = $_POST['correct_option'] ?? 0;

        foreach ($options as $index => $optionText) {
            if (!empty(trim($optionText))) {
                $optQuery = "INSERT INTO answer_options (question_id, option_text, is_correct, display_order)
                             VALUES (:qid, :text, :correct, :order)";

                $db->execute($optQuery, [
                    'qid' => $questionId,
                    'text' => $optionText,
                    'correct' => ($index == $correctOption) ? 1 : 0,
                    'order' => $index
                ]);
            }
        }
    } else {
        // Add correct answer
        $answerText = $_POST['correct_answer'] ?? '';
        $answerValue = ($questionType === 'numeric') ? (float)$_POST['correct_answer'] : null;

        $ansQuery = "INSERT INTO correct_answers (question_id, answer_text, answer_value)
                     VALUES (:qid, :text, :value)";

        $db->execute($ansQuery, [
            'qid' => $questionId,
            'text' => $answerText,
            'value' => $answerValue
        ]);
    }

    $successMessage = '문제가 성공적으로 생성되었습니다!';
}

// Get categories
$categories = $db->fetchAll("SELECT * FROM categories ORDER BY display_order");

// Get recent questions
$questions = $db->fetchAll("
    SELECT q.*, c.name as category_name,
           (SELECT COUNT(*) FROM attempts WHERE question_id = q.id) as attempt_count,
           (SELECT COUNT(*) FROM attempts WHERE question_id = q.id AND is_correct = 1) as correct_count
    FROM questions q
    JOIN categories c ON q.category_id = c.id
    ORDER BY q.created_at DESC
    LIMIT 20
");

// Get statistics
$statsQuery = "SELECT
                (SELECT COUNT(*) FROM questions) as total_questions,
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                (SELECT COUNT(*) FROM attempts) as total_attempts,
                (SELECT SUM(is_correct) FROM attempts) as correct_attempts";
$stats = $db->fetchOne($statsQuery);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>관리자 대시보드 - Math Learning</title>
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .admin-container {
            max-width: 1400px;
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
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 2.5em;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1em;
            box-sizing: border-box;
        }
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        .btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn-add {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .option-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .option-row input {
            flex: 1;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1>🎓 관리자 대시보드</h1>
                    <p><?php echo htmlspecialchars($auth->user()['full_name']); ?>님 환영합니다</p>
                </div>
                <a href="/logout.php" class="btn" style="background: #6c757d;">로그아웃</a>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3><?php echo $stats['total_questions']; ?></h3>
                <p>총 문제 수</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['total_students']; ?></h3>
                <p>학생 수</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['total_attempts']; ?></h3>
                <p>문제 풀이 수</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $stats['total_attempts'] > 0 ? round(($stats['correct_attempts'] / $stats['total_attempts']) * 100) : 0; ?>%</h3>
                <p>전체 정답률</p>
            </div>
        </div>

        <?php if (isset($successMessage)): ?>
            <div class="success"><?php echo $successMessage; ?></div>
        <?php endif; ?>

        <div class="card">
            <h2>📝 새 문제 만들기</h2>
            <form method="POST" action="">
                <div class="form-grid">
                    <div class="form-group">
                        <label>카테고리</label>
                        <select name="category_id" required>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>"><?php echo htmlspecialchars($cat['name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>문제 유형</label>
                        <select name="question_type" id="questionType" required onchange="updateAnswerFields()">
                            <option value="multiple_choice">객관식</option>
                            <option value="short_answer">주관식</option>
                            <option value="numeric">숫자 답</option>
                            <option value="true_false">참/거짓</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>난이도 (1-5)</label>
                        <input type="number" name="difficulty_level" min="1" max="5" value="1" required>
                    </div>

                    <div class="form-group">
                        <label>배점</label>
                        <input type="number" name="points" value="10" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>문제 제목</label>
                    <input type="text" name="title" required>
                </div>

                <div class="form-group">
                    <label>문제 내용</label>
                    <textarea name="question_text" required></textarea>
                </div>

                <div id="answerFields">
                    <!-- Will be filled by JavaScript -->
                    <div id="multipleChoice">
                        <label>답안 선택지</label>
                        <div id="optionsContainer">
                            <div class="option-row">
                                <input type="text" name="options[]" placeholder="선택지 1" required>
                                <input type="radio" name="correct_option" value="0" required checked> 정답
                            </div>
                            <div class="option-row">
                                <input type="text" name="options[]" placeholder="선택지 2" required>
                                <input type="radio" name="correct_option" value="1" required> 정답
                            </div>
                            <div class="option-row">
                                <input type="text" name="options[]" placeholder="선택지 3">
                                <input type="radio" name="correct_option" value="2"> 정답
                            </div>
                            <div class="option-row">
                                <input type="text" name="options[]" placeholder="선택지 4">
                                <input type="radio" name="correct_option" value="3"> 정답
                            </div>
                        </div>
                    </div>

                    <div id="otherAnswer" style="display: none;">
                        <label>정답</label>
                        <input type="text" name="correct_answer" placeholder="정답을 입력하세요">
                    </div>
                </div>

                <button type="submit" name="create_question" class="btn">문제 생성</button>
            </form>
        </div>

        <div class="card">
            <h2>📚 문제 목록</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>제목</th>
                        <th>카테고리</th>
                        <th>유형</th>
                        <th>난이도</th>
                        <th>풀이 수</th>
                        <th>정답률</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($questions as $q): ?>
                        <tr>
                            <td><?php echo $q['id']; ?></td>
                            <td><?php echo htmlspecialchars($q['title']); ?></td>
                            <td><?php echo htmlspecialchars($q['category_name']); ?></td>
                            <td><?php echo htmlspecialchars($q['question_type']); ?></td>
                            <td><?php echo $q['difficulty_level']; ?></td>
                            <td><?php echo $q['attempt_count']; ?></td>
                            <td><?php echo $q['attempt_count'] > 0 ? round(($q['correct_count'] / $q['attempt_count']) * 100) : 0; ?>%</td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function updateAnswerFields() {
            const questionType = document.getElementById('questionType').value;
            const multipleChoice = document.getElementById('multipleChoice');
            const otherAnswer = document.getElementById('otherAnswer');

            if (questionType === 'multiple_choice') {
                multipleChoice.style.display = 'block';
                otherAnswer.style.display = 'none';
            } else {
                multipleChoice.style.display = 'none';
                otherAnswer.style.display = 'block';
            }
        }

        updateAnswerFields();
    </script>
</body>
</html>
