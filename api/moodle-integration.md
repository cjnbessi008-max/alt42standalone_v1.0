# Moodle Integration API Documentation

## Overview

이 문서는 Secant Beam 시각화 앱을 Moodle LMS와 연동하기 위한 API 구조를 설명합니다.

## 환경 요구사항

- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **Web Server**: Apache 2.4+ 또는 Nginx

## 데이터베이스 스키마

### 테이블: `mdl_secant_problems`

```sql
CREATE TABLE mdl_secant_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    function_type VARCHAR(50) NOT NULL,
    function_expression VARCHAR(255),
    x_min DECIMAL(10,2) DEFAULT -10.00,
    x_max DECIMAL(10,2) DEFAULT 10.00,
    y_min DECIMAL(10,2) DEFAULT -10.00,
    y_max DECIMAL(10,2) DEFAULT 10.00,
    target_point1_x DECIMAL(10,4),
    target_point1_y DECIMAL(10,4),
    target_point2_x DECIMAL(10,4),
    target_point2_y DECIMAL(10,4),
    expected_slope DECIMAL(10,4),
    tolerance DECIMAL(10,4) DEFAULT 0.01,
    time_created BIGINT(10) NOT NULL,
    time_modified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 테이블: `mdl_secant_attempts`

```sql
CREATE TABLE mdl_secant_attempts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) NOT NULL,
    user_id BIGINT(10) NOT NULL,
    selected_point1_x DECIMAL(10,4),
    selected_point1_y DECIMAL(10,4),
    selected_point2_x DECIMAL(10,4),
    selected_point2_y DECIMAL(10,4),
    calculated_slope DECIMAL(10,4),
    is_correct TINYINT(1) DEFAULT 0,
    score DECIMAL(5,2),
    time_spent INT(10),
    time_created BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_problem (problem_id),
    KEY idx_user (user_id),
    KEY idx_problem_user (problem_id, user_id),
    FOREIGN KEY (problem_id) REFERENCES mdl_secant_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES mdl_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API 엔드포인트

### 1. 문제 정보 가져오기

**Endpoint**: `GET /api/problem.php`

**Parameters**:
- `problem_id` (required): 문제 ID
- `sesskey` (required): Moodle session key

**Response**:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "이차함수의 평균변화율",
        "description": "f(x) = x² 함수에서 두 점을 선택하여 평균변화율을 구하세요.",
        "function_type": "x2",
        "function_expression": null,
        "bounds": {
            "x_min": -10,
            "x_max": 10,
            "y_min": -10,
            "y_max": 10
        },
        "target": {
            "point1": { "x": -2, "y": 4 },
            "point2": { "x": 3, "y": 9 },
            "expected_slope": 1.0,
            "tolerance": 0.01
        }
    }
}
```

**Error Response**:
```json
{
    "success": false,
    "error": "문제를 찾을 수 없습니다.",
    "code": "PROBLEM_NOT_FOUND"
}
```

### 2. 답안 제출

**Endpoint**: `POST /api/submit.php`

**Parameters**:
```json
{
    "problem_id": 1,
    "user_id": 123,
    "sesskey": "abc123def456",
    "point1": { "x": -2.0, "y": 4.0 },
    "point2": { "x": 3.0, "y": 9.0 },
    "calculated_slope": 1.0,
    "time_spent": 45
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "attempt_id": 456,
        "is_correct": true,
        "score": 100,
        "feedback": "정답입니다! 평균변화율을 정확히 계산했습니다.",
        "expected_slope": 1.0,
        "your_slope": 1.0,
        "difference": 0.0
    }
}
```

### 3. 사용자 진행상황 조회

**Endpoint**: `GET /api/progress.php`

**Parameters**:
- `user_id` (required): 사용자 ID
- `course_id` (optional): 강좌 ID
- `sesskey` (required): Moodle session key

**Response**:
```json
{
    "success": true,
    "data": {
        "user_id": 123,
        "course_id": 10,
        "total_problems": 15,
        "completed_problems": 8,
        "average_score": 85.5,
        "total_time_spent": 1200,
        "attempts": [
            {
                "problem_id": 1,
                "problem_name": "이차함수의 평균변화율",
                "attempts_count": 2,
                "best_score": 100,
                "last_attempt": 1700000000
            }
        ]
    }
}
```

## PHP 구현 예시

### problem.php

```php
<?php
/**
 * Get problem information for Secant Beam visualization
 *
 * @package    local_secantbeam
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/weblib.php');

// Require login
require_login();

// Get parameters
$problemid = required_param('problem_id', PARAM_INT);
$sesskey = required_param('sesskey', PARAM_TEXT);

// Verify session
if (!confirm_sesskey($sesskey)) {
    send_json_error('Invalid session key', 'INVALID_SESSION');
}

// Get problem from database
$problem = $DB->get_record('secant_problems', ['id' => $problemid]);

if (!$problem) {
    send_json_error('Problem not found', 'PROBLEM_NOT_FOUND');
}

// Check capability
$context = context_course::instance($problem->course_id);
require_capability('local/secantbeam:view', $context);

// Prepare response
$response = [
    'success' => true,
    'data' => [
        'id' => $problem->id,
        'name' => $problem->name,
        'description' => $problem->description,
        'function_type' => $problem->function_type,
        'function_expression' => $problem->function_expression,
        'bounds' => [
            'x_min' => (float)$problem->x_min,
            'x_max' => (float)$problem->x_max,
            'y_min' => (float)$problem->y_min,
            'y_max' => (float)$problem->y_max,
        ],
        'target' => [
            'point1' => [
                'x' => (float)$problem->target_point1_x,
                'y' => (float)$problem->target_point1_y,
            ],
            'point2' => [
                'x' => (float)$problem->target_point2_x,
                'y' => (float)$problem->target_point2_y,
            ],
            'expected_slope' => (float)$problem->expected_slope,
            'tolerance' => (float)$problem->tolerance,
        ]
    ]
];

send_json_response($response);

/**
 * Send JSON response
 */
