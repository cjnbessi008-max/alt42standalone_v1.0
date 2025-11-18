<?php
/**
 * Question Controller
 * Handle API requests for questions and Reverse Bloom logic
 */

require_once __DIR__ . '/../models/Question.php';
require_once __DIR__ . '/../lib/ReverseBloom.php';

class QuestionController {

    private $questionModel;

    public function __construct() {
        $this->questionModel = new Question();
    }

    /**
     * Get question with Reverse Bloom decomposition
     *
     * @param int $questionId
     * @return array
     */
    public function getQuestionWithBloom($questionId) {
        $question = $this->questionModel->getById($questionId);

        if (!$question) {
            return [
                'success' => false,
                'error' => 'Question not found'
            ];
        }

        // Clean question text
        $question['questiontext'] = Question::cleanText($question['questiontext']);

        // Initialize Reverse Bloom engine
        $bloom = new ReverseBloom($question);

        return [
            'success' => true,
            'question' => $question,
            'bloom' => [
                'currentStep' => $bloom->getCurrentStep(),
                'allSteps' => $bloom->getAllSteps(),
                'currentLevel' => $bloom->getCurrentStep()['level'],
                'progress' => $bloom->getProgress(),
                'isAtTop' => $bloom->isAtTop(),
                'isAtBottom' => $bloom->isAtBottom()
            ]
        ];
    }

    /**
     * Get random question
     *
     * @param int|null $categoryId
     * @return array
     */
    public function getRandomQuestion($categoryId = null) {
        if ($categoryId) {
            $question = $this->questionModel->getRandomByCategory($categoryId);
        } else {
            // Get random category first, then random question
            $categories = $this->questionModel->getCategories();
            if (empty($categories)) {
                return ['success' => false, 'error' => 'No categories found'];
            }
            $randomCategory = $categories[array_rand($categories)];
            $question = $this->questionModel->getRandomByCategory($randomCategory['id']);
        }

        if (!$question) {
            return ['success' => false, 'error' => 'No questions found'];
        }

        return $this->getQuestionWithBloom($question['id']);
    }

    /**
     * API endpoint handler
     */
    public function handleRequest() {
        header('Content-Type: application/json');

        $action = $_GET['action'] ?? '';
        $questionId = $_GET['question_id'] ?? null;
        $categoryId = $_GET['category_id'] ?? null;

        try {
            switch ($action) {
                case 'get':
                    if (!$questionId) {
                        throw new Exception('Question ID required');
                    }
                    $result = $this->getQuestionWithBloom($questionId);
                    break;

                case 'random':
                    $result = $this->getRandomQuestion($categoryId);
                    break;

                case 'categories':
                    $result = [
                        'success' => true,
                        'categories' => $this->questionModel->getCategories()
                    ];
                    break;

                case 'search':
                    $searchTerm = $_GET['q'] ?? '';
                    $result = [
                        'success' => true,
                        'questions' => $this->questionModel->search($searchTerm)
                    ];
                    break;

                default:
                    throw new Exception('Invalid action');
            }

            echo json_encode($result);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
