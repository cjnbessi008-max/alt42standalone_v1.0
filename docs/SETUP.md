# EquaMap 설치 및 설정 가이드

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Node.js**: 16.0 이상
- **Moodle**: 3.7 이상

## 설치 순서

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql
```

### 3. 환경 설정

```bash
# 환경 설정 파일 생성
cp .env.example .env

# .env 파일 편집
# - DB_* 항목: 데이터베이스 접속 정보 입력
# - MOODLE_URL: Moodle 서버 URL
# - MOODLE_TOKEN: Moodle Web Service 토큰
```

### 4. Moodle Web Service 설정

Moodle 관리자 페이지에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
2. **웹 서비스 활성화**
3. **REST 프로토콜 활성화**
4. **서비스 생성**:
   - 이름: EquaMap Service
   - 약칭: equamap
   - 활성화됨: 예
5. **함수 추가**:
   - core_webservice_get_site_info
   - core_question_get_questions
   - mod_quiz_get_quizzes_by_courses
   - mod_quiz_get_quiz_questions
   - mod_quiz_process_attempt
6. **토큰 생성**:
   - 사용자 선택
   - 서비스: EquaMap Service
   - 토큰 복사하여 .env 파일에 입력

### 5. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 http://localhost:3000 에서 실행됩니다.

### 6. 백엔드 실행

```bash
cd backend

# PHP 내장 서버로 실행
php -S localhost:8000
```

백엔드 API는 http://localhost:8000 에서 실행됩니다.

## 사용 방법

### 기본 사용

1. 브라우저에서 http://localhost:3000 접속
2. 우측 하단 가상 스마트폰 화면에 EquaMap 표시
3. 기본적으로 샘플 방정식이 로드됨

### Moodle 연동

```javascript
// Moodle에서 특정 문제 로드
loadEquationFromMoodle(questionId)
```

## API 엔드포인트

### Moodle 연결 상태 확인
```
GET /api/moodle/health
```

### 문제 가져오기
```
GET /api/moodle/question/{questionId}
```

### 퀴즈 문제 목록
```
GET /api/moodle/quiz/{quizId}/questions
```

### 답안 제출
```
POST /api/moodle/submit
Content-Type: application/json

{
  "questionId": 123,
  "answer": {
    "attemptId": 456,
    "responses": {...}
  }
}
```

## 문제 해결

### CORS 오류
백엔드의 `index.php`에서 CORS 헤더가 올바르게 설정되어 있는지 확인하세요.

### Moodle 연결 실패
1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 방화벽 설정 확인

### 데이터베이스 연결 오류
1. MySQL 서비스가 실행 중인지 확인
2. .env 파일의 데이터베이스 정보 확인
3. 데이터베이스 권한 확인

## 개발 모드

```bash
# 프론트엔드 (Hot reload)
cd frontend
npm run dev

# 백엔드
cd backend
php -S localhost:8000
```

## 프로덕션 빌드

```bash
cd frontend
npm run build

# dist 폴더에 빌드된 파일 생성됨
```

## 라이센스

MIT License
