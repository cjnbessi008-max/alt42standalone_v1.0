<?php
/**
 * Edge Melody API Endpoint
 * RESTful API for Moodle LMS integration
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/questions.php';

// API 라우팅
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

try {
    $api = new QuestionsAPI();

    // GET /api/questions - 문제 목록 조회
    if ($requestMethod === 'GET' && preg_match('/\/questions$/', $requestUri)) {
        $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

        $questions = $api->getQuestions($categoryId, $limit);

        echo json_encode([
            'success' => true,
            'data' => $questions,
            'count' => count($questions)
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    // GET /api/questions/{id} - 특정 문제 조회
    elseif ($requestMethod === 'GET' && preg_match('/\/questions\/(\d+)$/', $requestUri, $matches)) {
        $questionId = (int)$matches[1];
        $question = $api->getQuestionById($questionId);

        if ($question) {
            echo json_encode([
                'success' => true,
                'data' => $question
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => '문제를 찾을 수 없습니다.'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    // GET /api/questions/{id}/edge-melody - Edge Melody 시각화 데이터
    elseif ($requestMethod === 'GET' && preg_match('/\/questions\/(\d+)\/edge-melody$/', $requestUri, $matches)) {
        $questionId = (int)$matches[1];
        $edgeMelodyData = $api->getQuestionForEdgeMelody($questionId);

        if ($edgeMelodyData) {
            echo json_encode([
                'success' => true,
                'data' => $edgeMelodyData
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => '문제를 찾을 수 없습니다.'
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    // GET /api/categories - 카테고리 목록
    elseif ($requestMethod === 'GET' && preg_match('/\/categories$/', $requestUri)) {
        $categories = $api->getCategories();

        echo json_encode([
            'success' => true,
            'data' => $categories,
            'count' => count($categories)
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    // 잘못된 엔드포인트
    else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'API 엔드포인트를 찾을 수 없습니다.',
            'available_endpoints' => [
                'GET /api/questions' => '문제 목록 조회',
                'GET /api/questions/{id}' => '특정 문제 조회',
                'GET /api/questions/{id}/edge-melody' => 'Edge Melody 시각화 데이터',
                'GET /api/categories' => '카테고리 목록'
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
