<?php
/**
 * Problem Handler API
 * Variable Dance 문제 관리 및 해집합 계산 API
 */

require_once __DIR__ . '/../config/config.php';

class ProblemHandler {
    private $db;

    public function __construct() {
        $this->db = getDBConnection();
    }

    /**
     * 문제 목록 가져오기
     */
    public function getAllProblems() {
        $stmt = $this->db->query("
            SELECT id, moodle_problem_id, problem_type, title, description,
                   equation, variables, difficulty_level, created_at
            FROM problems
            ORDER BY id ASC
        ");

        $problems = $stmt->fetchAll();

        // JSON 필드 디코딩
        foreach ($problems as &$problem) {
            $problem['equation'] = json_decode($problem['equation'], true);
            $problem['variables'] = json_decode($problem['variables'], true);
        }

        return $problems;
    }

    /**
     * 특정 문제 가져오기
     */
    public function getProblem($id) {
        $stmt = $this->db->prepare("
            SELECT * FROM problems WHERE id = ?
        ");
        $stmt->execute([$id]);
        $problem = $stmt->fetch();

        if (!$problem) {
            return null;
        }

        // JSON 필드 디코딩
        $problem['equation'] = json_decode($problem['equation'], true);
        $problem['variables'] = json_decode($problem['variables'], true);
        $problem['constraints'] = json_decode($problem['constraints'], true);
        $problem['solution_set'] = json_decode($problem['solution_set'], true);

        return $problem;
    }

    /**
     * 해집합 계산
     */
    public function calculateSolutionSet($problemId, $variableValues) {
        $problem = $this->getProblem($problemId);

        if (!$problem) {
            return null;
        }

        $type = $problem['problem_type'];
        $solutionDef = $problem['solution_set'];

        switch ($type) {
            case 'linear':
                return $this->solveLinear($variableValues, $solutionDef);

            case 'quadratic':
                return $this->solveQuadratic($variableValues, $solutionDef);

            case 'system':
                return $this->solveSystem($variableValues, $solutionDef);

            default:
                return null;
        }
    }

    /**
     * 일차방정식 해집합 계산: ax + b = 0
     */
    private function solveLinear($vars, $def) {
        $a = $vars['a'] ?? 1;
        $b = $vars['b'] ?? 0;

        if ($a == 0) {
            if ($b == 0) {
                return [
                    'type' => 'infinite',
                    'description' => '모든 실수',
                    'solutions' => null
                ];
            } else {
                return [
                    'type' => 'none',
                    'description' => '해가 없음',
                    'solutions' => []
                ];
            }
        }

        $x = -$b / $a;

        return [
            'type' => 'single',
            'description' => 'x = ' . round($x, 4),
            'solutions' => [round($x, 4)],
            'equation' => "{$a}x + {$b} = 0"
        ];
    }

    /**
     * 이차방정식 해집합 계산: ax^2 + bx + c = 0
     */
    private function solveQuadratic($vars, $def) {
        $a = $vars['a'] ?? 1;
        $b = $vars['b'] ?? 0;
        $c = $vars['c'] ?? 0;

        if ($a == 0) {
            // 일차방정식으로 변환
            return $this->solveLinear(['a' => $b, 'b' => $c], null);
        }

        $discriminant = $b * $b - 4 * $a * $c;

        if ($discriminant < 0) {
            return [
                'type' => 'complex',
                'description' => '실근이 없음 (허근)',
                'solutions' => [],
                'discriminant' => $discriminant,
                'equation' => "{$a}x² + {$b}x + {$c} = 0"
            ];
        } elseif ($discriminant == 0) {
            $x = -$b / (2 * $a);
            return [
                'type' => 'double',
                'description' => 'x = ' . round($x, 4) . ' (중근)',
                'solutions' => [round($x, 4)],
                'discriminant' => $discriminant,
                'equation' => "{$a}x² + {$b}x + {$c} = 0"
            ];
        } else {
            $x1 = (-$b + sqrt($discriminant)) / (2 * $a);
            $x2 = (-$b - sqrt($discriminant)) / (2 * $a);

            return [
                'type' => 'two_real',
                'description' => 'x₁ = ' . round($x1, 4) . ', x₂ = ' . round($x2, 4),
                'solutions' => [round($x1, 4), round($x2, 4)],
                'discriminant' => $discriminant,
                'equation' => "{$a}x² + {$b}x + {$c} = 0"
            ];
        }
    }

    /**
     * 연립방정식 해집합 계산
     */
    private function solveSystem($vars, $def) {
        $a1 = $vars['a1'] ?? 1;
        $b1 = $vars['b1'] ?? 1;
        $c1 = $vars['c1'] ?? 1;
        $a2 = $vars['a2'] ?? 1;
        $b2 = $vars['b2'] ?? 1;
        $c2 = $vars['c2'] ?? 1;

        $det = $a1 * $b2 - $a2 * $b1;

        if ($det == 0) {
            // 평행하거나 일치
            if ($a1 * $c2 == $a2 * $c1 && $b1 * $c2 == $b2 * $c1) {
                return [
                    'type' => 'infinite',
                    'description' => '무수히 많은 해 (두 직선이 일치)',
                    'solutions' => null
                ];
            } else {
                return [
                    'type' => 'none',
                    'description' => '해가 없음 (두 직선이 평행)',
                    'solutions' => []
                ];
            }
        }

        $x = ($c1 * $b2 - $c2 * $b1) / $det;
        $y = ($a1 * $c2 - $a2 * $c1) / $det;

        return [
            'type' => 'unique',
            'description' => 'x = ' . round($x, 4) . ', y = ' . round($y, 4),
            'solutions' => [
                'x' => round($x, 4),
                'y' => round($y, 4)
            ],
            'equations' => [
                "{$a1}x + {$b1}y = {$c1}",
                "{$a2}x + {$b2}y = {$c2}"
            ]
        ];
    }

    /**
     * 학습 세션 생성
     */
    public function createSession($studentId, $problemId) {
        $stmt = $this->db->prepare("
            INSERT INTO learning_sessions (student_id, problem_id)
            VALUES (?, ?)
        ");
        $stmt->execute([$studentId, $problemId]);

        return $this->db->lastInsertId();
    }

    /**
     * 변수 이동 이벤트 기록
     */
    public function logVariableEvent($sessionId, $variableName, $oldValue, $newValue, $solutionBefore, $solutionAfter) {
        $stmt = $this->db->prepare("
            INSERT INTO variable_events
            (session_id, variable_name, old_value, new_value, solution_set_before, solution_set_after)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $sessionId,
            $variableName,
            $oldValue,
            $newValue,
            json_encode($solutionBefore, JSON_UNESCAPED_UNICODE),
            json_encode($solutionAfter, JSON_UNESCAPED_UNICODE)
        ]);

        return true;
    }

    /**
     * 세션 완료
     */
    public function completeSession($sessionId, $score) {
        $stmt = $this->db->prepare("
            UPDATE learning_sessions
            SET status = 'completed', completed_at = NOW(), score = ?
            WHERE id = ?
        ");

        return $stmt->execute([$score, $sessionId]);
    }
}

// API 엔드포인트 처리
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$handler = new ProblemHandler();

try {
    switch ($action) {
        case 'get_all_problems':
            $problems = $handler->getAllProblems();
            successResponse($problems, 'Problems fetched successfully');
            break;

        case 'get_problem':
            $id = $_GET['id'] ?? null;

            if (!$id) {
                errorResponse('Problem ID is required', 400);
            }

            $problem = $handler->getProblem($id);

            if ($problem) {
                successResponse($problem, 'Problem fetched successfully');
            } else {
                errorResponse('Problem not found', 404);
            }
            break;

        case 'calculate_solution':
            if ($method !== 'POST') {
                errorResponse('POST method required', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $problemId = $data['problem_id'] ?? null;
            $variables = $data['variables'] ?? null;

            if (!$problemId || !$variables) {
                errorResponse('Problem ID and variables are required', 400);
            }

            $solution = $handler->calculateSolutionSet($problemId, $variables);

            if ($solution) {
                successResponse($solution, 'Solution calculated successfully');
            } else {
                errorResponse('Failed to calculate solution', 500);
            }
            break;

        case 'create_session':
            if ($method !== 'POST') {
                errorResponse('POST method required', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $studentId = $data['student_id'] ?? null;
            $problemId = $data['problem_id'] ?? null;

            if (!$studentId || !$problemId) {
                errorResponse('Student ID and Problem ID are required', 400);
            }

            $sessionId = $handler->createSession($studentId, $problemId);

            successResponse(['session_id' => $sessionId], 'Session created successfully');
            break;

        case 'log_event':
            if ($method !== 'POST') {
                errorResponse('POST method required', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $sessionId = $data['session_id'] ?? null;
            $variableName = $data['variable_name'] ?? null;
            $oldValue = $data['old_value'] ?? null;
            $newValue = $data['new_value'] ?? null;
            $solutionBefore = $data['solution_before'] ?? null;
            $solutionAfter = $data['solution_after'] ?? null;

            if (!$sessionId || !$variableName) {
                errorResponse('Session ID and variable name are required', 400);
            }

            $result = $handler->logVariableEvent(
                $sessionId, $variableName, $oldValue, $newValue,
                $solutionBefore, $solutionAfter
            );

            successResponse(['logged' => $result], 'Event logged successfully');
            break;

        case 'complete_session':
            if ($method !== 'POST') {
                errorResponse('POST method required', 405);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $sessionId = $data['session_id'] ?? null;
            $score = $data['score'] ?? 0;

            if (!$sessionId) {
                errorResponse('Session ID is required', 400);
            }

            $result = $handler->completeSession($sessionId, $score);

            successResponse(['completed' => $result], 'Session completed successfully');
            break;

        default:
            errorResponse('Invalid action', 400);
    }
} catch (Exception $e) {
    logEvent("Exception in problem-handler: " . $e->getMessage(), 'ERROR');
    errorResponse('Internal server error: ' . $e->getMessage(), 500);
}
