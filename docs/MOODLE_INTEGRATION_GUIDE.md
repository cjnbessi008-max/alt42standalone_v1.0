# Moodle 3.7 통합 가이드

## 개요

이 가이드는 ALT42 교육 시스템과 Moodle 3.7 LMS를 연동하여 "문제를 다시 풀면 더 빨리 할 수 있는가?" 기능을 구현하는 방법을 설명합니다.

## 시스템 요구사항

- **Moodle**: 3.7
- **MySQL**: 5.7
- **PHP**: 7.1.9 이상
- **웹 서버**: Apache 2.4 또는 Nginx 1.14 이상

---

## 1. 데이터베이스 설정

### 1.1 스키마 생성

```bash
mysql -u root -p < database/moodle_integration_schema.sql
```

### 1.2 주요 테이블 구조

#### `student_attempts` - 학생 시도 기록
- 모든 문제 풀이 시도를 기록
- `attempt_number`: 시도 횟수 (1, 2, 3...)
- `time_spent_seconds`: 소요 시간
- `is_correct`: 정답 여부

#### `retry_speed_analysis` - 재시도 속도 분석
- 첫 시도와 최근 시도의 시간 비교
- `improvement_percentage`: 개선율 (%)
- `is_improving`: 개선 중 여부

#### `moodle_user_mapping` - 사용자 매핑
- Moodle 사용자 ID와 로컬 학생 ID 연결

---

## 2. Moodle LTI 설정

### 2.1 Moodle에서 외부 도구 추가

1. **Moodle 관리자 로그인**
2. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리**
3. **"외부 도구 구성" 클릭**

### 2.2 LTI 제공자 정보 입력

```
도구 이름: ALT42 Retry Speed Check
도구 URL: https://your-domain.com/api/lti/launch
Consumer Key: kaist_lti_key_2025
Shared Secret: [강력한 비밀키 생성]
LTI 버전: LTI 1.0/1.1
```

### 2.3 권한 설정

다음 항목을 체크:
- ✅ 사용자 정보 공유
- ✅ 이름 공유
- ✅ 이메일 공유
- ✅ 성적 동기화 허용

### 2.4 환경 변수 설정

`.env` 파일에 다음을 추가:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alt42_education
DB_USER=your_db_user
DB_PASS=your_db_password

# Moodle LTI Configuration
LTI_CONSUMER_KEY=kaist_lti_key_2025
LTI_SHARED_SECRET=your_shared_secret_here

# Application Settings
SESSION_TIMEOUT=3600
GRADE_SYNC_ENABLED=true
```

---

## 3. PHP 코드 배포

### 3.1 파일 구조

```
/var/www/html/
├── api/
│   └── lti/
│       └── launch.php → api_endpoints.php
├── src/
│   └── php/
│       ├── MoodleLTIIntegration.php
│       ├── RetrySpeedAnalyzer.php
│       └── api_endpoints.php
└── database/
    └── moodle_integration_schema.sql
```

### 3.2 Apache 설정 (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API 라우팅
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ /src/php/api_endpoints.php [QSA,L]
</IfModule>
```

