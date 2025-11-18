# Moodle 3.7 LMS 연동 - 선행 개념 부족 감지 시스템

## 목차
1. [개요](#개요)
2. [시스템 요구사항](#시스템-요구사항)
3. [설치 가이드](#설치-가이드)
4. [설정](#설정)
5. [사용 방법](#사용-방법)
6. [API 문서](#api-문서)
7. [알고리즘 설명](#알고리즘-설명)
8. [문제 해결](#문제-해결)

---

## 개요

이 시스템은 Moodle 3.7 LMS와 연동하여 학생들의 학습 데이터를 분석하고, **선행 개념(prerequisite concepts)의 부족**을 자동으로 감지합니다.

### 주요 기능

- ✅ **Moodle Web Services API 연동**: 학생 성적, 퀴즈 결과, 과제 제출 데이터 자동 수집
- ✅ **선행 개념 부족 감지**: 현재 개념 학습 실패 시 관련 선행 개념 분석
- ✅ **신뢰도 점수 계산**: 데이터 양, 일관성, 심각도를 고려한 신뢰도 제공
- ✅ **자동 동기화**: 정기적으로 Moodle 데이터를 가져와 분석
- ✅ **RESTful API**: 외부 시스템에서 분석 결과 조회 가능
- ✅ **통계 및 리포트**: 코스별, 학생별 gap 통계 제공

### 시스템 아키텍처

```
┌─────────────┐
│   Moodle    │
│  LMS 3.7    │
└──────┬──────┘
       │ Web Services API
       ↓
┌──────────────────────────────────────┐
│  Prerequisite Gap Detection System   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  MoodleClient.php              │ │
│  │  - API 연동                     │ │
│  └────────┬───────────────────────┘ │
│           ↓                          │
│  ┌────────────────────────────────┐ │
│  │  GapDetector.php               │ │
│  │  - 성적 분석                    │ │
│  │  - 선행 개념 gap 감지           │ │
│  │  - 신뢰도 계산                  │ │
│  └────────┬───────────────────────┘ │
│           ↓                          │
│  ┌────────────────────────────────┐ │
│  │  MySQL 5.7 Database            │ │
│  │  - prerequisite_gaps           │ │
│  │  - concept_map                 │ │
│  │  - prerequisite_rules          │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
       ↓ REST API
┌──────────────────┐
│  외부 시스템      │
│  (대시보드 등)    │
└──────────────────┘
```

---

## 시스템 요구사항

### 필수 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **PHP Extensions**:
  - PDO
  - pdo_mysql
  - curl
  - json

### Moodle 설정 요구사항

1. **Web Services 활성화**
   - Site administration → Advanced features → Enable web services

2. **REST 프로토콜 활성화**
   - Site administration → Plugins → Web services → Manage protocols → Enable REST

3. **External Service 생성**
   - Site administration → Plugins → Web services → External services
   - 필요한 함수들:
     ```
     core_enrol_get_enrolled_users
     core_course_get_contents
     mod_quiz_get_user_attempts
     mod_assign_get_submissions
     mod_assign_get_grades
     core_completion_get_activities_completion_status
     gradereport_user_get_grade_items
     ```

4. **Web Service Token 생성**
   - Site administration → Plugins → Web services → Manage tokens
   - 특정 사용자(서비스 계정 권장)를 위한 토큰 생성

---

## 설치 가이드

### 1단계: 파일 배포

```bash
# 프로젝트 디렉토리로 이동
cd /var/www/html/prerequisite-gaps

# 파일 구조 확인
ls -la
# moodle-integration/
# database/
# api/
# scripts/
# examples/
# docs/
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql

# 또는 MySQL 내에서:
# source /path/to/database/schema.sql
```

### 3단계: 설정 파일 생성

```bash
cd moodle-integration
cp config.sample.php config.php
nano config.php  # 또는 vim, vi 등 사용
```

**config.php 수정 내용:**

```php
<?php
return [
    'moodle' => [
        'base_url' => 'https://your-moodle-site.com',
        'token' => 'your-actual-web-service-token',
        'service' => 'moodle_mobile_app',
    ],

    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'prerequisite_gaps',
        'username' => 'your_db_user',
        'password' => 'your_db_password',
        'charset' => 'utf8mb4',
    ],

    'gap_detection' => [
        'passing_threshold' => 70,  // 통과 기준 점수 (%)
        'min_attempts' => 3,        // 최소 시도 횟수
        'analysis_window_days' => 30,
        'confidence_threshold' => 0.7,

        // 선행 개념 관계 정의
        'prerequisites' => [
            'fractions_multiplication' => ['fractions_basic', 'multiplication_basic'],
            'fractions_division' => ['fractions_multiplication', 'division_basic'],
            'algebra_equations' => ['arithmetic_operations', 'variables_basic'],
            // 필요에 따라 추가...
        ],
    ],

    'api' => [
        'enabled' => true,
        'auth_required' => true,
        'api_key' => 'generate-a-secure-random-key-here',
    ],

    'logging' => [
        'enabled' => true,
        'level' => 'info',
        'file' => __DIR__ . '/../logs/moodle-integration.log',
    ],
];
```

### 4단계: 디렉토리 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs  # 웹 서버 사용자에 맞게 조정

# PHP 파일 권한
chmod 644 moodle-integration/*.php
chmod 644 api/*.php
chmod 755 scripts/*.php
```

### 5단계: 웹 서버 설정 (Apache 예시)

```apache
# /etc/apache2/sites-available/gaps-api.conf

<VirtualHost *:80>
    ServerName gaps-api.yourdomain.com
    DocumentRoot /var/www/html/prerequisite-gaps

    <Directory /var/www/html/prerequisite-gaps>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/html/prerequisite-gaps/api>
        Options +ExecCGI
        AddHandler php7-script .php
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/gaps-api-error.log
    CustomLog ${APACHE_LOG_DIR}/gaps-api-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화 및 Apache 재시작
sudo a2ensite gaps-api
sudo systemctl restart apache2
```

---

## 설정

### 개념 맵(Concept Map) 설정

개념 맵은 Moodle 활동 이름을 교육 개념으로 매핑합니다.

```sql
INSERT INTO concept_map (course_id, concept_name, keywords) VALUES
(1, 'fractions_basic', '["fraction", "분수", "numerator", "denominator"]'),
(1, 'fractions_multiplication', '["fraction multiply", "분수 곱셈"]'),
(1, 'algebra_equations', '["equation", "방정식", "solve"]');
```

### 선행 개념 규칙 설정

```sql
INSERT INTO prerequisite_rules (course_id, current_concept, prerequisite_concept, importance) VALUES
(1, 'fractions_multiplication', 'fractions_basic', 'critical'),
(1, 'fractions_multiplication', 'multiplication_basic', 'high'),
(1, 'algebra_equations', 'arithmetic_operations', 'critical');
```

---

## 사용 방법

### 방법 1: PHP 스크립트로 직접 분석

```php
<?php
require_once 'moodle-integration/MoodleClient.php';
require_once 'moodle-integration/GapDetector.php';
require_once 'moodle-integration/DatabaseManager.php';

$config = require 'moodle-integration/config.php';

$dbManager = new DatabaseManager($config['database']);
$db = $dbManager->getConnection();
$moodleClient = new MoodleClient($config['moodle']);
$gapDetector = new GapDetector($config, $moodleClient, $db);

// 특정 학생 분석
$courseId = 1;
$userId = 123;

$conceptMap = [
    'fractions_basic' => ['fraction', '분수'],
    'fractions_multiplication' => ['multiply', '곱셈'],
];

$gaps = $gapDetector->analyzeStudent($courseId, $userId, $conceptMap);

foreach ($gaps as $gap) {
    echo "Gap detected: {$gap['prerequisite_concept']}\n";
    echo "  Severity: {$gap['gap_severity']}\n";
    echo "  Confidence: {$gap['confidence']}\n";
}
```

### 방법 2: REST API 사용

```bash
# 학생 gap 조회
curl -X GET "http://gaps-api.yourdomain.com/api/gaps.php/student/123/course/1" \
  -H "Authorization: Bearer your-api-key"

# 특정 학생 분석 실행
curl -X POST "http://gaps-api.yourdomain.com/api/sync.php" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "sync_type": "manual"
  }'
```

### 방법 3: Cron으로 정기 동기화

```bash
# crontab 편집
crontab -e

# 매시간 자동 동기화
0 * * * * /usr/bin/php /var/www/html/prerequisite-gaps/scripts/sync_scheduler.php >> /var/log/gaps-sync.log 2>&1
```

---

## API 문서

### 인증

모든 API 요청은 Authorization 헤더에 Bearer 토큰이 필요합니다:

```
Authorization: Bearer your-api-key-here
```

### 엔드포인트

#### 1. 학생 gap 조회

**요청:**
```
GET /api/gaps.php/student/{userId}
GET /api/gaps.php/student/{userId}/course/{courseId}
```

**응답:**
```json
{
  "gaps": [
    {
      "id": 1,
      "user_id": 123,
      "course_id": 1,
      "current_concept": "fractions_multiplication",
      "prerequisite_concept": "fractions_basic",
      "current_performance": 45.5,
      "prerequisite_performance": 38.2,
      "gap_severity": "high",
      "confidence": 0.85,
      "detected_at": "2025-11-18 10:30:00"
    }
  ],
  "count": 1
}
```

#### 2. 코스 gap 통계

**요청:**
```
GET /api/gaps.php/course/{courseId}/statistics
```

**응답:**
```json
{
  "statistics": [
    {
      "prerequisite_concept": "fractions_basic",
      "affected_students": 15,
      "avg_confidence": 0.82,
      "avg_performance": 42.3,
      "total_gaps": 28
    }
  ]
}
```

#### 3. 학생 분석 실행

**요청:**
```
POST /api/gaps.php/analyze
Content-Type: application/json

{
  "course_id": 1,
  "user_id": 123,
  "concept_map": {
    "fractions_basic": ["fraction", "분수"],
    "fractions_multiplication": ["multiply", "곱셈"]
  }
}
```

**응답:**
```json
{
  "success": true,
  "gaps": [...],
  "count": 3
}
```

#### 4. Moodle 데이터 동기화

**요청:**
```
POST /api/sync.php
Content-Type: application/json

{
  "course_id": 1,
  "sync_type": "manual",
  "batch_size": 50
}
```

**응답:**
```json
{
  "success": true,
  "sync_id": 42,
  "course_id": 1,
  "students_analyzed": 48,
  "gaps_detected": 127,
  "errors": 0,
  "sync_type": "manual"
}
```

---

## 알고리즘 설명

### 선행 개념 부족 감지 알고리즘

#### 1단계: 학생 성적 데이터 수집

```php
// Moodle에서 다음 데이터 수집:
- 퀴즈 점수 및 시도 횟수
- 과제 제출 및 성적
- 활동 완료 상태
- 전체 코스 성적
```

#### 2단계: 어려움을 겪는 개념 식별

```php
// 다음 기준으로 struggling concepts 판단:
if (평균_점수 < passing_threshold) {
    → 이 개념에서 어려움을 겪고 있음
}
```

#### 3단계: 선행 개념 분석

```php
// 어려움을 겪는 각 개념에 대해:
foreach (현재_개념 as $concept) {
    $prerequisites = get_prerequisites($concept);

    foreach ($prerequisites as $prereq) {
        if (prereq 점수 < passing_threshold OR prereq 시도 없음) {
            → Gap 감지!
        }
    }
}
```

#### 4단계: Gap 심각도 계산

```php
function calculateSeverity($currentScore, $prereqScore) {
    $avgScore = ($currentScore + $prereqScore) / 2;

    if ($avgScore < 40) return 'critical';
    if ($avgScore < 55) return 'high';
    if ($avgScore < 70) return 'medium';
    return 'low';
}
```

#### 5단계: 신뢰도 점수 계산

신뢰도는 다음 요소를 고려합니다:

1. **데이터 양** (40%):
   ```php
   if (시도_횟수 < min_attempts) {
       confidence *= 시도_횟수 / min_attempts
   }
   ```

2. **성적 일관성** (30%):
   ```php
   $stdDev = standard_deviation($scores);
   $consistencyFactor = 1 - min($stdDev / 100, 0.5);
   confidence *= $consistencyFactor;
   ```

3. **Gap 심각도** (20%):
   ```php
   $severityWeights = [
       'critical' => 1.0,
       'high' => 0.9,
       'medium' => 0.75,
       'low' => 0.6
   ];
   confidence *= $severityWeights[$severity];
   ```

4. **선행 개념 미시도 여부** (10%):
   ```php
   if (선행개념_시도_없음) {
       confidence = max(confidence, 0.9);  // 높은 신뢰도
   }
   ```

---

## 문제 해결

### Moodle API 연결 실패

**증상:** `Moodle API request failed: Could not connect`

**해결방법:**
1. Moodle URL이 올바른지 확인
2. Web Services가 활성화되어 있는지 확인
3. 방화벽 설정 확인
4. SSL 인증서 문제인 경우: `CURLOPT_SSL_VERIFYPEER => true` (프로덕션에서)

### 데이터베이스 연결 실패

**증상:** `Database connection failed: Access denied`

**해결방법:**
```bash
# MySQL 사용자 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON prerequisite_gaps.* TO 'db_user'@'localhost';
FLUSH PRIVILEGES;
```

### Gap이 감지되지 않음

**해결방법:**
1. Concept map이 올바르게 설정되었는지 확인:
   ```sql
   SELECT * FROM concept_map WHERE course_id = 1;
   ```

2. Prerequisite rules가 정의되어 있는지 확인:
   ```sql
   SELECT * FROM prerequisite_rules WHERE course_id = 1 OR course_id IS NULL;
   ```

3. Passing threshold가 너무 낮지 않은지 확인 (config.php)

4. 로그 파일 확인:
   ```bash
   tail -f logs/moodle-integration.log
   ```

### API 인증 실패

**증상:** `401 Unauthorized`

**해결방법:**
1. API key가 올바른지 확인
2. Authorization 헤더 형식 확인: `Bearer your-key`
3. config.php에서 `auth_required` 설정 확인

---

## 예제 시나리오

### 시나리오 1: 분수 곱셈에 어려움을 겪는 학생

**상황:**
- 학생 ID: 123
- 분수 곱셈 퀴즈 점수: 45%
- 기본 분수 퀴즈 점수: 50%
- 기본 곱셈 퀴즈 점수: 85%

**감지 결과:**
```json
{
  "gap": {
    "current_concept": "fractions_multiplication",
    "prerequisite_concept": "fractions_basic",
    "gap_severity": "high",
    "confidence": 0.88,
    "recommendation": "기본 분수 개념 복습 필요"
  }
}
```

**해석:**
- 기본 곱셈은 잘 이해하고 있음 (85%)
- 기본 분수에 gap이 있음 (50%)
- 이것이 분수 곱셈 학습에 영향을 미침

---

## 라이센스 및 지원

이 시스템은 KAIST Touch Math Academy를 위해 개발되었습니다.

**기술 지원:**
- 문서: `/docs/`
- 예제 코드: `/examples/`
- 로그: `/logs/moodle-integration.log`

---

## 업데이트 이력

- **v1.0.0** (2025-11-18): 초기 릴리스
  - Moodle 3.7 Web Services API 연동
  - 선행 개념 부족 감지 알고리즘
  - REST API
  - 자동 동기화
  - MySQL 5.7 지원
