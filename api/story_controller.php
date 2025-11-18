<?php
/**
 * Story Controller API
 * 스토리 모드 진행 관리 API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');

// CORS 처리
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 요청 메소드 및 경로 파싱
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// JSON 입력 파싱
$input = json_decode(file_get_contents('php://input'), true);

// 라우팅
try {
    switch ($method) {
        case 'GET':
            handleGet($pathParts, $_GET);
            break;
        case 'POST':
            handlePost($pathParts, $input);
            break;
        case 'PUT':
            handlePut($pathParts, $input);
            break;
        case 'DELETE':
            handleDelete($pathParts, $input);
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
function handleGet($pathParts, $query) {
    $action = $pathParts[count($pathParts) - 1] ?? '';

    switch ($action) {
        case 'scenarios':
            // 모든 스토리 시나리오 목록
            getScenarios($query);
            break;

        case 'scenario':
            // 특정 스토리 시나리오 상세
            $scenarioId = $query['id'] ?? null;
            if (!$scenarioId) {
                sendError('Scenario ID required', 400);
            }
            getScenario($scenarioId);
            break;

        case 'steps':
            // 시나리오의 모든 단계
            $scenarioId = $query['scenario_id'] ?? null;
            if (!$scenarioId) {
                sendError('Scenario ID required', 400);
            }
            getSteps($scenarioId);
            break;

        case 'step':
            // 특정 단계 상세
            $stepId = $query['id'] ?? null;
            if (!$stepId) {
                sendError('Step ID required', 400);
            }
            getStep($stepId);
            break;

        case 'progress':
            // 학생 진행 상황
            $studentId = $query['student_id'] ?? null;
            $scenarioId = $query['scenario_id'] ?? null;
            if (!$studentId) {
                sendError('Student ID required', 400);
            }
            getProgress($studentId, $scenarioId);
            break;

        case 'concepts':
            // 통계 개념 목록
            getConcepts($query);
            break;

        default:
            sendError('Invalid endpoint', 404);
    }
}

/**
 * POST 요청 처리
 */
function handlePost($pathParts, $input) {
    $action = $pathParts[count($pathParts) - 1] ?? '';

    switch ($action) {
        case 'start':
            // 스토리 시작
            startStory($input);
            break;

        case 'submit_answer':
            // 답안 제출
            submitAnswer($input);
            break;

        case 'next_step':
            // 다음 단계로 이동
            nextStep($input);
            break;

        case 'use_hint':
            // 힌트 사용
            useHint($input);
            break;

        default:
            sendError('Invalid endpoint', 404);
    }
}

/**
 * PUT 요청 처리
 */
function handlePut($pathParts, $input) {
    $action = $pathParts[count($pathParts) - 1] ?? '';

    switch ($action) {
        case 'update_progress':
            // 진행 상황 업데이트
            updateProgress($input);
            break;

        default:
            sendError('Invalid endpoint', 404);
    }
}

/**
 * DELETE 요청 처리
 */
function handleDelete($pathParts, $input) {
    sendError('Delete method not implemented', 501);
}

// ============ API 함수 구현 ============

/**
 * 스토리 시나리오 목록 가져오기
 */
function getScenarios($query) {
    $difficulty = $query['difficulty'] ?? null;
    $concept = $query['concept'] ?? null;
    $grade = $query['grade'] ?? null;

    $sql = "SELECT * FROM story_scenarios WHERE is_active = 1";
    $params = [];

    if ($difficulty) {
        $sql .= " AND difficulty_level = ?";
        $params[] = $difficulty;
    }

    if ($concept) {
        $sql .= " AND stat_concept = ?";
        $params[] = $concept;
    }

    if ($grade) {
        $sql .= " AND target_grade = ?";
        $params[] = $grade;
    }

    $sql .= " ORDER BY difficulty_level, id";

    $scenarios = fetchAll($sql, $params);
    sendSuccess($scenarios);
}

/**
 * 특정 스토리 시나리오 가져오기
 */
