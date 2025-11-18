<?php
/**
 * Problems API Endpoint
 * GET /api/v1/problems/{id} - 문제 정보 조회
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../utils/IntegralCalculator.php';

// CORS 헤더는 config.php에서 설정됨
header('Content-Type: application/json; charset=utf-8');

// 요청 메서드 확인
$method = $_SERVER['REQUEST_METHOD'];

try {
    $problemModel = new Problem();

    switch ($method) {
        case 'GET':
            handleGet($problemModel);
            break;

        case 'POST':
            handlePost($problemModel);
            break;

        case 'PUT':
            handlePut($problemModel);
            break;

        case 'DELETE':
            handleDelete($problemModel);
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

/**
 * GET 요청 처리
 */
function handleGet($problemModel) {
    $path = $_SERVER['REQUEST_URI'];
    $pathParts = explode('/', trim($path, '/'));

    // /api/v1/problems/{id} 형식 파싱
    $problemIndex = array_search('problems', $pathParts);
    $problemId = isset($pathParts[$problemIndex + 1]) ? $pathParts[$problemIndex + 1] : null;

    if ($problemId && is_numeric($problemId)) {
        // 특정 문제 조회
        $problem = $problemModel->getById($problemId);

        if (!$problem) {
            sendError('Problem not found', 404);
        }

        // 응답 데이터 구성
        $response = [
            'id' => (int)$problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'function' => [
                'expression' => $problem['function_expr'],
                'latex' => $problem['latex_notation'] ?? 'f(x) = ' . $problem['function_expr'],
                'lower_bound' => (float)$problem['lower_bound'],
                'upper_bound' => (float)$problem['upper_bound'],
                'category' => $problem['category']
            ],
            'difficulty_level' => $problem['difficulty_level'],
            'character' => [
                'sprite' => $problem['character_sprite'],
                'start_position' => (float)$problem['lower_bound']
            ],
            'background' => $problem['background_image'],
            'colors' => [
                'graph' => $problem['graph_color'],
                'area' => $problem['area_color']
            ],
            'hints' => $problem['hints'],
            'settings' => [
                'max_attempts' => (int)$problem['max_attempts'],
                'time_limit_seconds' => (int)$problem['time_limit_seconds'],
                'tolerance' => (float)$problem['tolerance']
            ]
        ];

        sendSuccess($response);
    } else {
        // 문제 목록 조회
        $filters = [];

        if (isset($_GET['difficulty'])) {
            $filters['difficulty'] = $_GET['difficulty'];
        }
        if (isset($_GET['limit'])) {
            $filters['limit'] = (int)$_GET['limit'];
        }
        if (isset($_GET['created_by'])) {
            $filters['created_by'] = (int)$_GET['created_by'];
        }

        $problems = $problemModel->getAll($filters);

        $response = array_map(function($p) {
            return [
                'id' => (int)$p['id'],
                'title' => $p['title'],
                'function_expr' => $p['function_expr'],
                'difficulty_level' => $p['difficulty_level'],
                'bounds' => [(float)$p['lower_bound'], (float)$p['upper_bound']]
            ];
        }, $problems);

        sendSuccess($response, 'Problems retrieved successfully', ['total' => count($response)]);
    }
}

/**
 * POST 요청 처리 (문제 생성)
 */
function handlePost($problemModel) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendError('Invalid JSON input', 400);
    }

    // 필수 필드 검증
    $required = ['moodle_question_id', 'title', 'function_expr', 'lower_bound', 'upper_bound', 'correct_answer'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }

    try {
        $problemId = $problemModel->create($input);
        sendSuccess(['id' => $problemId], 'Problem created successfully', [], 201);
    } catch (Exception $e) {
        sendError('Failed to create problem: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT 요청 처리 (문제 수정)
 */
function handlePut($problemModel) {
    $path = $_SERVER['REQUEST_URI'];
    $pathParts = explode('/', trim($path, '/'));
    $problemIndex = array_search('problems', $pathParts);
    $problemId = isset($pathParts[$problemIndex + 1]) ? $pathParts[$problemIndex + 1] : null;

    if (!$problemId || !is_numeric($problemId)) {
        sendError('Problem ID required', 400);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendError('Invalid JSON input', 400);
    }

    try {
        $updated = $problemModel->update($problemId, $input);
        if ($updated) {
            sendSuccess(['updated' => true], 'Problem updated successfully');
        } else {
            sendError('Problem not found or no changes made', 404);
        }
    } catch (Exception $e) {
        sendError('Failed to update problem: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE 요청 처리 (문제 삭제)
 */
function handleDelete($problemModel) {
    $path = $_SERVER['REQUEST_URI'];
    $pathParts = explode('/', trim($path, '/'));
    $problemIndex = array_search('problems', $pathParts);
    $problemId = isset($pathParts[$problemIndex + 1]) ? $pathParts[$problemIndex + 1] : null;

    if (!$problemId || !is_numeric($problemId)) {
        sendError('Problem ID required', 400);
    }

    try {
        $deleted = $problemModel->delete($problemId);
        if ($deleted) {
            sendSuccess(['deleted' => true], 'Problem deleted successfully');
        } else {
            sendError('Problem not found', 404);
        }
    } catch (Exception $e) {
        sendError('Failed to delete problem: ' . $e->getMessage(), 500);
    }
}

/**
 * 성공 응답
 */
function sendSuccess($data, $message = 'Success', $meta = [], $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'meta' => $meta
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
