<?php
/**
 * Parabola Solver API
 * Solves quadratic inequalities and provides visualization data
 * ax^2 + bx + c {<, >, <=, >=} 0
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class ParabolaSolver {

    /**
     * Solve quadratic inequality
     * @param float $a - coefficient of x^2
     * @param float $b - coefficient of x
     * @param float $c - constant term
     * @param string $operator - inequality operator (<, >, <=, >=)
     * @return array
     */
    public function solve($a, $b, $c, $operator) {
        // Calculate discriminant
        $discriminant = $b * $b - 4 * $a * $c;

        // Find vertex
        $vertex_x = -$b / (2 * $a);
        $vertex_y = $a * $vertex_x * $vertex_x + $b * $vertex_x + $c;

        // Calculate roots
        $roots = [];
        if ($discriminant > 0) {
            $root1 = (-$b + sqrt($discriminant)) / (2 * $a);
            $root2 = (-$b - sqrt($discriminant)) / (2 * $a);
            $roots = [min($root1, $root2), max($root1, $root2)];
        } elseif ($discriminant == 0) {
            $roots = [-$b / (2 * $a)];
        }

        // Determine solution interval
        $solution = $this->determineSolution($a, $discriminant, $roots, $operator);

        // Generate parabola points for visualization
        $parabola_points = $this->generateParabolaPoints($a, $b, $c, $vertex_x);

        return [
            'coefficients' => [
                'a' => $a,
                'b' => $b,
                'c' => $c
            ],
            'vertex' => [
                'x' => $vertex_x,
                'y' => $vertex_y
            ],
            'discriminant' => $discriminant,
            'roots' => $roots,
            'operator' => $operator,
            'solution' => $solution,
            'parabola_points' => $parabola_points,
            'opens_upward' => $a > 0
        ];
    }

    /**
     * Determine solution intervals based on roots and operator
     * @param float $a
     * @param float $discriminant
     * @param array $roots
     * @param string $operator
     * @return array
     */
    private function determineSolution($a, $discriminant, $roots, $operator) {
        $solution = [
            'type' => '',
            'intervals' => [],
            'description' => ''
        ];

        // No real roots
        if ($discriminant < 0) {
            if (($a > 0 && ($operator === '<' || $operator === '<=')) ||
                ($a < 0 && ($operator === '>' || $operator === '>='))) {
                $solution['type'] = 'empty';
                $solution['description'] = '해가 없습니다 (공집합)';
            } else {
                $solution['type'] = 'all';
                $solution['intervals'] = [['start' => -INF, 'end' => INF]];
                $solution['description'] = '모든 실수';
            }
            return $solution;
        }

        // One root (discriminant = 0)
        if ($discriminant == 0) {
            $root = $roots[0];
            if ($operator === '<=' || $operator === '>=') {
                $solution['type'] = 'point';
                $solution['intervals'] = [['start' => $root, 'end' => $root]];
                $solution['description'] = "x = " . number_format($root, 2);
            } else {
                $solution['type'] = 'empty';
                $solution['description'] = '해가 없습니다 (공집합)';
            }
            return $solution;
        }

        // Two roots
        $r1 = $roots[0];
        $r2 = $roots[1];

        if ($a > 0) { // Parabola opens upward
            if ($operator === '<' || $operator === '<=') {
                $solution['type'] = 'interval';
                $solution['intervals'] = [['start' => $r1, 'end' => $r2, 'inclusive_start' => ($operator === '<='), 'inclusive_end' => ($operator === '<=')]];
                $bracket_left = ($operator === '<=') ? '[' : '(';
                $bracket_right = ($operator === '<=') ? ']' : ')';
                $solution['description'] = $bracket_left . number_format($r1, 2) . ', ' . number_format($r2, 2) . $bracket_right;
            } else { // > or >=
                $solution['type'] = 'union';
                $solution['intervals'] = [
                    ['start' => -INF, 'end' => $r1, 'inclusive_end' => ($operator === '>=')],
                    ['start' => $r2, 'end' => INF, 'inclusive_start' => ($operator === '>=')]
                ];
                $bracket_left = ($operator === '>=') ? ']' : ')';
                $bracket_right = ($operator === '>=') ? '[' : '(';
                $solution['description'] = '(-∞, ' . number_format($r1, 2) . $bracket_left . ' ∪ ' . $bracket_right . number_format($r2, 2) . ', ∞)';
            }
        } else { // Parabola opens downward (a < 0)
            if ($operator === '<' || $operator === '<=') {
                $solution['type'] = 'union';
                $solution['intervals'] = [
                    ['start' => -INF, 'end' => $r1, 'inclusive_end' => ($operator === '<=')],
                    ['start' => $r2, 'end' => INF, 'inclusive_start' => ($operator === '<=')]
                ];
                $bracket_left = ($operator === '<=') ? ']' : ')';
                $bracket_right = ($operator === '<=') ? '[' : '(';
                $solution['description'] = '(-∞, ' . number_format($r1, 2) . $bracket_left . ' ∪ ' . $bracket_right . number_format($r2, 2) . ', ∞)';
            } else { // > or >=
                $solution['type'] = 'interval';
                $solution['intervals'] = [['start' => $r1, 'end' => $r2, 'inclusive_start' => ($operator === '>='), 'inclusive_end' => ($operator === '>=')]];
                $bracket_left = ($operator === '>=') ? '[' : '(';
                $bracket_right = ($operator === '>=') ? ']' : ')';
                $solution['description'] = $bracket_left . number_format($r1, 2) . ', ' . number_format($r2, 2) . $bracket_right;
            }
        }

        return $solution;
    }

    /**
     * Generate parabola points for smooth visualization
     * @param float $a
     * @param float $b
     * @param float $c
     * @param float $vertex_x
     * @return array
     */
    private function generateParabolaPoints($a, $b, $c, $vertex_x) {
        $points = [];
        $range = 10; // Range around vertex
        $step = 0.1;

        $start_x = $vertex_x - $range;
        $end_x = $vertex_x + $range;

        for ($x = $start_x; $x <= $end_x; $x += $step) {
            $y = $a * $x * $x + $b * $x + $c;
            $points[] = [
                'x' => round($x, 2),
                'y' => round($y, 2)
            ];
        }

        return $points;
    }
}

// Handle API request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $a = isset($input['a']) ? floatval($input['a']) : 1;
    $b = isset($input['b']) ? floatval($input['b']) : 0;
    $c = isset($input['c']) ? floatval($input['c']) : 0;
    $operator = isset($input['operator']) ? $input['operator'] : '<';

    // Validate input
    if ($a == 0) {
        echo json_encode([
            'error' => true,
            'message' => 'a는 0이 될 수 없습니다 (2차 방정식이 아닙니다)'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if (!in_array($operator, ['<', '>', '<=', '>='])) {
        echo json_encode([
            'error' => true,
            'message' => '올바르지 않은 연산자입니다'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $solver = new ParabolaSolver();
    $result = $solver->solve($a, $b, $c, $operator);

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(405);
    echo json_encode([
        'error' => true,
        'message' => 'POST 요청만 허용됩니다'
    ], JSON_UNESCAPED_UNICODE);
}
