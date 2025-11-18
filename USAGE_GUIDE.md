# LMS 문제 추적기 사용 가이드

## 목차
1. [시스템 개요](#시스템-개요)
2. [사전 준비](#사전-준비)
3. [설치 및 실행](#설치-및-실행)
4. [Moodle 설정](#moodle-설정)
5. [사용 방법](#사용-방법)
6. [API 가이드](#api-가이드)
7. [문제 해결](#문제-해결)

---

## 시스템 개요

LMS 문제 추적기는 Moodle LMS와 연동하여 학생들이 오늘 해결한 문제를 수집하고, Claude AI를 활용해 각 문제의 추론 구조를 분석하여 시각화하는 독립형 웹 애플리케이션입니다.

### 주요 기능
- ✅ Moodle에서 오늘 푼 문제 자동 동기화
- 🧠 AI 기반 문제 추론 구조 생성
- 📊 학습 패턴 분석 및 인사이트 제공
- 📈 학습 추세 시각화
- 💡 개인화된 학습 추천

---

## 사전 준비

### 1. 필수 소프트웨어
- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상

### 2. 필요한 계정 및 정보
- **Moodle 인스턴스**: 버전 3.7 이상
  - 관리자 권한 또는 Web Services 토큰 생성 권한
- **Anthropic API Key**: Claude API 사용을 위한 키
  - [Anthropic Console](https://console.anthropic.com/)에서 발급

### 3. 시스템 요구사항
- **CPU**: 2 코어 이상
- **메모리**: 4GB 이상
- **디스크**: 10GB 이상 여유 공간

---

## 설치 및 실행

### 1. 저장소 클론
```bash
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**`.env` 파일 설정 예시:**
```env
# MySQL
DB_NAME=lms_tracker
DB_USER=lmsuser
DB_PASSWORD=MySecurePassword123!

# Moodle
MOODLE_URL=https://moodle.example.com
MOODLE_TOKEN=abc123def456ghi789jkl
MOODLE_SERVICE=moodlemobile

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xyz...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
```

### 3. Docker Compose로 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### 4. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## Moodle 설정

### 1. Web Services 활성화

**경로**: 관리 > 사이트 관리 > 고급 기능

- ✅ "웹 서비스 사용" 체크
- 저장

### 2. 외부 서비스 생성

**경로**: 관리 > 사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스

1. **"서비스 추가"** 클릭
2. 다음 정보 입력:
   - 이름: `LMS Problem Tracker`
   - 짧은 이름: `lms_tracker`
   - ✅ 활성화됨 체크

### 3. 필요한 함수 추가

생성한 서비스에서 **"함수"** 탭으로 이동하여 다음 함수들을 추가:

```
core_user_get_users_by_field
core_enrol_get_users_courses
core_course_get_courses
mod_quiz_get_quizzes_by_courses
mod_quiz_get_user_attempts
mod_quiz_get_attempt_data
```

### 4. 토큰 생성

**경로**: 관리 > 사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리

1. **"토큰 생성"** 클릭
2. 설정:
   - 사용자: 관리자 또는 권한이 있는 사용자
   - 서비스: `LMS Problem Tracker`
3. **저장**
4. 생성된 토큰을 복사하여 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 5. 권한 확인

토큰을 사용할 사용자에게 다음 권한이 있는지 확인:
- `webservice/rest:use`
- 코스 및 퀴즈 조회 권한

---

## 사용 방법

### 1. 첫 로그인

1. http://localhost:3000 접속
2. 초기에는 학생 정보가 없으므로, 먼저 **Moodle 동기화** 필요

### 2. Moodle 동기화

**API를 통한 동기화:**
```bash
# Moodle 사용자 ID가 123인 학생의 오늘 문제 동기화
curl http://localhost:5000/api/problems/today/123
```

**응답 예시:**
```json
{
  "success": true,
  "message": "5/5개 문제 처리 완료",
  "problemCount": 5,
  "successCount": 5
}
```

### 3. 학생 ID 확인

동기화 후 DB에서 생성된 학생 UUID 확인:

```bash
# MySQL 컨테이너 접속
docker-compose exec mysql mysql -u lmsuser -p lms_tracker

# 학생 목록 조회
SELECT id, moodle_user_id, username, full_name FROM students;
```

출력 예시:
```
+--------------------------------------+----------------+----------+-----------+
| id                                   | moodle_user_id | username | full_name |
+--------------------------------------+----------------+----------+-----------+
| 123e4567-e89b-12d3-a456-426614174000 | 123            | student1 | 홍길동    |
+--------------------------------------+----------------+----------+-----------+
```

### 4. 웹 대시보드 로그인

1. 복사한 `id` (UUID)를 "학생 ID" 필드에 입력
2. Moodle 사용자 ID (`123`)를 "Moodle 사용자 ID" 필드에 입력
3. **로그인** 클릭

### 5. 대시보드 사용

#### 5.1 오늘의 학습 요약
- 총 문제 수, 정답/오답, 정답률, 소요 시간 확인

#### 5.2 학습 인사이트
- AI가 생성한 학습 패턴 분석
- 강점/약점 분석
- 개념 숙달도
- 추천 학습 방향

#### 5.3 문제 목록
- 오늘 푼 문제 전체 목록
- 각 문제 클릭 시 상세 추론 구조 확인:
  - 문제 정보
  - 추론 단계
  - 학생 풀이 분석
  - 관련 개념
  - 추천 학습 주제

#### 5.4 학습 추세
- 최근 7일간의 정답률 추이
- 일별 문제 풀이 개수

---

## API 가이드

### 인증
현재 버전에서는 인증이 구현되지 않았습니다. 프로덕션 환경에서는 JWT 또는 OAuth 인증 추가 권장.

### 주요 엔드포인트

#### 1. 오늘 푼 문제 동기화
```http
GET /api/problems/today/:moodleUserId
```

**파라미터:**
- `moodleUserId` (number): Moodle 사용자 ID

**응답:**
```json
{
  "success": true,
  "data": {
    "message": "5/5개 문제 처리 완료",
    "problemCount": 5,
    "successCount": 5,
    "results": [...]
  }
}
```

#### 2. 오늘 푼 문제 목록 조회
```http
GET /api/problems/student/:studentId/today
```

**파라미터:**
- `studentId` (UUID): 학생 UUID

**응답:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "problemId": "...",
      "questionText": "2/3 + 1/4 = ?",
      "isCorrect": true,
      "reasoning": {
        "concepts": ["분수의 덧셈", "통분"],
        "reasoningSteps": [...]
      }
    }
  ]
}
```

#### 3. 학습 패턴 조회
```http
GET /api/analytics/student/:studentId/pattern?date=2024-01-15
```

**파라미터:**
- `studentId` (UUID): 학생 UUID
- `date` (optional): YYYY-MM-DD 형식 (기본값: 오늘)

**응답:**
```json
{
  "success": true,
  "data": {
    "patternId": "...",
    "statistics": {
      "totalProblems": 5,
      "accuracyRate": 80
    },
    "insights": {
      "overallPerformance": {...},
      "recommendations": {...}
    }
  }
}
```

#### 4. 학습 추세 조회
```http
GET /api/analytics/student/:studentId/trends?days=7
```

**응답:**
```json
{
  "success": true,
  "period": "7 days",
  "data": [
    {
      "date": "2024-01-10",
      "totalProblems": 3,
      "accuracyRate": 66.67
    }
  ]
}
```

---

## 문제 해결

### 1. MySQL 연결 실패
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**해결:**
```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# MySQL 재시작
docker-compose restart mysql
```

### 2. Moodle API 오류
```
Moodle API Error: Invalid token
```

**해결:**
- `.env` 파일의 `MOODLE_TOKEN` 확인
- Moodle에서 토큰이 활성화되어 있는지 확인
- 토큰에 할당된 서비스에 필요한 함수가 모두 포함되어 있는지 확인

### 3. Claude API 오류
```
AI 추론 구조 생성 실패: Invalid API key
```

**해결:**
- `.env` 파일의 `ANTHROPIC_API_KEY` 확인
- [Anthropic Console](https://console.anthropic.com/)에서 API 키 유효성 확인
- API 사용량 확인 (할당량 초과 여부)

### 4. 동기화 시 문제가 없음
```
message: "오늘 푼 문제가 없습니다"
```

**원인:**
- 실제로 오늘 퀴즈를 풀지 않았음
- 퀴즈 시도 시간이 오늘이 아님
- Moodle 사용자 ID가 잘못됨

**확인:**
```bash
# Moodle에서 특정 사용자의 퀴즈 시도 기록 확인
# (Moodle 관리자 패널 > 보고서 > 퀴즈 보고서)
```

### 5. 프론트엔드 빌드 오류
```bash
# 프론트엔드 컨테이너 재빌드
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### 6. 전체 시스템 재시작
```bash
# 모든 컨테이너 중지 및 제거
docker-compose down

# 볼륨 포함 제거 (데이터베이스 초기화)
docker-compose down -v

# 재시작
docker-compose up -d
```

---

## 고급 설정

### 개발 모드 실행

**백엔드:**
```bash
cd backend
npm install
cp .env.example .env
# .env 파일 편집
npm run dev
```

**프론트엔드:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 데이터베이스 백업
```bash
# 백업
docker-compose exec mysql mysqldump -u lmsuser -p lms_tracker > backup.sql

# 복원
docker-compose exec -T mysql mysql -u lmsuser -p lms_tracker < backup.sql
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

---

## 추가 리소스

- [Moodle Web Services 문서](https://docs.moodle.org/dev/Web_services)
- [Anthropic Claude API 문서](https://docs.anthropic.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)

---

## 지원

문제가 발생하거나 질문이 있으면 GitHub Issues를 통해 문의해주세요.
