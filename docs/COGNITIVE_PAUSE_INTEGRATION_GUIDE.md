# Cognitive Pause Visualization - Integration Guide

## 📋 목차 (Table of Contents)

1. [시스템 개요](#시스템-개요)
2. [시스템 요구사항](#시스템-요구사항)
3. [데이터베이스 설치](#데이터베이스-설치)
4. [Moodle 플러그인 설치](#moodle-플러그인-설치)
5. [프론트엔드 설치](#프론트엔드-설치)
6. [설정 및 구성](#설정-및-구성)
7. [사용 방법](#사용-방법)
8. [트러블슈팅](#트러블슈팅)
9. [API 문서](#api-문서)

---

## 🧠 시스템 개요

### 개요

**Cognitive Pause Visualization** 시스템은 Moodle LMS와 통합되어 학습자가 문제를 풀 때 뇌가 멈추는 지점(인지 멈춤)을 실시간으로 추적하고 시각화하는 교육 분석 도구입니다.

### 주요 기능

- ✅ **실시간 멈춤 추적**: 학습자의 키보드/마우스 활동을 모니터링하여 멈춤 감지
- ✅ **멈춤 유형 분류**: 사고(thinking), 혼란(confusion), 산만함(distraction), 재독(re-reading)으로 자동 분류
- ✅ **시각화 대시보드**: 히트맵, 타임라인, 분포도 등 다양한 시각화 제공
- ✅ **학생 프로필링**: 개별 학생의 인지 패턴 및 학습 스타일 분석
- ✅ **문제 난이도 분석**: 문제별 멈춤 패턴으로 난이도 평가
- ✅ **위험 학생 식별**: 인지 부하가 높은 학생 자동 식별
- ✅ **선생님 대시보드**: 실시간 학습 분석 및 개입 권장사항 제공

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Moodle LMS (PHP 7.1.9)                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Cognitive Pause Tracking Plugin            │    │
│  │  - JavaScript Tracker (client-side)                │    │
│  │  - AJAX API (server-side)                          │    │
│  │  - Database Access Layer                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/AJAX
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MySQL 5.7 Database                         │
│  - cognitive_pause_events                                   │
│  - cognitive_pause_analytics                                │
│  - question_pause_patterns                                  │
│  - student_cognitive_profiles                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             React Frontend Dashboard (Optional)             │
│  - Teacher Dashboard                                        │
│  - Student Cognitive Profiles                               │
│  - Visualization Components (D3.js)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 시스템 요구사항

### 필수 요구사항

| 구성 요소 | 버전 | 설명 |
|-----------|------|------|
| **Moodle** | 3.7+ | LMS 플랫폼 |
| **MySQL** | 5.7+ | 데이터베이스 |
| **PHP** | 7.1.9+ | 서버 사이드 스크립트 |
| **Apache/Nginx** | 최신 | 웹 서버 |

### 선택 사항 (React 대시보드)

| 구성 요소 | 버전 | 설명 |
|-----------|------|------|
| **Node.js** | 16+ | JavaScript 런타임 |
| **React** | 18+ | 프론트엔드 프레임워크 |
| **D3.js** | 7+ | 데이터 시각화 라이브러리 |

### 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 💾 데이터베이스 설치

### 1단계: 데이터베이스 스키마 생성

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 선택 (Moodle 데이터베이스)
USE moodle;

# 스키마 스크립트 실행
SOURCE /path/to/database/schema/cognitive_pause_tracking.sql;
```

### 2단계: 스키마 확인

```sql
-- 테이블 생성 확인
SHOW TABLES LIKE 'cognitive%';

-- 결과:
-- cognitive_pause_events
-- cognitive_pause_analytics
-- question_pause_patterns
-- student_cognitive_profiles
-- pause_detection_config
-- pause_visualization_cache

-- 기본 설정 확인
SELECT * FROM pause_detection_config WHERE config_name = 'global_default';
```

### 3단계: 인덱스 확인

```sql
-- 성능 최적화를 위한 인덱스 확인
SHOW INDEX FROM cognitive_pause_events;
```

---

## 🔌 Moodle 플러그인 설치

### 1단계: 플러그인 파일 복사

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 디렉토리 생성
mkdir -p local/cogpause

# 플러그인 파일 복사
cp -r /path/to/moodle-plugin/local/cogpause/* local/cogpause/

# 권한 설정
chown -R www-data:www-data local/cogpause
chmod -R 755 local/cogpause
```

### 2단계: Moodle 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림** 으로 이동
3. 플러그인 설치 알림이 표시됩니다
4. **데이터베이스 업그레이드** 버튼 클릭
5. 설치 완료 확인

### 3단계: JavaScript AMD 모듈 빌드

```bash
# Moodle 루트에서 실행
cd /var/www/html/moodle

# Grunt를 사용하여 AMD 모듈 빌드
php admin/cli/grunt.php amd

# 또는 Node.js가 설치되어 있다면:
npm install
grunt amd
```

### 4단계: 플러그인 설정

1. **사이트 관리 > 플러그인 > 로컬 플러그인 > Cognitive Pause Tracking** 으로 이동
2. 설정 구성:

```
멈춤 추적 활성화: ✓ 체크
멈춤 기준 시간: 3000 (밀리초)
사고 기준 시간: 5000 (밀리초)
혼란 기준 시간: 15000 (밀리초)
산만함 기준 시간: 30000 (밀리초)
```

3. **변경사항 저장** 클릭

### 5단계: 권한 설정

1. **사이트 관리 > 사용자 > 권한 > 역할 정의** 로 이동
2. **선생님** 역할 편집
3. 다음 권한 추가:
   - `local/cogpause:view` - 인지 멈춤 데이터 보기
   - `local/cogpause:manage` - 인지 멈춤 설정 관리

---

## 🎨 프론트엔드 설치 (선택 사항)

React 기반 대시보드를 사용하려면 다음 단계를 따르세요.

### 1단계: Node.js 의존성 설치

```bash
cd /path/to/frontend

# 패키지 설치
npm install

# 필요한 패키지들:
# - react
# - react-dom
# - d3
# - axios
# - react-router-dom
```

### 2단계: 환경 변수 설정

`.env` 파일 생성:

```bash
# API 엔드포인트
REACT_APP_API_URL=https://your-moodle-site.com/local/cogpause/ajax.php

# Moodle 웹 루트
REACT_APP_MOODLE_URL=https://your-moodle-site.com
```

### 3단계: 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물은 build/ 디렉토리에 생성됨
```

### 4단계: 배포

```bash
# Moodle 웹 루트에 배포
cp -r build/* /var/www/html/moodle/local/cogpause/dashboard/

# 또는 별도 서버에 배포 (권장)
# nginx/apache 설정에서 reverse proxy 구성
```

---

## ⚙️ 설정 및 구성

### 퀴즈별 설정

특정 퀴즈에 대해 다른 감지 임계값을 설정할 수 있습니다:

```sql
INSERT INTO pause_detection_config (
    config_name,
    course_id,
    quiz_id,
    pause_threshold_ms,
    thinking_threshold_ms,
    confusion_threshold_ms,
    distraction_threshold_ms
) VALUES (
    'advanced_math_quiz',
    10,  -- 코스 ID
    25,  -- 퀴즈 ID
    5000,  -- 더 긴 사고 시간 허용
    10000,
    20000,
    45000
);
```

### 코스별 설정

```sql
INSERT INTO pause_detection_config (
    config_name,
    course_id,
    quiz_id,
    pause_threshold_ms
) VALUES (
    'course_10_default',
    10,  -- 코스 ID
    NULL,  -- 모든 퀴즈에 적용
    4000
);
```

### 추적 비활성화

특정 퀴즈에서 추적을 비활성화하려면:

```sql
UPDATE pause_detection_config
SET is_active = FALSE
WHERE quiz_id = 25;
```

---

## 📖 사용 방법

### 학생 관점

1. Moodle에 로그인
2. 퀴즈 시작
3. **자동으로 멈춤 추적이 시작됩니다** (백그라운드에서 실행)
4. 문제를 풀면서 평소처럼 작업
5. 화면 우측 상단에 작은 표시기가 나타날 수 있음 (디버깅 모드일 경우)

### 선생님 관점

#### 방법 1: Moodle 내장 보고서

1. Moodle 관리자/선생님으로 로그인
2. 코스 선택
3. **보고서 > Cognitive Pause Analytics** 메뉴 클릭
4. 다음 정보 확인:
   - 학생별 멈춤 패턴
   - 문제별 난이도 분석
   - 위험 학생 목록

#### 방법 2: React 대시보드 (설치된 경우)

1. 대시보드 URL 접속: `https://your-site.com/cogpause-dashboard`
2. Moodle 계정으로 로그인
3. **개요 탭**:
   - 전체 통계 확인
   - 히트맵 보기
   - 문제 난이도 차트 확인

4. **위험 학생 탭**:
   - 인지 부하가 높은 학생 식별
   - 학습 스타일 분석
   - 개입 권장사항 확인

5. **문제 분석 탭**:
   - 난이도 높은 문제 확인
   - 수정 필요 문제 표시
   - 학생별 멈춤 패턴 비교

### 시각화 해석

#### 히트맵 (Heatmap)

- **색상**: 빨간색 = 높은 멈춤 빈도, 녹색 = 낮은 멈춤 빈도
- **X축**: 시간대 (0:00 - 23:00)
- **Y축**: 문제 ID
- **용도**: 어떤 문제에서 언제 학생들이 많이 멈추는지 확인

#### 타임라인 (Timeline)

- **막대 높이**: 멈춤 지속 시간
- **색상**:
  - 🟢 녹색 = 사고 중
  - 🟠 주황색 = 혼란
  - 🔴 빨간색 = 산만함
  - 🔵 파란색 = 재독
- **용도**: 개별 학생의 문제 풀이 과정 추적

#### 인지 부하 점수

- **0-30**: 🟢 낮음 - 문제가 적절함
- **30-50**: 🟡 보통 - 적당한 도전
- **50-70**: 🟠 높음 - 어려움을 느낄 수 있음
- **70-100**: 🔴 매우 높음 - 개입 필요

---

## 🔍 트러블슈팅

### 문제 1: 멈춤이 추적되지 않음

**증상**: 학생이 퀴즈를 풀었지만 데이터베이스에 기록이 없음

**해결 방법**:

1. 플러그인 활성화 확인:
```sql
SELECT * FROM {config_plugins}
WHERE plugin = 'local_cogpause' AND name = 'enable_tracking';
-- value가 1이어야 함
```

2. JavaScript 로드 확인:
   - 브라우저 개발자 도구 (F12) 열기
   - Console 탭에서 에러 확인
   - `cogPauseTracker` 객체가 있는지 확인:
```javascript
console.log(window.cogPauseTracker);
```

3. AMD 모듈 재빌드:
```bash
php admin/cli/grunt.php amd
```

### 문제 2: AJAX 요청 실패

**증상**: Console에 AJAX 에러 표시

**해결 방법**:

1. ajax.php 파일 권한 확인:
```bash
ls -la local/cogpause/ajax.php
# -rw-r--r-- 이어야 함
```

2. PHP 에러 로그 확인:
```bash
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

3. Sesskey 확인:
```javascript
// 브라우저 콘솔에서
console.log(M.cfg.sesskey);
```

### 문제 3: 데이터베이스 성능 저하

**증상**: 대시보드 로딩이 느림

**해결 방법**:

1. 인덱스 추가 확인:
```sql
SHOW INDEX FROM cognitive_pause_events;
```

2. 오래된 데이터 정리:
```sql
-- 6개월 이상 된 데이터 삭제
DELETE FROM cognitive_pause_events
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

3. 캐시 테이블 사용:
```sql
-- 시각화 캐시 활용
SELECT * FROM pause_visualization_cache
WHERE cache_key = 'your_cache_key'
AND expires_at > NOW();
```

### 문제 4: 히트맵이 표시되지 않음

**증상**: React 대시보드에서 히트맵이 비어있음

**해결 방법**:

1. D3.js 로드 확인:
```javascript
// 브라우저 콘솔에서
console.log(d3.version);
```

2. API 응답 확인:
```bash
curl -X GET "https://your-site.com/api/cogpause/pause-events?courseId=10"
```

3. CORS 설정 (별도 서버일 경우):
```apache
# Apache .htaccess
Header set Access-Control-Allow-Origin "https://your-moodle-site.com"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

---

## 📡 API 문서

### 엔드포인트 개요

Base URL: `https://your-moodle-site.com/local/cogpause/ajax.php`

모든 요청에는 `sesskey` 파라미터가 필요합니다.

### 1. 멈춤 이벤트 저장

**POST** `/ajax.php?action=save_pause_events`

**Parameters:**
- `sesskey` (required): Moodle session key
- `events` (required): JSON 배열

**Request Body:**
```json
{
  "sesskey": "abc123",
  "action": "save_pause_events",
  "events": "[{
    \"userId\": 42,
    \"courseId\": 10,
    \"quizId\": 5,
    \"questionId\": 123,
    \"attemptId\": 456,
    \"pauseStartTime\": 1699876543000,
    \"pauseEndTime\": 1699876548000,
    \"pauseDuration\": 5000,
    \"pauseType\": \"confusion\",
    \"confidenceScore\": 0.75,
    \"sessionId\": \"sess_xyz\",
    \"mouseMovements\": [],
    \"scrollEvents\": []
  }]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saved": 1,
    "failed": 0,
    "total": 1
  }
}
```

### 2. 학생 분석 데이터 조회

**GET** `/ajax.php?action=get_student_analytics`

**Parameters:**
- `sesskey` (required)
- `userid` (required)
- `courseid` (optional)

**Response:**
```json
{
  "success": true,
  "data": [{
    "user_id": 42,
    "question_id": 123,
    "attempt_id": 456,
    "total_pauses": 8,
    "total_pause_time_ms": 45000,
    "avg_pause_duration_ms": 5625,
    "cognitive_load_score": 62.5,
    "struggle_indicator": false
  }]
}
```

### 3. 문제 패턴 조회

**GET** `/ajax.php?action=get_question_patterns`

**Parameters:**
- `sesskey` (required)
- `questionid` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "question_id": 123,
    "quiz_id": 5,
    "total_students": 25,
    "avg_pauses_per_attempt": 6.4,
    "avg_total_pause_time_ms": 38000,
    "pause_difficulty_score": 64.0,
    "needs_revision": false
  }
}
```

### 4. 학생 프로필 조회

**GET** `/ajax.php?action=get_student_profile`

**Parameters:**
- `sesskey` (required)
- `userid` (required)
- `courseid` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 42,
    "course_id": 10,
    "total_questions_attempted": 15,
    "avg_pauses_per_question": 5.2,
    "avg_pause_duration_ms": 6200,
    "avg_cognitive_load": 55.3,
    "quick_thinker": false,
    "deep_thinker": true,
    "struggling_learner": false,
    "at_risk_flag": false
  }
}
```

### 5. 위험 학생 목록 조회

**GET** `/ajax.php?action=get_at_risk_students`

**Parameters:**
- `sesskey` (required)
- `courseid` (required)

**Response:**
```json
{
  "success": true,
  "data": [{
    "user_id": 43,
    "avg_cognitive_load": 78.5,
    "questions_with_struggle": 8,
    "total_questions_attempted": 12,
    "struggling_learner": true,
    "at_risk_flag": true
  }]
}
```

---

## 🔒 보안 고려사항

### 데이터 프라이버시

1. **개인정보 보호**:
   - 학생 데이터는 Moodle 권한 시스템을 따름
   - 학생은 자신의 데이터만 조회 가능
   - 선생님은 자신이 가르치는 코스의 학생 데이터만 조회 가능

2. **데이터 암호화**:
   - HTTPS 사용 필수
   - 데이터베이스 연결은 SSL/TLS 사용 권장

3. **세션 관리**:
   - Moodle sesskey로 CSRF 방어
   - 세션 타임아웃 설정 확인

### 권한 관리

```php
// 권한 확인 예제
require_capability('local/cogpause:view', $context);
```

---

## 📊 성능 최적화

### 데이터베이스 최적화

1. **파티셔닝**:
```sql
-- 날짜별 파티셔닝 (큰 데이터셋에 권장)
ALTER TABLE cognitive_pause_events
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

2. **정기 정리 작업**:
```bash
# cron 작업 추가
0 2 * * * /usr/bin/php /var/www/html/moodle/local/cogpause/cli/cleanup.php
```

### 캐싱 전략

1. **시각화 데이터 캐싱**:
```sql
-- 캐시 저장
INSERT INTO pause_visualization_cache (
    cache_key,
    visualization_type,
    visualization_data,
    expires_at
) VALUES (
    'heatmap_course_10',
    'heatmap',
    '{"data": [...]}',
    DATE_ADD(NOW(), INTERVAL 1 HOUR)
);
```

---

## 📞 지원 및 문의

- **이슈 리포트**: GitHub Issues
- **문서**: [온라인 문서](https://docs.example.com)
- **이메일**: support@example.com

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🙏 기여

기여를 환영합니다! Pull Request를 제출해주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**버전**: 1.0.0
**최종 업데이트**: 2024-11-18
**작성자**: AI Education System Team
