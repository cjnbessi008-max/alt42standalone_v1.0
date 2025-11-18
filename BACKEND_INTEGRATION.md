# Backend Integration Guide

Moodle 3.7 + PHP 7.1.9 + MySQL 5.7 연동 가이드

## 목차

1. [개요](#개요)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [PHP API 구현](#php-api-구현)
4. [Moodle 플러그인 구조](#moodle-플러그인-구조)
5. [인증 및 보안](#인증-및-보안)
6. [테스트](#테스트)

---

## 개요

이 문서는 Overlap Sync Animation 웹 애플리케이션을 Moodle 3.7 LMS와 연동하는 방법을 설명합니다.

### 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **Apache/Nginx**: 웹 서버
- **mbstring, mysqli, json**: PHP 확장

---

## 데이터베이스 설정

### 1. 테이블 생성

```sql
-- 문제 정보 테이블
CREATE TABLE `mdl_overlap_sync_problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '문제 제목',
  `type` VARCHAR(50) NOT NULL DEFAULT 'overlap-sync' COMMENT '문제 유형',
  `shapes` JSON NOT NULL COMMENT '도형 정보 (JSON)',
  `duration` INT NOT NULL DEFAULT 3000 COMMENT '애니메이션 지속 시간 (ms)',
  `target_overlap` DECIMAL(3,2) NOT NULL DEFAULT 0.50 COMMENT '목표 겹침 비율',
  `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy' COMMENT '난이도',
  `instruction` TEXT COMMENT '문제 설명',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Overlap Sync 문제 정보';

-- 사용자 진행 상태 테이블
CREATE TABLE `mdl_overlap_sync_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'Moodle 사용자 ID',
  `problem_id` INT NOT NULL COMMENT '문제 ID',
  `attempts` INT DEFAULT 0 COMMENT '시도 횟수',
  `completed` BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
  `score` INT DEFAULT NULL COMMENT '점수 (0-100)',
  `started_at` TIMESTAMP NOT NULL COMMENT '시작 시간',
  `completed_at` TIMESTAMP NULL COMMENT '완료 시간',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `mdl_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`problem_id`) REFERENCES `mdl_overlap_sync_problems`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `idx_user_problem` (`user_id`, `problem_id`),
  INDEX `idx_completed` (`completed`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 학습 진행 상태';

-- 성적 기록 테이블
CREATE TABLE `mdl_overlap_sync_grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `problem_id` INT NOT NULL,
  `grade` DECIMAL(5,2) NOT NULL COMMENT '점수',
  `max_grade` DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '만점',
  `graded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `mdl_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`problem_id`) REFERENCES `mdl_overlap_sync_problems`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_grade` (`user_id`, `grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='성적 기록';
```

### 2. 샘플 데이터 삽입

```sql
-- 샘플 문제 데이터
INSERT INTO `mdl_overlap_sync_problems`
(`title`, `type`, `shapes`, `duration`, `target_overlap`, `difficulty`, `instruction`)
VALUES
(
  '원 겹치기 - 기초',
  'overlap-sync',
  '[
    {
      "id": "shape-1",
      "type": "circle",
      "color": "#FF6B6B",
      "size": 100,
      "startPosition": {"x": 20, "y": 50},
      "endPosition": {"x": 45, "y": 50},
      "opacity": 0.7,
      "label": "A"
    },
    {
      "id": "shape-2",
      "type": "circle",
      "color": "#4ECDC4",
      "size": 100,
      "startPosition": {"x": 80, "y": 50},
      "endPosition": {"x": 55, "y": 50},
      "opacity": 0.7,
      "label": "B"
    }
  ]',
  3000,
  0.50,
  'easy',
  '두 원이 50% 겹칠 때까지 기다려주세요.'
);
```

---

## PHP API 구현

### 디렉토리 구조

```
moodle/
└── local/
    └── overlap_sync/
        ├── version.php
        ├── db/
        │   └── install.xml
        ├── classes/
        │   ├── api.php
        │   └── models/
        │       ├── problem.php
        │       └── progress.php
        └── api/
            ├── problems.php
            ├── progress.php
            └── complete.php
```

### 1. 문제 조회 API

**파일**: `moodle/local/overlap_sync/api/problems.php`

```php
<?php
/**
 * Overlap Sync - Problem API
 * 문제 정보 조회 API
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/filelib.php');

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 인증 확인
require_login();

global $DB, $USER;

/**
 * 단일 문제 조회
 */
function get_problem($problem_id) {
    global $DB;

    $problem = $DB->get_record('overlap_sync_problems', ['id' => $problem_id]);

    if (!$problem) {
        return null;
    }

    return [
        'id' => (string)$problem->id,
        'title' => $problem->title,
        'type' => $problem->type,
        'shapes' => json_decode($problem->shapes),
        'duration' => (int)$problem->duration,
        'targetOverlap' => (float)$problem->target_overlap,
        'difficulty' => $problem->difficulty,
        'instruction' => $problem->instruction ?? ''
    ];
}

/**
 * 모든 문제 조회
 */
function get_all_problems($type = null) {
    global $DB;

    $params = [];
    $sql = "SELECT * FROM {overlap_sync_problems}";

    if ($type) {
        $sql .= " WHERE type = :type";
        $params['type'] = $type;
    }

    $sql .= " ORDER BY difficulty, id";

    $problems = $DB->get_records_sql($sql, $params);

    $result = [];
    foreach ($problems as $problem) {
        $result[] = [
            'id' => (string)$problem->id,
            'title' => $problem->title,
            'type' => $problem->type,
            'shapes' => json_decode($problem->shapes),
            'duration' => (int)$problem->duration,
            'targetOverlap' => (float)$problem->target_overlap,
            'difficulty' => $problem->difficulty,
            'instruction' => $problem->instruction ?? ''
        ];
    }

    return $result;
}

// 메인 로직
try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // 단일 문제 조회
        if (isset($_GET['id'])) {
            $problem_id = required_param('id', PARAM_INT);
            $problem = get_problem($problem_id);

            if (!$problem) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'Problem not found'
                    ],
                    'timestamp' => time()
                ]);
                exit;
            }

            echo json_encode([
                'success' => true,
                'data' => $problem,
                'timestamp' => time()
            ]);
        }
        // 모든 문제 조회
        else {
            $type = optional_param('type', null, PARAM_TEXT);
            $problems = get_all_problems($type);

            echo json_encode([
                'success' => true,
                'data' => $problems,
                'timestamp' => time()
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'METHOD_NOT_ALLOWED',
                'message' => 'Only GET method is allowed'
            ],
            'timestamp' => time()
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => 'Internal server error: ' . $e->getMessage()
        ],
        'timestamp' => time()
    ]);
}
```

### 2. 진행 상태 저장 API

**파일**: `moodle/local/overlap_sync/api/progress.php`

```php
<?php
/**
 * Overlap Sync - Progress API
 * 학습 진행 상태 저장/조회 API
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');

// CORS 헤더
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_login();

global $DB, $USER;

/**
 * 진행 상태 저장
 */
