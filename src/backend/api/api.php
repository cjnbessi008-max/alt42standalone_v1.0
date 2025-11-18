<?php
/**
 * REST API 엔드포인트
 * 개념-문제 매칭 시스템 API
 */

require_once __DIR__ . '/../../../config/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 요청 파싱
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathInfo = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($pathInfo, '/'));

// API 경로에서 'api.php' 제거
$apiIndex = array_search('api.php', $pathParts);
if ($apiIndex !== false) {
    $pathParts = array_slice($pathParts, $apiIndex + 1);
}

$resource = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;
$action = $pathParts[2] ?? null;

// 요청 바디 파싱
$requestBody = file_get_contents('php://input');
$requestData = json_decode($requestBody, true) ?? [];

// 쿼리 파라미터
$queryParams = $_GET;

// 응답 함수
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function sendError($message, $statusCode = 400) {
    sendResponse(['error' => $message, 'success' => false], $statusCode);
}

try {
    $model = new ConceptProblemModel();
    $moodle = new MoodleIntegration();

    // 라우팅
    switch ($resource) {
        case 'concepts':
            handleConcepts($model, $requestMethod, $id, $action, $queryParams);
            break;

        case 'problems':
            handleProblems($model, $requestMethod, $id, $action, $queryParams);
            break;

        case 'graph':
            handleGraph($model, $requestMethod, $queryParams);
            break;

        case 'progress':
            handleProgress($model, $requestMethod, $id, $queryParams);
            break;

        case 'sync':
            handleSync($moodle, $requestMethod, $action, $requestData);
            break;

        case 'recommendations':
            handleRecommendations($model, $requestMethod, $id, $queryParams);
            break;

        default:
            sendError('Invalid endpoint', 404);
    }

} catch (Exception $e) {
    Logger::error("API Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * 개념 관련 처리
 */
function handleConcepts($model, $method, $id, $action, $params) {
    if ($method === 'GET') {
        if ($id && $action === 'problems') {
            // GET /concepts/{id}/problems
            $includeRelated = isset($params['include_related']) && $params['include_related'] === 'true';
            $problems = $model->getProblemsByConcept($id, $includeRelated);
            sendResponse(['success' => true, 'data' => $problems]);

        } elseif ($id) {
            // GET /concepts/{id}
            $concept = $model->getConceptById($id);
            if ($concept) {
                sendResponse(['success' => true, 'data' => $concept]);
            } else {
                sendError('Concept not found', 404);
            }

        } else {
            // GET /concepts
            $concepts = $model->getAllConcepts($params);
            sendResponse(['success' => true, 'data' => $concepts, 'count' => count($concepts)]);
        }
    } else {
        sendError('Method not allowed', 405);
    }
}

/**
 * 문제 관련 처리
 */
function handleProblems($model, $method, $id, $action, $params) {
    if ($method === 'GET') {
        if ($id && $action === 'concepts') {
            // GET /problems/{id}/concepts
            $concepts = $model->getConceptsByProblem($id);
            sendResponse(['success' => true, 'data' => $concepts]);

        } elseif ($id) {
            // GET /problems/{id}
            $problems = $model->getAllProblems(['concept_id' => $id]);
            sendResponse(['success' => true, 'data' => $problems]);

        } else {
            // GET /problems
            $problems = $model->getAllProblems($params);
            sendResponse(['success' => true, 'data' => $problems, 'count' => count($problems)]);
        }
    } else {
        sendError('Method not allowed', 405);
    }
}

/**
 * 그래프 데이터 처리
 */
function handleGraph($model, $method, $params) {
    if ($method === 'GET') {
        $graphData = $model->getConceptProblemGraph($params);
        sendResponse(['success' => true, 'data' => $graphData]);
    } else {
        sendError('Method not allowed', 405);
    }
}

/**
 * 학생 진도 처리
 */
function handleProgress($model, $method, $studentId, $params) {
    if ($method === 'GET') {
        if (!$studentId) {
            sendError('Student ID required', 400);
        }

        $conceptId = $params['concept_id'] ?? null;
        $progress = $model->getStudentProgress($studentId, $conceptId);
        $stats = $model->getConceptMasteryStats($studentId);

        sendResponse([
            'success' => true,
            'data' => [
                'progress' => $progress,
                'statistics' => $stats
            ]
        ]);
    } else {
        sendError('Method not allowed', 405);
    }
}

/**
 * Moodle 동기화 처리
 */
function handleSync($moodle, $method, $action, $data) {
    if ($method === 'POST') {
        switch ($action) {
            case 'concepts':
                $result = $moodle->syncConceptsFromCategories();
                sendResponse($result);
                break;

            case 'problems':
                $result = $moodle->syncProblemsFromQuestions();
                sendResponse($result);
                break;

            case 'progress':
                if (!isset($data['student_id'])) {
                    sendError('Student ID required', 400);
                }
                $result = $moodle->syncStudentProgress($data['student_id']);
                sendResponse($result);
                break;

            case 'all':
                $results = [
                    'concepts' => $moodle->syncConceptsFromCategories(),
                    'problems' => $moodle->syncProblemsFromQuestions()
                ];
                sendResponse(['success' => true, 'data' => $results]);
                break;

            default:
                sendError('Invalid sync action', 400);
        }
    } else {
        sendError('Method not allowed', 405);
    }
}

/**
 * 문제 추천 처리
 */
function handleRecommendations($model, $method, $studentId, $params) {
    if ($method === 'GET') {
        if (!$studentId) {
            sendError('Student ID required', 400);
        }

        $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
        $recommendations = $model->getRecommendedProblems($studentId, $limit);

        sendResponse([
            'success' => true,
            'data' => $recommendations,
            'count' => count($recommendations)
        ]);
    } else {
        sendError('Method not allowed', 405);
    }
}
