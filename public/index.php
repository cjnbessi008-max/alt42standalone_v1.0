<?php
/**
 * Moodle Question Auto-Display System
 *
 * Main entry point for displaying Moodle questions
 * Compatible with: MySQL 5.7, PHP 7.1.9, Moodle 3.7
 */

// Enable error reporting for development (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Load autoloader
require_once __DIR__ . '/../src/autoload.php';

// Load configuration
$config = require __DIR__ . '/../config/config.php';

use MoodleIntegration\Database\Connection;
use MoodleIntegration\Services\CacheService;
use MoodleIntegration\Services\QuestionService;

try {
    // Initialize services
    $db = Connection::getInstance($config);
    $cache = new CacheService($config);
    $questionService = new QuestionService($db, $cache, $config);

    // Get parameters from request
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
    $perPage = $config['display']['per_page'];
    $offset = ($page - 1) * $perPage;

    // Fetch questions
    $options = [
        'limit' => $perPage,
        'offset' => $offset,
        'category' => $categoryId,
    ];

    $questions = $questionService->getQuestions($options);
    $totalQuestions = $questionService->getTotalCount($options);
    $categories = $questionService->getCategories();
    $totalPages = ceil($totalQuestions / $perPage);

} catch (Exception $e) {
    $error = $e->getMessage();
    $questions = [];
    $categories = [];
    $totalPages = 0;
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moodle 문제 자동 표시 시스템</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 Moodle 문제 자동 표시</h1>
            <p class="subtitle">효율적인 LMS 연동 시스템</p>
        </header>

        <?php if (isset($error)): ?>
            <div class="alert alert-error">
                <strong>오류:</strong> <?php echo htmlspecialchars($error); ?>
                <br><small>데이터베이스 연결 설정을 확인해주세요.</small>
            </div>
        <?php else: ?>

        <!-- Category Filter -->
        <div class="filter-section">
            <label for="category-filter">카테고리 필터:</label>
            <select id="category-filter" onchange="filterByCategory(this.value)">
                <option value="">전체 카테고리</option>
                <?php foreach ($categories as $category): ?>
                    <option value="<?php echo $category['id']; ?>"
                            <?php echo $categoryId == $category['id'] ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($category['name']); ?>
                        (<?php echo $category['question_count']; ?>)
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <!-- Question Count -->
        <div class="info-bar">
            <span>총 <strong><?php echo $totalQuestions; ?></strong>개의 문제</span>
            <span>페이지 <strong><?php echo $page; ?></strong> / <?php echo $totalPages; ?></span>
        </div>

        <!-- Questions List -->
        <div class="questions-container">
            <?php if (empty($questions)): ?>
                <div class="no-questions">
                    <p>표시할 문제가 없습니다.</p>
                </div>
            <?php else: ?>
                <?php foreach ($questions as $question): ?>
                    <div class="question-card">
                        <div class="question-header">
                            <span class="question-type"><?php echo htmlspecialchars($question['qtype']); ?></span>
                            <span class="question-category"><?php echo htmlspecialchars($question['category_name']); ?></span>
                        </div>

                        <h3 class="question-name">
                            <?php echo htmlspecialchars($question['name']); ?>
                        </h3>

                        <div class="question-text">
                            <?php
                            echo $questionService->formatQuestionText(
                                $question['questiontext'],
                                $question['questiontextformat']
                            );
                            ?>
                        </div>

                        <div class="question-footer">
                            <span class="question-mark">배점: <?php echo $question['defaultmark']; ?>점</span>
                            <span class="question-date">
                                생성일: <?php echo date('Y-m-d', $question['timecreated']); ?>
                            </span>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <!-- Pagination -->
        <?php if ($totalPages > 1): ?>
            <div class="pagination">
                <?php if ($page > 1): ?>
                    <a href="?page=<?php echo $page - 1; ?><?php echo $categoryId ? '&category=' . $categoryId : ''; ?>"
                       class="pagination-link">
                        ← 이전
                    </a>
                <?php endif; ?>

                <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                    <a href="?page=<?php echo $i; ?><?php echo $categoryId ? '&category=' . $categoryId : ''; ?>"
                       class="pagination-link <?php echo $i === $page ? 'active' : ''; ?>">
                        <?php echo $i; ?>
                    </a>
                <?php endfor; ?>

                <?php if ($page < $totalPages): ?>
                    <a href="?page=<?php echo $page + 1; ?><?php echo $categoryId ? '&category=' . $categoryId : ''; ?>"
                       class="pagination-link">
                        다음 →
                    </a>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php endif; ?>

        <footer>
            <p>
                Moodle 3.7 LMS 연동 시스템 |
                효율적인 캐싱으로 빠른 응답 속도 제공
            </p>
        </footer>
    </div>

    <script>
        function filterByCategory(categoryId) {
            const url = new URL(window.location);
            if (categoryId) {
                url.searchParams.set('category', categoryId);
            } else {
                url.searchParams.delete('category');
            }
            url.searchParams.set('page', '1'); // Reset to first page
            window.location = url;
        }
    </script>
</body>
</html>