function save_progress($data) {
    global $DB, $USER;

    $user_id = $data->userId ?? $USER->id;
    $problem_id = $data->problemId;

    // 기존 레코드 확인
    $existing = $DB->get_record('overlap_sync_progress', [
        'user_id' => $user_id,
        'problem_id' => $problem_id
    ]);

    if ($existing) {
        // 업데이트
        $existing->attempts = ($data->attempts ?? $existing->attempts);
        $existing->completed = ($data->completed ?? $existing->completed);
        $existing->score = ($data->score ?? $existing->score);

        if (isset($data->completedAt)) {
            $existing->completed_at = $data->completedAt;
        }

        $DB->update_record('overlap_sync_progress', $existing);
        return $existing->id;
    } else {
        // 삽입
        $record = new stdClass();
        $record->user_id = $user_id;
        $record->problem_id = $problem_id;
        $record->attempts = $data->attempts ?? 1;
        $record->completed = $data->completed ?? false;
        $record->score = $data->score ?? null;
        $record->started_at = $data->startedAt ?? time();
        $record->completed_at = $data->completedAt ?? null;

        return $DB->insert_record('overlap_sync_progress', $record);
    }
}

/**
 * 진행 상태 조회
 */
function get_progress($user_id, $problem_id) {
    global $DB;

    $progress = $DB->get_record('overlap_sync_progress', [
        'user_id' => $user_id,
        'problem_id' => $problem_id
    ]);

    if (!$progress) {
        return null;
    }

    return [
        'userId' => (string)$progress->user_id,
        'problemId' => (string)$progress->problem_id,
        'attempts' => (int)$progress->attempts,
        'completed' => (bool)$progress->completed,
        'score' => $progress->score ? (int)$progress->score : null,
        'startedAt' => (int)$progress->started_at,
        'completedAt' => $progress->completed_at ? (int)$progress->completed_at : null
    ];
}

