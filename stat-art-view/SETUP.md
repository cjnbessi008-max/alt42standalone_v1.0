# Stat Art View - 설치 및 실행 가이드

## 📋 사전 요구사항

- **Docker** 및 **Docker Compose** 설치
- **Node.js** 16+ (로컬 개발 시)
- **Moodle 3.7** 설치 및 Web Service API 활성화
- **MySQL 5.7** 접근 권한

## 🚀 빠른 시작 (Docker)

### 1. 저장소 클론 및 이동

```bash
cd stat-art-view
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 Moodle 정보 입력:

```env
MOODLE_URL=https://your-moodle.com
MOODLE_TOKEN=your_api_token_here
```

### 3. Docker 컨테이너 실행

```bash
docker-compose up -d
```

### 4. 샘플 데이터 로드 (선택사항)

```bash
# MySQL 컨테이너에 접속
docker exec -it stat-art-mysql mysql -u moodle -pmoodlepass moodle

# 샘플 데이터 실행
SOURCE /docker-entrypoint-initdb.d/sample-data.sql;
exit
```

### 5. 애플리케이션 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🛠️ 로컬 개발 모드

Docker 없이 로컬에서 개발하는 경우:

### Backend 실행

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 입력)
npm run dev
```

### Frontend 실행

```bash
cd frontend
npm install
npm start
```

## 📊 Moodle Web Service 설정

### 1. Moodle 관리자 로그인

### 2. Web Services 활성화

**사이트 관리 → 고급 기능**
- ✅ "Enable web services" 체크

### 3. 외부 서비스 생성

**사이트 관리 → 플러그인 → Web services → 외부 서비스**

"서비스 추가" 클릭 후 다음 설정:

- **이름**: Stat Art View API
- **짧은 이름**: stat_art_api
- **활성화**: ✅

### 4. 필요한 함수 추가

생성한 서비스에 다음 함수들을 추가:

- `core_webservice_get_site_info`
- `mod_quiz_get_quizzes_by_courses`
- `core_course_get_courses`
- `core_user_get_users`
- `mod_quiz_get_user_attempts`

### 5. 토큰 생성

**사이트 관리 → 플러그인 → Web services → 토큰 관리**

"토큰 추가" 클릭:

- **사용자**: 관리자 또는 특정 사용자
- **서비스**: Stat Art View API
- **토큰 생성** 클릭

생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

## 🔧 데이터베이스 직접 연결

기존 Moodle MySQL DB에 직접 연결하는 경우:

### docker-compose.yml 수정

```yaml
services:
  backend:
    environment:
      DB_HOST: your-moodle-db-host
      DB_USER: moodle_user
      DB_PASSWORD: your_password
      DB_NAME: moodle
      DB_PORT: 3306
```

MySQL 서비스를 제거하고 외부 DB 사용 가능

## 📱 기능 테스트

### 1. API 연결 테스트

```bash
curl http://localhost:3001/health
```

### 2. Moodle 연결 테스트

```bash
curl http://localhost:3001/api/moodle/test
```

### 3. 통계 데이터 조회 (퀴즈 ID: 100)

```bash
curl http://localhost:3001/api/stats/quiz/100
```

### 4. Stat Art 데이터 조회

```bash
curl http://localhost:3001/api/stats/artdata/100
```

## 🎨 화면 구성

### 데스크톱 뷰
- 좌측 상단: 헤더 및 퀴즈 선택기
- 중앙: 3가지 시각화 차트
  - 방사형 정답률 차트 🌸
  - 파티클 플로우 ✨
  - 문제 연관성 네트워크 🕸️

### 모바일 뷰포트 (우측 하단)
- 스마트폰 화면 모양의 위젯
- 3개 탭 전환:
  - 차트 탭: 미니 방사형 차트
  - 통계 탭: 요약 통계 카드
  - 효과 탭: 파티클 리스트

## 🐛 문제 해결

### MySQL 연결 오류

```bash
# MySQL 컨테이너 로그 확인
docker logs stat-art-mysql

# MySQL 재시작
docker-compose restart mysql
```

### Backend 오류

```bash
# Backend 로그 확인
docker logs stat-art-backend

# Backend 재시작
docker-compose restart backend
```

### Moodle API 오류

1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. 필요한 API 함수들이 서비스에 추가되었는지 확인
4. 방화벽에서 Moodle 서버로의 연결이 허용되는지 확인

### 포트 충돌

이미 포트가 사용 중인 경우 `docker-compose.yml`에서 포트 변경:

```yaml
services:
  frontend:
    ports:
      - "3002:3000"  # 3000 → 3002로 변경
  backend:
    ports:
      - "3003:3001"  # 3001 → 3003으로 변경
```

## 📚 API 문서

### GET /api/stats/quiz/:quizId
퀴즈 전체 통계 조회

### GET /api/stats/student/:studentId
학생별 통계 조회

### GET /api/stats/course/:courseId
코스 전체 통계 조회

### GET /api/stats/heatmap/:courseId
활동 히트맵 데이터 조회

### GET /api/stats/artdata/:quizId
Stat Art View용 특화 데이터 조회 (시각화용)

### GET /api/moodle/test
Moodle 연결 테스트

## 📞 지원

문제가 발생하면 GitHub Issues에 보고해주세요.

## 📄 라이선스

MIT License

---

**KAIST Touch Math Academy - AI Education System Team**