function getScenario($scenarioId) {
    $sql = "SELECT * FROM story_scenarios WHERE id = ? AND is_active = 1";
    $scenario = fetchOne($sql, [$scenarioId]);

    if (!$scenario) {
        sendError('Scenario not found', 404);
    }

    // JSON 컬럼 디코딩
    if (isset($scenario['story_content'])) {
        $scenario['story_content'] = json_decode($scenario['story_content'], true);
    }

    sendSuccess($scenario);
}

/**
 * 시나리오의 모든 단계 가져오기
 */
function getSteps($scenarioId) {
    $sql = "SELECT * FROM story_steps WHERE scenario_id = ? ORDER BY step_order";
    $steps = fetchAll($sql, [$scenarioId]);

    // JSON 컬럼 디코딩
    foreach ($steps as &$step) {
        if (isset($step['question_data'])) {
            $step['question_data'] = json_decode($step['question_data'], true);
        }
    }

    sendSuccess($steps);
}

/**
 * 특정 단계 가져오기
 */
function getStep($stepId) {
    $sql = "SELECT * FROM story_steps WHERE id = ?";
    $step = fetchOne($sql, [$stepId]);

    if (!$step) {
        sendError('Step not found', 404);
    }

    // JSON 컬럼 디코딩
    if (isset($step['question_data'])) {
        $step['question_data'] = json_decode($step['question_data'], true);
    }

    sendSuccess($step);
}

/**
 * 학생 진행 상황 가져오기
 */
function getProgress($studentId, $scenarioId = null) {
    if ($scenarioId) {
        // 특정 시나리오의 진행 상황
        $sql = "SELECT * FROM student_progress WHERE student_id = ? AND scenario_id = ?";
        $progress = fetchOne($sql, [$studentId, $scenarioId]);

        if ($progress && isset($progress['completed_steps'])) {
            $progress['completed_steps'] = json_decode($progress['completed_steps'], true);
        }

        sendSuccess($progress ?: ['message' => 'No progress found']);
    } else {
        // 모든 진행 상황
        $sql = "SELECT sp.*, ss.title, ss.stat_concept
                FROM student_progress sp
                JOIN story_scenarios ss ON sp.scenario_id = ss.id
                WHERE sp.student_id = ?
                ORDER BY sp.last_activity DESC";
        $progressList = fetchAll($sql, [$studentId]);

        foreach ($progressList as &$progress) {
            if (isset($progress['completed_steps'])) {
                $progress['completed_steps'] = json_decode($progress['completed_steps'], true);
            }
        }

        sendSuccess($progressList);
    }
}

/**
 * 통계 개념 목록 가져오기
 */