// 메인 로직
try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // 진행 상태 저장
        $json = file_get_contents('php://input');
        $data = json_decode($json);

        if (!$data || !isset($data->problemId)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_REQUEST',
                    'message' => 'problemId is required'
                ],
                'timestamp' => time()
            ]);
            exit;
        }

        save_progress($data);

        echo json_encode([
            'success' => true,
            'timestamp' => time()
        ]);

    } else if ($method === 'GET') {
        // 진행 상태 조회
        $user_id = required_param('userId', PARAM_INT);
        $problem_id = required_param('problemId', PARAM_INT);

        $progress = get_progress($user_id, $problem_id);

        if (!$progress) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Progress not found'
                ],
                'timestamp' => time()
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'data' => $progress,
            'timestamp' => time()
        ]);
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'METHOD_NOT_ALLOWED',
                'message' => 'Only GET and POST methods are allowed'
            ],
            'timestamp' => time()
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => 'Internal server error: ' . $e->getMessage()
        ],
        'timestamp' => time()
    ]);
}
```

### 3. 완료 처리 API

**파일**: `moodle/local/overlap_sync/api/complete.php`

```php
<?php
/**
 * Overlap Sync - Complete API
 * 문제 완료 처리 API
 */

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../../config.php');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_login();

global $DB, $USER;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'METHOD_NOT_ALLOWED',
                'message' => 'Only POST method is allowed'
            ],
            'timestamp' => time()
        ]);
        exit;
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json);

    if (!$data || !isset($data->problemId) || !isset($data->score)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INVALID_REQUEST',
                'message' => 'problemId and score are required'
            ],
            'timestamp' => time()
        ]);
        exit;
    }

    $user_id = $data->userId ?? $USER->id;
    $problem_id = $data->problemId;
    $score = $data->score;

    // 진행 상태 업데이트
    $progress = $DB->get_record('overlap_sync_progress', [
        'user_id' => $user_id,
        'problem_id' => $problem_id
    ]);

    if ($progress) {
        $progress->completed = true;
        $progress->score = $score;
        $progress->completed_at = $data->completedAt ?? time();
        $DB->update_record('overlap_sync_progress', $progress);
    } else {
        $record = new stdClass();
        $record->user_id = $user_id;
        $record->problem_id = $problem_id;
        $record->attempts = 1;
        $record->completed = true;
        $record->score = $score;
        $record->started_at = time();
        $record->completed_at = time();
        $DB->insert_record('overlap_sync_progress', $record);
    }

    // 성적 기록
    $grade = new stdClass();
    $grade->user_id = $user_id;
    $grade->problem_id = $problem_id;
    $grade->grade = $score;
    $grade->max_grade = 100;
    $DB->insert_record('overlap_sync_grades', $grade);

    echo json_encode([
        'success' => true,
        'timestamp' => time()
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => 'Internal server error: ' . $e->getMessage()
        ],
        'timestamp' => time()
    ]);
}
```

---

## 인증 및 보안

### 1. 토큰 기반 인증

Moodle의 웹 서비스 토큰을 사용합니다:

```php
// 토큰 검증
$token = required_param('token', PARAM_ALPHANUM);
$service = $DB->get_record('external_services', ['shortname' => 'overlap_sync_service']);
$token_record = $DB->get_record('external_tokens', [
    'token' => $token,
    'externalserviceid' => $service->id
]);

if (!$token_record) {
    throw new moodle_exception('invalidtoken');
}

$USER = $DB->get_record('user', ['id' => $token_record->userid]);
```

### 2. SQL Injection 방어

항상 prepared statements 사용:

```php
// ❌ 나쁜 예
$sql = "SELECT * FROM mdl_users WHERE id = " . $_GET['id'];

// ✅ 좋은 예
$user = $DB->get_record('user', ['id' => $user_id]);
```

### 3. XSS 방어

출력 시 항상 이스케이프:

```php
echo s($problem->title);  // Moodle의 s() 함수 사용
echo format_text($problem->instruction, FORMAT_HTML);
```

---

## 테스트

### 1. cURL 테스트

```bash
# 문제 목록 조회
curl -X GET "http://your-moodle.com/local/overlap_sync/api/problems.php" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 단일 문제 조회
curl -X GET "http://your-moodle.com/local/overlap_sync/api/problems.php?id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 진행 상태 저장
curl -X POST "http://your-moodle.com/local/overlap_sync/api/progress.php" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "problemId": "1",
    "attempts": 1,
    "completed": false,
    "startedAt": 1234567890
  }'
```

### 2. Postman Collection

Postman Collection을 만들어 API 테스트를 자동화할 수 있습니다.

---

## 문제 해결

### 일반적인 오류

1. **CORS 오류**: Apache/Nginx 설정에서 CORS 헤더 추가
2. **JSON 파싱 오류**: MySQL 5.7의 JSON 함수 사용
3. **인증 실패**: Moodle 세션 및 토큰 확인
4. **성능 문제**: 인덱스 추가 및 쿼리 최적화

---

## 추가 리소스

- [Moodle Development Documentation](https://docs.moodle.org/dev/)
- [PHP 7.1 Manual](https://www.php.net/manual/en/)
- [MySQL 5.7 JSON Functions](https://dev.mysql.com/doc/refman/5.7/en/json-functions.html)

---

**작성일**: 2025-01-18
**버전**: 1.0.0
