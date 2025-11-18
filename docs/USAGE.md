# ALT42 Filter Shrink - 사용 가이드

## 목차
1. [시스템 시작하기](#시스템-시작하기)
2. [Moodle 연동 설정](#moodle-연동-설정)
3. [Filter Shrink 사용법](#filter-shrink-사용법)
4. [API 문서](#api-문서)
5. [문제 해결](#문제-해결)

---

## 시스템 시작하기

### 1. 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 Moodle URL과 토큰을 설정합니다:

```env
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_token_here
```

### 2. Docker로 시스템 시작

```bash
cd docker
docker-compose up -d
```

이 명령어로 다음 서비스들이 시작됩니다:
- **MySQL 5.7**: 포트 3306
- **PHP 7.1.9 Apache**: 포트 8080
- **React 프론트엔드**: 포트 3000

### 3. 데이터베이스 초기화

컨테이너가 시작되면 자동으로 스키마가 생성됩니다.
시드 데이터를 추가하려면:

```bash
docker exec -it alt42-mysql mysql -u alt42_user -palt42_pass alt42_lms < database/seeds/001_seed_filter_definitions.sql
```

### 4. 시스템 접속

- **프론트엔드 (가상 스마트폰 UI)**: http://localhost:3000
- **백엔드 API**: http://localhost:8080/api

---

## Moodle 연동 설정

### 1. Moodle Web Service 활성화

Moodle 관리자 계정으로 로그인:

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 사용" 체크
   - 저장

2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스 관리**
   - "사용자 지정 서비스 추가" 클릭
   - 이름: "ALT42 LMS Integration"
   - 활성화됨: 체크
   - 저장

3. **기능 추가**
   - 생성한 서비스 선택
   - 다음 기능들을 추가:
     - `core_course_get_courses`
     - `core_enrol_get_enrolled_users`
     - `core_question_get_questions`
     - `core_question_get_categories`
     - `core_user_get_users`
     - `core_webservice_get_site_info`

4. **토큰 생성**
   - **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 추가" 클릭
   - 사용자 선택 (관리자 권한)
   - 서비스: "ALT42 LMS Integration"
   - 저장 후 생성된 토큰을 복사하여 `.env` 파일에 추가

### 2. 연결 테스트

```bash
curl http://localhost:8080/api/moodle/test
```

응답 예시:
```json
{
  "success": true,
  "sitename": "My Moodle Site",
  "version": "2021051700",
  "username": "admin"
}
```

### 3. 데이터 동기화

#### 문제 동기화
```bash
curl -X POST http://localhost:8080/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "questions"}'
```

#### 사용자 동기화
```bash
curl -X POST http://localhost:8080/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "users"}'
```

#### 전체 동기화
```bash
curl -X POST http://localhost:8080/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

---

## Filter Shrink 사용법

### 개념

Filter Shrink는 **순차적 필터링**을 통해 문제 선택 범위를 점진적으로 좁혀가는 시스템입니다.

#### 예시 흐름:
```
전체 문제 (1000개)
  ↓ [학년 필터: 3학년]
300개 남음
  ↓ [과목 필터: 수학]
100개 남음
  ↓ [난이도 필터: 중급]
30개 남음
  ↓ [주제 필터: 분수]
10개 남음
  ↓ [문제 선택]
최종 5개 문제
```

### 사용자 인터페이스

1. **세션 시작**
   - 앱 접속 시 자동으로 새 세션 생성
   - 초기 문제 수 표시

2. **필터 적용**
   - 카테고리별로 옵션 선택
   - 각 옵션에는 해당 필터 적용 시 남는 문제 수 표시
   - 선택 즉시 필터 적용 및 카운트 업데이트

3. **되돌리기**
   - "← 되돌리기" 버튼으로 마지막 필터 제거
   - 원하는 단계로 돌아가서 다시 선택 가능

4. **히스토리 보기**
   - "히스토리 보기" 버튼으로 전체 필터 적용 과정 확인
   - 각 단계별 남은 문제 수 확인

5. **문제 선택**
   - 원하는 수준까지 필터링 후 "문제 선택하기" 클릭
   - 필터링된 문제 중 랜덤으로 문제 제시

6. **새로 시작**
   - "처음부터 다시" 버튼으로 세션 리셋
   - 모든 필터 초기화

### 프로그래밍 방식 사용

#### 세션 시작
```javascript
const response = await fetch('http://localhost:8080/api/filters/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ student_id: 1 })
});
const data = await response.json();
console.log(data.session.session_token);
```

#### 필터 적용
```javascript
const response = await fetch('http://localhost:8080/api/filters/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_token: 'your_session_token',
    filter_key: 'grade_level',
    filter_value: '3'
  })
});
const data = await response.json();
console.log(`남은 문제: ${data.current_count}개`);
```

---

## API 문서

### Filter Shrink API

#### `GET /api/filters/available`
사용 가능한 모든 필터 목록 조회

**응답:**
```json
{
  "success": true,
  "filters": [
    {
      "id": 1,
      "filter_name": "학년",
      "filter_key": "grade_level",
      "options": [
        { "option_value": "1", "option_label": "1학년", "problem_count": 120 },
        { "option_value": "2", "option_label": "2학년", "problem_count": 150 }
      ]
    }
  ]
}
```

#### `POST /api/filters/start`
새 필터 세션 시작

**요청:**
```json
{
  "student_id": 1
}
```

**응답:**
```json
{
  "success": true,
  "session": {
    "session_id": 123,
    "session_token": "abc123...",
    "initial_count": 1000,
    "available_filters": [...]
  }
}
```

#### `POST /api/filters/apply`
필터 적용

**요청:**
```json
{
  "session_token": "abc123...",
  "filter_key": "grade_level",
  "filter_value": "3"
}
```

**응답:**
```json
{
  "success": true,
  "filter_applied": "grade_level",
  "value": "3",
  "previous_count": 1000,
  "current_count": 300,
  "reduction_percentage": 70
}
```

#### `POST /api/filters/remove`
마지막 필터 제거 (되돌리기)

**요청:**
```json
{
  "session_token": "abc123..."
}
```

#### `POST /api/filters/select`
필터링된 문제 선택

**요청:**
```json
{
  "session_token": "abc123...",
  "count": 5
}
```

**응답:**
```json
{
  "success": true,
  "selected_problems": [
    {
      "id": 123,
      "title": "분수의 덧셈",
      "question_text": "1/2 + 1/3 = ?",
      "difficulty_level": "medium"
    }
  ]
}
```

### Moodle API

#### `GET /api/moodle/test`
Moodle 연결 테스트

#### `POST /api/moodle/sync`
Moodle 데이터 동기화

**요청:**
```json
{
  "type": "questions|users|full",
  "category_id": 123
}
```

#### `GET /api/moodle/courses`
Moodle 코스 목록 조회

#### `GET /api/moodle/sync-log`
동기화 로그 조회

### Problems API

#### `GET /api/problems/list?limit=10&offset=0`
문제 목록 조회

#### `GET /api/problems/get/{id}`
특정 문제 조회

#### `POST /api/problems/submit`
답안 제출

**요청:**
```json
{
  "student_id": 1,
  "problem_id": 123,
  "answer": "5/6",
  "session_id": 456,
  "time_spent": 120
}
```

#### `GET /api/problems/search?q=fraction`
문제 검색

---

## 문제 해결

### Docker 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 상태 확인
docker exec -it alt42-mysql mysql -u root -proot_password

# 데이터베이스 생성 확인
SHOW DATABASES;
USE alt42_lms;
SHOW TABLES;
```

### Moodle 연결 실패

1. Moodle URL이 정확한지 확인
2. 웹 서비스 토큰이 유효한지 확인
3. Moodle 웹 서비스 기능이 활성화되어 있는지 확인
4. 네트워크 연결 확인

### 프론트엔드가 백엔드에 연결되지 않는 경우

1. `.env` 파일의 `REACT_APP_API_URL` 확인
2. 백엔드가 8080 포트에서 실행 중인지 확인
3. CORS 설정 확인

### 필터 적용 시 문제가 0개가 되는 경우

1. Moodle 동기화가 완료되었는지 확인
2. 문제에 필터 태그가 올바르게 설정되어 있는지 확인
3. 데이터베이스에 `problem_filters` 데이터가 있는지 확인:

```sql
SELECT COUNT(*) FROM problem_filters;
SELECT filter_key, filter_value, COUNT(*) as count
FROM problem_filters
GROUP BY filter_key, filter_value;
```

---

## 개발자 모드

### 백엔드 로그 확인

```bash
docker-compose logs -f php
```

### 프론트엔드 개발 서버

```bash
cd frontend
npm install
npm start
```

### 데이터베이스 직접 접속

```bash
docker exec -it alt42-mysql mysql -u alt42_user -palt42_pass alt42_lms
```

### API 테스트 (curl)

```bash
# 세션 시작
curl -X POST http://localhost:8080/api/filters/start \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1}'

# 필터 적용
curl -X POST http://localhost:8080/api/filters/apply \
  -H "Content-Type: application/json" \
  -d '{"session_token": "TOKEN", "filter_key": "grade_level", "filter_value": "3"}'
```

---

## 추가 지원

문제가 해결되지 않으면:
1. GitHub Issues 등록
2. 로그 파일 첨부
3. 재현 가능한 단계 설명
