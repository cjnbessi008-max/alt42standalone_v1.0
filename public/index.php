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
use MoodleIntegration\Services\DuplicateBarrierService;

try {
    // Initialize services
    $db = Connection::getInstance($config);
    $cache = new CacheService($config);
    $questionService = new QuestionService($db, $cache, $config);
    $barrierService = new DuplicateBarrierService($db, $config);

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
                    <div class="question-card" data-question-id="<?php echo $question['id']; ?>">
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

    <!-- Virtual Smartphone Screen -->
    <div class="virtual-phone" id="virtualPhone">
        <div class="phone-screen">
            <div class="phone-header">
                📱 LMS 문제 뷰어
            </div>
            <div class="phone-content" id="phoneContent">
                <div class="phone-loading">
                    문제를 클릭하면 여기에 표시됩니다
                </div>
            </div>
        </div>

        <!-- Duplicate Barrier Overlay -->
        <div class="duplicate-barrier" id="duplicateBarrier">
            <div class="barrier-content">
                <div class="barrier-icon">🚫</div>
                <div class="barrier-title">중복 차단!</div>
                <div class="barrier-message">이미 확인한 문제입니다</div>
            </div>
        </div>
    </div>

    <button class="phone-toggle" id="phoneToggle" onclick="togglePhone()">
        📱 스마트폰 뷰
    </button>

    <script>
        // Duplicate barrier service
        const DuplicateBarrier = {
            viewedQuestions: new Set(),

            // Initialize from server-side data
            init: function() {
                <?php
                $viewedQuestions = $barrierService->getViewedQuestions();
                if (!empty($viewedQuestions)) {
                    echo "this.viewedQuestions = new Set([" . implode(',', array_keys($viewedQuestions)) . "]);";
                }
                ?>
            },

            // Check if question is duplicate
            isDuplicate: function(questionId) {
                return this.viewedQuestions.has(questionId);
            },

            // Mark question as viewed
            markViewed: function(questionId) {
                this.viewedQuestions.add(questionId);

                // Send to server
                fetch('api.php?action=mark_viewed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question_id: questionId })
                }).catch(err => console.error('Failed to mark viewed:', err));
            },

            // Show barrier animation
            showBarrier: function(viewCount = 1) {
                const barrier = document.getElementById('duplicateBarrier');
                const message = barrier.querySelector('.barrier-message');

                if (viewCount > 1) {
                    message.textContent = `이미 ${viewCount}번 확인한 문제입니다!`;
                } else {
                    message.textContent = '이미 확인한 문제입니다';
                }

                barrier.classList.add('active');

                setTimeout(() => {
                    barrier.classList.remove('active');
                }, 2000);
            },

            // Load question to phone
            loadQuestion: function(questionData) {
                const questionId = questionData.id;

                // Check for duplicate
                if (this.isDuplicate(questionId)) {
                    this.showBarrier(2); // Show barrier with count
                    return false;
                }

                // Display question in phone
                const phoneContent = document.getElementById('phoneContent');
                phoneContent.innerHTML = `
                    <div class="phone-question">
                        <div class="phone-question-title">
                            ${this.escapeHtml(questionData.name)}
                        </div>
                        <div class="phone-question-text">
                            ${questionData.text}
                        </div>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6; font-size: 0.75em; color: #6c757d;">
                            유형: ${this.escapeHtml(questionData.type)} | 배점: ${questionData.mark}점
                        </div>
                    </div>
                `;

                // Mark as viewed
                this.markViewed(questionId);

                // Scroll phone to top
                phoneContent.scrollTop = 0;

                return true;
            },

            // Helper: Escape HTML
            escapeHtml: function(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },

            // Clear all viewed
            clearViewed: function() {
                this.viewedQuestions.clear();
                fetch('api.php?action=clear_viewed', { method: 'POST' })
                    .catch(err => console.error('Failed to clear viewed:', err));
            }
        };

        // Initialize on page load
        DuplicateBarrier.init();

        // Make question cards clickable
        document.addEventListener('DOMContentLoaded', function() {
            const questionCards = document.querySelectorAll('.question-card');

            questionCards.forEach(card => {
                card.style.cursor = 'pointer';

                card.addEventListener('click', function() {
                    const questionData = {
                        id: parseInt(this.dataset.questionId),
                        name: this.querySelector('.question-name').textContent.trim(),
                        text: this.querySelector('.question-text').innerHTML,
                        type: this.querySelector('.question-type').textContent.trim(),
                        mark: this.querySelector('.question-mark').textContent.match(/\d+/)[0]
                    };

                    DuplicateBarrier.loadQuestion(questionData);
                });
            });
        });

        // Category filter
        function filterByCategory(categoryId) {
            const url = new URL(window.location);
            if (categoryId) {
                url.searchParams.set('category', categoryId);
            } else {
                url.searchParams.delete('category');
            }
            url.searchParams.set('page', '1');
            window.location = url;
        }

        // Toggle phone visibility
        function togglePhone() {
            const phone = document.getElementById('virtualPhone');
            phone.classList.toggle('minimized');

            const btn = document.getElementById('phoneToggle');
            if (phone.classList.contains('minimized')) {
                btn.textContent = '📱 펼치기';
            } else {
                btn.textContent = '📱 스마트폰 뷰';
            }
        }
    </script>
</body>
</html>