function send_json_response($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send JSON error response
 */
function send_json_error($message, $code = 'ERROR') {
    send_json_response([
        'success' => false,
        'error' => $message,
        'code' => $code
    ]);
}
```

### submit.php

```php
<?php
/**
 * Submit answer for Secant Beam problem
 *
 * @package    local_secantbeam
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/weblib.php');

// Require login
require_login();

// Get POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    send_json_error('Invalid JSON data', 'INVALID_DATA');
}

// Validate parameters
$problemid = $data['problem_id'] ?? 0;
$userid = $data['user_id'] ?? 0;
$sesskey = $data['sesskey'] ?? '';
$point1 = $data['point1'] ?? null;
$point2 = $data['point2'] ?? null;
$calculatedslope = $data['calculated_slope'] ?? null;
$timespent = $data['time_spent'] ?? 0;

// Verify session
if (!confirm_sesskey($sesskey)) {
    send_json_error('Invalid session key', 'INVALID_SESSION');
}

// Verify user
if ($userid != $USER->id) {
    send_json_error('User ID mismatch', 'USER_MISMATCH');
}

// Get problem
$problem = $DB->get_record('secant_problems', ['id' => $problemid]);
if (!$problem) {
    send_json_error('Problem not found', 'PROBLEM_NOT_FOUND');
}

// Check capability
$context = context_course::instance($problem->course_id);
require_capability('local/secantbeam:submit', $context);

// Calculate correctness
$expectedslope = (float)$problem->expected_slope;
$tolerance = (float)$problem->tolerance;
$difference = abs($calculatedslope - $expectedslope);
$iscorrect = $difference <= $tolerance;

// Calculate score (100 for correct, scaled for close answers)
if ($iscorrect) {
    $score = 100;
} else {
    // Partial credit for close answers
    $score = max(0, 100 - ($difference / $tolerance) * 20);
    $score = round($score, 2);
}

// Save attempt to database
$attempt = new stdClass();
$attempt->problem_id = $problemid;
$attempt->user_id = $userid;
$attempt->selected_point1_x = $point1['x'];
$attempt->selected_point1_y = $point1['y'];
$attempt->selected_point2_x = $point2['x'];
$attempt->selected_point2_y = $point2['y'];
$attempt->calculated_slope = $calculatedslope;
$attempt->is_correct = $iscorrect ? 1 : 0;
$attempt->score = $score;
$attempt->time_spent = $timespent;
$attempt->time_created = time();

$attemptid = $DB->insert_record('secant_attempts', $attempt);

// Generate feedback
if ($iscorrect) {
    $feedback = '정답입니다! 평균변화율을 정확히 계산했습니다.';
} else if ($score >= 80) {
    $feedback = '거의 정답입니다! 조금만 더 정확하게 계산해보세요.';
} else {
    $feedback = '다시 시도해보세요. 두 점을 정확히 선택했는지 확인하세요.';
}

// Prepare response
$response = [
    'success' => true,
    'data' => [
        'attempt_id' => $attemptid,
        'is_correct' => $iscorrect,
        'score' => $score,
        'feedback' => $feedback,
        'expected_slope' => $expectedslope,
        'your_slope' => $calculatedslope,
        'difference' => $difference
    ]
];

send_json_response($response);

// ... (helper functions same as problem.php)
```

## JavaScript 통합 예시

### moodle-api-client.js

```javascript
/**
 * Moodle API Client for Secant Beam
 */
class MoodleAPIClient {
    constructor(baseUrl, sesskey) {
        this.baseUrl = baseUrl;
        this.sesskey = sesskey;
    }

    /**
     * Fetch problem data
     */
    async getProblem(problemId) {
        const url = `${this.baseUrl}/api/problem.php?problem_id=${problemId}&sesskey=${this.sesskey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            return data.data;
        } catch (error) {
            console.error('Failed to fetch problem:', error);
            throw error;
        }
    }

    /**
     * Submit answer
     */
    async submitAnswer(problemId, userId, point1, point2, calculatedSlope, timeSpent) {
        const url = `${this.baseUrl}/api/submit.php`;

        const payload = {
            problem_id: problemId,
            user_id: userId,
            sesskey: this.sesskey,
            point1: point1,
            point2: point2,
            calculated_slope: calculatedSlope,
            time_spent: timeSpent
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            return data.data;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            throw error;
        }
    }

    /**
     * Get user progress
     */
    async getProgress(userId, courseId = null) {
        let url = `${this.baseUrl}/api/progress.php?user_id=${userId}&sesskey=${this.sesskey}`;
        if (courseId) {
            url += `&course_id=${courseId}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            return data.data;
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            throw error;
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleAPIClient;
}
```

## 보안 고려사항

1. **세션 검증**: 모든 요청에서 `sesskey` 검증
2. **권한 확인**: Moodle capability 시스템 사용
3. **SQL Injection 방지**: Moodle의 `$DB` API 사용
4. **XSS 방지**: 출력 시 적절한 이스케이프 처리
5. **CSRF 방지**: POST 요청에 sesskey 포함

## 설치 방법

1. Moodle의 `local/secantbeam` 디렉토리 생성
2. 데이터베이스 스키마 실행
3. API 파일들을 `local/secantbeam/api/` 에 배치
4. Capabilities 정의 (`db/access.php`)
5. Version 정보 설정 (`version.php`)

## 라이선스

GNU GPL v3 or later