function getConcepts($query) {
    $category = $query['category'] ?? null;

    $sql = "SELECT * FROM stat_concepts";
    $params = [];

    if ($category) {
        $sql .= " WHERE category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY difficulty, id";

    $concepts = fetchAll($sql, $params);

    foreach ($concepts as &$concept) {
        if (isset($concept['prerequisite_concepts'])) {
            $concept['prerequisite_concepts'] = json_decode($concept['prerequisite_concepts'], true);
        }
    }

    sendSuccess($concepts);
}

/**
 * 스토리 시작
 */
function startStory($input) {
    $studentId = $input['student_id'] ?? null;
    $scenarioId = $input['scenario_id'] ?? null;

    if (!$studentId || !$scenarioId) {
        sendError('Student ID and Scenario ID required', 400);
    }

    // 기존 진행 상황 확인
    $existingProgress = fetchOne(
        "SELECT * FROM student_progress WHERE student_id = ? AND scenario_id = ?",
        [$studentId, $scenarioId]
    );

    if ($existingProgress) {
        // 이미 시작한 스토리 - 현재 진행 상황 반환
        if (isset($existingProgress['completed_steps'])) {
            $existingProgress['completed_steps'] = json_decode($existingProgress['completed_steps'], true);
        }
        sendSuccess([
            'message' => 'Story already started',
            'progress' => $existingProgress
        ]);
        return;
    }

    // 첫 번째 단계 가져오기
    $firstStep = fetchOne(
        "SELECT id FROM story_steps WHERE scenario_id = ? ORDER BY step_order LIMIT 1",
        [$scenarioId]
    );

    if (!$firstStep) {
        sendError('No steps found for this scenario', 404);
    }

    // 새로운 진행 상황 생성
    $sql = "INSERT INTO student_progress
            (student_id, scenario_id, current_step_id, completed_steps, start_time)
            VALUES (?, ?, ?, ?, NOW())";

    $progressId = insertAndGetId($sql, [
        $studentId,
        $scenarioId,
        $firstStep['id'],
        json_encode([])
    ]);

    if (!$progressId) {
        sendError('Failed to start story', 500);
    }

    // Moodle에 로그 기록
    logToMoodle($scenarioId, $studentId, 'story_started', "Scenario: {$scenarioId}");

    sendSuccess([
        'message' => 'Story started successfully',
        'progress_id' => $progressId,
        'current_step_id' => $firstStep['id']
    ]);
}

/**
 * 답안 제출
 */
function submitAnswer($input) {
    $progressId = $input['progress_id'] ?? null;
    $stepId = $input['step_id'] ?? null;
    $answer = $input['answer'] ?? null;
    $timeSpent = $input['time_spent'] ?? 0;

    if (!$progressId || !$stepId || $answer === null) {
        sendError('Progress ID, Step ID, and Answer required', 400);
    }

    // 진행 상황 가져오기
    $progress = fetchOne("SELECT * FROM student_progress WHERE id = ?", [$progressId]);
    if (!$progress) {
        sendError('Progress not found', 404);
    }

    // 단계 정보 가져오기
    $step = fetchOne("SELECT * FROM story_steps WHERE id = ?", [$stepId]);
    if (!$step) {
        sendError('Step not found', 404);
    }

    $questionData = json_decode($step['question_data'], true);
    if (!$questionData) {
        sendError('No question data found', 400);
    }

    // 정답 확인
    $isCorrect = checkAnswer($answer, $questionData);

    // 기존 시도 횟수 확인
    $attemptNumber = fetchOne(
        "SELECT COUNT(*) as count FROM student_answers WHERE progress_id = ? AND step_id = ?",
        [$progressId, $stepId]
    )['count'] + 1;

    // 답안 기록
    $sql = "INSERT INTO student_answers
            (progress_id, step_id, student_answer, is_correct, attempt_number, time_spent)
            VALUES (?, ?, ?, ?, ?, ?)";

    executeQuery($sql, [
        $progressId,
        $stepId,
        json_encode($answer),
        $isCorrect ? 1 : 0,
        $attemptNumber,
        $timeSpent
    ]);

    // 진행 상황 업데이트
    if ($isCorrect) {
        $sql = "UPDATE student_progress
                SET total_attempts = total_attempts + 1,
                    correct_answers = correct_answers + 1,
                    score = score + ?
                WHERE id = ?";
        executeQuery($sql, [calculateScore($questionData, $attemptNumber), $progressId]);
    } else {
        $sql = "UPDATE student_progress
                SET total_attempts = total_attempts + 1
                WHERE id = ?";
        executeQuery($sql, [$progressId]);
    }

    // Moodle에 기록
    logToMoodle($progress['scenario_id'], $progress['student_id'], 'answer_submitted',
                "Step: {$stepId}, Correct: " . ($isCorrect ? 'Yes' : 'No'));

    sendSuccess([
        'is_correct' => $isCorrect,
        'attempt_number' => $attemptNumber,
        'explanation' => $questionData['explanation'] ?? null,
        'can_retry' => !$isCorrect && $attemptNumber < 3
    ]);
}

/**
 * 다음 단계로 이동
 */
function nextStep($input) {
    $progressId = $input['progress_id'] ?? null;

    if (!$progressId) {
        sendError('Progress ID required', 400);
    }

    $progress = fetchOne("SELECT * FROM student_progress WHERE id = ?", [$progressId]);
    if (!$progress) {
        sendError('Progress not found', 404);
    }

    $currentStep = fetchOne("SELECT * FROM story_steps WHERE id = ?", [$progress['current_step_id']]);

    // 다음 단계 찾기
    $nextStepId = $currentStep['next_step_id'];

    if (!$nextStepId) {
        // 자동으로 다음 순서 단계 찾기
        $nextStep = fetchOne(
            "SELECT id FROM story_steps
             WHERE scenario_id = ? AND step_order > ?
             ORDER BY step_order LIMIT 1",
            [$progress['scenario_id'], $currentStep['step_order']]
        );

        $nextStepId = $nextStep ? $nextStep['id'] : null;
    }

    if (!$nextStepId) {
        // 마지막 단계 - 완료 처리
        $sql = "UPDATE student_progress
                SET is_completed = 1, completion_time = NOW()
                WHERE id = ?";
        executeQuery($sql, [$progressId]);

        // Moodle에 완료 기록
        logToMoodle($progress['scenario_id'], $progress['student_id'], 'story_completed',
                    "Score: {$progress['score']}");

        sendSuccess([
            'completed' => true,
            'message' => 'Story completed!',
            'final_score' => $progress['score']
        ]);
        return;
    }

    // 완료한 단계 목록 업데이트
    $completedSteps = json_decode($progress['completed_steps'], true) ?: [];
    $completedSteps[] = (int)$progress['current_step_id'];

    $sql = "UPDATE student_progress
            SET current_step_id = ?, completed_steps = ?
            WHERE id = ?";
    executeQuery($sql, [$nextStepId, json_encode($completedSteps), $progressId]);

    sendSuccess([
        'next_step_id' => $nextStepId,
        'completed_steps' => $completedSteps
    ]);
}

/**
 * 힌트 사용
 */
function useHint($input) {
    $progressId = $input['progress_id'] ?? null;
    $stepId = $input['step_id'] ?? null;

    if (!$progressId || !$stepId) {
        sendError('Progress ID and Step ID required', 400);
    }

    $step = fetchOne("SELECT * FROM story_steps WHERE id = ?", [$stepId]);
    if (!$step) {
        sendError('Step not found', 404);
    }

    $hint = $step['hint_text'];
    $questionData = json_decode($step['question_data'], true);

    if (!$hint && isset($questionData['hint'])) {
        $hint = $questionData['hint'];
    }

    // 힌트 사용 기록
    $sql = "UPDATE student_answers
            SET hint_used = 1
            WHERE progress_id = ? AND step_id = ?
            ORDER BY id DESC LIMIT 1";
    executeQuery($sql, [$progressId, $stepId]);

    sendSuccess([
        'hint' => $hint ?: '힌트가 없습니다.'
    ]);
}

/**
 * 진행 상황 업데이트
 */
function updateProgress($input) {
    $progressId = $input['progress_id'] ?? null;
    $updates = $input['updates'] ?? [];

    if (!$progressId || empty($updates)) {
        sendError('Progress ID and updates required', 400);
    }

    $allowedFields = ['current_step_id', 'score'];
    $sql = "UPDATE student_progress SET ";
    $params = [];

    foreach ($updates as $field => $value) {
        if (in_array($field, $allowedFields)) {
            $sql .= "$field = ?, ";
            $params[] = $value;
        }
    }

    $sql = rtrim($sql, ', ') . " WHERE id = ?";
    $params[] = $progressId;

    executeQuery($sql, $params);

    sendSuccess(['message' => 'Progress updated']);
}

// ============ 헬퍼 함수 ============

/**
 * 답안 정답 확인
 */
function checkAnswer($answer, $questionData) {
    $questionType = $questionData['question_type'] ?? 'calculation';

    switch ($questionType) {
        case 'calculation':
            $correctAnswer = $questionData['answer'];
            $tolerance = $questionData['tolerance'] ?? 0;
            return abs($answer - $correctAnswer) <= $tolerance;

        case 'multiple_choice':
            $correctAnswer = $questionData['correct_answer'];
            return $answer == $correctAnswer;

        case 'text':
            $correctAnswer = strtolower(trim($questionData['answer']));
            $userAnswer = strtolower(trim($answer));
            return $correctAnswer === $userAnswer;

        default:
            return false;
    }
}

/**
 * 점수 계산
 */
function calculateScore($questionData, $attemptNumber) {
    $baseScore = 10;

    // 시도 횟수에 따라 점수 감소
    $penalty = ($attemptNumber - 1) * 2;
    $score = max(1, $baseScore - $penalty);

    return $score;
}
