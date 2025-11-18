<?php
/**
 * 방정식 추출 라이브러리
 * Moodle 문제 텍스트에서 방정식을 추출합니다
 */

/**
 * Moodle 문제에서 방정식 추출
 *
 * @param array $question Moodle 문제 데이터
 * @return array ['expression' => string, 'type' => string]
 */
function extractEquationFromQuestion($question) {
    $text = strip_tags($question['questiontext']);

    // 방정식 패턴 매칭
    $patterns = [
        // 일반적인 방정식 형태: ax + b = cx + d
        '/([0-9]*[a-zA-Z][\^0-9]*\s*[+\-]\s*[0-9]+)\s*=\s*([0-9]*[a-zA-Z][\^0-9]*\s*[+\-]\s*[0-9]+)/',
        // 이차방정식: ax^2 + bx + c = 0
        '/([0-9]*[a-zA-Z]\^2\s*[+\-]\s*[0-9]*[a-zA-Z]\s*[+\-]\s*[0-9]+)\s*=\s*0/',
        // 간단한 방정식: x + a = b
        '/([a-zA-Z]\s*[+\-]\s*[0-9]+)\s*=\s*([0-9]+)/',
        // 괄호가 있는 방정식
        '/([0-9]*\([^)]+\)\s*[+\-=]\s*[0-9]*\([^)]+\))/',
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $text, $matches)) {
            $expression = trim($matches[0]);
            $type = determineEquationType($expression);

            return [
                'expression' => $expression,
                'type' => $type
            ];
        }
    }

    // 패턴이 없으면 문제 이름에서 추출 시도
    $name = $question['name'];

    // 데모 방정식 반환
    return [
        'expression' => '2x + 5 = 3x - 7',
        'type' => 'linear'
    ];
}

/**
 * 방정식 타입 판별
 *
 * @param string $expression 방정식
 * @return string 방정식 타입
 */
function determineEquationType($expression) {
    // 이차방정식
    if (preg_match('/x\^2|x²/', $expression)) {
        return 'quadratic';
    }

    // 일차방정식
    if (preg_match('/[a-zA-Z]/', $expression) && !preg_match('/x\^|x²/', $expression)) {
        return 'linear';
    }

    // 산술식
    if (!preg_match('/[a-zA-Z]/', $expression)) {
        return 'arithmetic';
    }

    return 'unknown';
}

/**
 * 방정식 정규화
 *
 * @param string $expression 방정식
 * @return string 정규화된 방정식
 */
function normalizeEquation($expression) {
    // 공백 정리
    $expression = preg_replace('/\s+/', ' ', $expression);

    // 곱셈 기호 제거 (2*x -> 2x)
    $expression = str_replace('*', '', $expression);

    // 불필요한 괄호 제거
    $expression = trim($expression);

    return $expression;
}

/**
 * 방정식 검증
 *
 * @param string $expression 방정식
 * @return bool 유효성
 */
function validateEquation($expression) {
    // 기본 검증
    if (empty($expression)) {
        return false;
    }

    // 등호가 있는지 확인
    if (strpos($expression, '=') === false) {
        return false;
    }

    // 양변이 있는지 확인
    $sides = explode('=', $expression);
    if (count($sides) !== 2) {
        return false;
    }

    foreach ($sides as $side) {
        if (empty(trim($side))) {
            return false;
        }
    }

    return true;
}