### 3.3 Nginx 설정

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;

    location /api/ {
        rewrite ^/api/(.*)$ /src/php/api_endpoints.php last;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

---

## 4. API 엔드포인트 사용법

### 4.1 LTI Launch (Moodle에서 자동 호출)

**요청:**
```http
POST /api/lti/launch
Content-Type: application/x-www-form-urlencoded

lti_message_type=basic-lti-launch-request
lti_version=LTI-1p0
resource_link_id=12345
user_id=student_123
oauth_consumer_key=kaist_lti_key_2025
oauth_signature=...
```

**응답:**
```json
{
  "success": true,
  "session_token": "abc123...",
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_data": {
    "moodle_user_id": "student_123",
    "username": "홍길동",
    "email": "hong@kaist.ac.kr",
    "role": "student"
  }
}
```

### 4.2 문제 시도 기록

**요청:**
```http
POST /api/attempts
Content-Type: application/json

{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "problem_id": "660e8400-e29b-41d4-a716-446655440000",
  "student_answer": {
    "numerator": 2,
    "denominator": 4
  },
  "is_correct": true,
  "time_spent_seconds": 45,
  "started_at": "2025-11-18 10:00:00",
  "completed_at": "2025-11-18 10:00:45",
  "module_id": "550e8400-e29b-41d4-a716-446655440000",
  "moodle_activity_id": "activity_123"
}
```

**응답:**
```json
{
  "success": true,
  "attempt_id": "770e8400-e29b-41d4-a716-446655440000",
  "analysis": {
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "problem_id": "660e8400-e29b-41d4-a716-446655440000",
    "total_attempts": 2,
    "correct_attempts": 2,
    "first_attempt_time": 60,
    "latest_attempt_time": 45,
    "time_improvement_seconds": 15,
    "improvement_percentage": 25.00,
    "is_improving": true,
    "improvement_level": "Good"
  },
  "feedback": "잘했어요! 15초 더 빨라졌어요! (25% 개선)\n연습할수록 더 빨라지고 있어요!\n2번 중 2번 맞혔어요. 잘하고 있어요!",
  "retry_recommendation": {
    "should_retry": true,
    "reason": "improving",
    "message": "점점 더 빨라지고 있어요! 한 번 더 도전해볼까요?"
  }
}
```

### 4.3 재시도 분석 조회

**요청:**
```http
GET /api/students/{student_id}/problems/{problem_id}/analysis
```

**응답:**
```json
{
  "success": true,
  "analysis": {
    "total_attempts": 3,
    "improvement_percentage": 40.00,
    "improvement_level": "Excellent"
  },
  "feedback": "놀라워요! 첫 시도보다 24초나 빨라졌어요!",
  "retry_recommendation": {
    "should_retry": false,
    "reason": "sufficient_practice",
    "message": "이 문제는 충분히 연습했어요. 다음 문제로 넘어가도 좋아요!"
  }
}
```

### 4.4 재시도 권장 여부 확인

**요청:**
```http
GET /api/students/{student_id}/problems/{problem_id}/should-retry
```

**응답:**
```json
{
  "success": true,
  "recommendation": {
    "should_retry": true,
    "reason": "slow",
    "message": "정답이에요! 다시 풀어서 더 빨리 풀 수 있는지 확인해볼까요?"
  }
}
```

### 4.5 학생 진행상황 조회

**요청:**
```http
GET /api/students/{student_id}/progress?module_id={module_id}
```

**응답:**
```json
{
  "success": true,
  "progress": [
    {
      "student_id": "550e8400-e29b-41d4-a716-446655440000",
      "module_id": "550e8400-e29b-41d4-a716-446655440000",
      "problems_attempted": 10,
      "problems_correct": 8,
      "problems_retried": 5,
      "average_time_seconds": 45.50,
      "average_improvement_percentage": 22.50,
      "progress_percentage": 50.00
    }
  ]
}
```

---

## 5. 프론트엔드 통합 예제

### 5.1 React 컴포넌트 예제

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const ProblemSolver = ({ studentId, problemId, moduleId }) => {
  const [timeStarted, setTimeStarted] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleStart = () => {
    setTimeStarted(new Date());
  };

  const handleSubmit = async (answer) => {
    const timeCompleted = new Date();
    const timeSpent = Math.floor((timeCompleted - timeStarted) / 1000);

    try {
      const response = await axios.post('/api/attempts', {
        student_id: studentId,
        problem_id: problemId,
        module_id: moduleId,
        student_answer: answer,
        is_correct: true, // 정답 검증 로직 필요
        time_spent_seconds: timeSpent,
        started_at: timeStarted.toISOString(),
        completed_at: timeCompleted.toISOString()
      });

      setFeedback(response.data.feedback);

      // 재시도 권장 표시
      if (response.data.retry_recommendation?.should_retry) {
        alert(response.data.retry_recommendation.message);
      }

    } catch (error) {
      console.error('Failed to submit attempt:', error);
    }
  };

  return (
    <div>
      <button onClick={handleStart}>문제 풀기 시작</button>
      {/* 문제 UI */}
      {feedback && (
        <div className="feedback">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default ProblemSolver;
```

### 5.2 JavaScript (바닐라) 예제

```javascript
// 문제 시작
let startTime = null;

function startProblem() {
  startTime = new Date();
  console.log('문제 풀이 시작');
}

// 문제 제출
async function submitAnswer(studentId, problemId, answer, isCorrect) {
  const endTime = new Date();
  const timeSpent = Math.floor((endTime - startTime) / 1000);

  const response = await fetch('/api/attempts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      student_id: studentId,
      problem_id: problemId,
      student_answer: answer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString()
    })
  });

  const data = await response.json();

  // 피드백 표시
  if (data.feedback) {
    document.getElementById('feedback').innerText = data.feedback;
  }

  // 재시도 권장 표시
  if (data.retry_recommendation?.should_retry) {
    document.getElementById('retry-suggestion').innerText =
      data.retry_recommendation.message;
  }
}
```

---

## 6. 개선 수준 가이드

| 개선율 | 수준 | 메시지 |
|--------|------|--------|
| ≥ 30% | Excellent | "놀라워요! 첫 시도보다 XX초나 빨라졌어요!" |
| 15-29% | Good | "잘했어요! XX초 더 빨라졌어요!" |
| 5-14% | Fair | "좋아요! XX초 빨라졌어요." |
| -5 to 5% | No Change | "비슷한 시간이 걸렸어요." |
| < -5% | Slower | "이번에는 더 오래 걸렸어요." |

---

## 7. 보안 고려사항

### 7.1 OAuth 서명 검증
- 모든 LTI 요청은 HMAC-SHA1 서명으로 검증
- Timestamp와 Nonce로 재생 공격(Replay Attack) 방지

### 7.2 세션 관리
- 세션 타임아웃: 1시간 (기본값)
- 안전한 랜덤 토큰 생성

### 7.3 데이터베이스 보안
- Prepared Statements로 SQL Injection 방지
- 민감 정보 암호화 저장

---

## 8. 문제 해결

### 8.1 LTI 검증 실패

**증상:** "Invalid LTI request" 오류

**해결 방법:**
1. Consumer Key와 Shared Secret 확인
2. 서버 시간 동기화 확인 (NTP)
3. OAuth 서명 메서드 확인 (HMAC-SHA1)

### 8.2 성적 동기화 실패

**증상:** Moodle에 성적이 나타나지 않음

**해결 방법:**
1. Moodle Web Service 활성화 확인
2. `moodle_grade_sync` 테이블의 `sync_status` 확인
3. 로그 파일 확인: `/var/log/php-errors.log`

### 8.3 데이터베이스 연결 오류

**증상:** "Database connection failed"

**해결 방법:**
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u your_db_user -p -h localhost -e "SELECT 1"

# 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON alt42_education.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 9. 성능 최적화

### 9.1 데이터베이스 인덱스

주요 인덱스는 스키마에 포함되어 있습니다:
- `idx_student_problem` (student_id, problem_id)
- `idx_student_attempts` (student_id, problem_id, attempt_number)
- `idx_improvement` (is_improving)

### 9.2 캐싱 전략

Redis를 사용한 세션 캐싱 (선택사항):
```php
// Redis 연결
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

// 세션 저장
$redis->setex("session:{$sessionToken}", 3600, json_encode($sessionData));
```

---

## 10. 테스트

### 10.1 단위 테스트

```bash
# PHPUnit 설치
composer require --dev phpunit/phpunit

# 테스트 실행
./vendor/bin/phpunit tests/
```

### 10.2 통합 테스트

```bash
# API 헬스 체크
curl http://localhost/api/health

# LTI Launch 시뮬레이션
curl -X POST http://localhost/api/lti/launch \
  -d "lti_message_type=basic-lti-launch-request" \
  -d "lti_version=LTI-1p0" \
  -d "user_id=test_student"
```

---

## 11. 지원 및 문의

문제가 발생하거나 도움이 필요하면:

- **이슈 트래커**: https://github.com/your-org/alt42/issues
- **이메일**: support@alt42.com
- **문서**: https://docs.alt42.com

---

## 12. 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

Copyright (c) 2025 ALT42 Education
