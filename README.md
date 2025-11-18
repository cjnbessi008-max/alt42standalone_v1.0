# Chaos Harmony 🎨

규칙성 없는 듯한 패턴 속에서 발견하는 학습의 감성

**Chaos Harmony**는 Moodle LMS와 연동하여 학생들의 학습 패턴을 감성적으로 시각화하는 웹 애플리케이션입니다. 겉으로는 무작위처럼 보이지만 실제로는 의미있는 패턴을 담고 있는 시각화를 통해 학습의 리듬을 발견합니다.

## ✨ 주요 기능

- 📱 **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 표시되는 인터페이스
- 🌊 **Chaos Harmony 시각화**: 불규칙해 보이지만 패턴이 있는 학습 데이터의 감성적 표현
- 🔗 **Moodle LMS 연동**: Moodle 3.7과 완벽하게 통합
- 📊 **실시간 패턴 분석**:
  - 성공 리듬 (Success Rhythm): 연속된 정답의 흐름
  - 고민의 파동 (Struggle Wave): 오답과 정답이 교차하는 패턴
  - 속도 패턴 (Speed Pattern): 문제 풀이 속도의 변화
- 🎭 **감성 상태 표시**: 학습 상태에 따른 감정 표현 (중립, 기쁨, 몰입, 고민)

## 🏗️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Apache**: 2.4

### Frontend
- **HTML5/CSS3**: 모던 웹 표준
- **JavaScript (ES6+)**: Vanilla JS
- **Canvas API**: 시각화 렌더링

### Infrastructure
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 오케스트레이션

## 📋 시스템 요구사항

- Docker 20.10+
- Docker Compose 1.29+
- Moodle 3.7+ (웹 서비스 활성화 필요)
- 최소 2GB RAM
- 최소 5GB 디스크 공간

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/chaos-harmony.git
cd chaos-harmony
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 Moodle 설정 입력
nano .env
```

**중요**: `.env` 파일에서 다음 항목을 반드시 설정하세요:

```env
# Moodle 서버 URL
MOODLE_URL=http://your-moodle-server.com/moodle

# Moodle 웹 서비스 토큰
MOODLE_TOKEN=your_web_service_token_here
```

### 3. Moodle 웹 서비스 설정

Chaos Harmony가 Moodle과 통신하려면 웹 서비스를 활성화해야 합니다:

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. 다음 단계를 따라 웹 서비스 활성화:
   - "웹 서비스 활성화" 체크
   - REST 프로토콜 활성화
   - 새 서비스 생성 (예: "Chaos Harmony Service")
   - 필요한 함수 추가:
     - `mod_quiz_get_quizzes_by_courses`
     - `mod_quiz_get_user_attempts`
     - `mod_quiz_get_attempt_data`
     - `mod_quiz_get_attempt_review`
4. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**에서 토큰 생성
5. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 4. Docker로 실행

```bash
# 컨테이너 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 5. 애플리케이션 접속

- **메인 애플리케이션**: http://localhost:8080
- **phpMyAdmin** (데이터베이스 관리): http://localhost:8081

## 📖 사용 방법

### 기본 사용법

1. 브라우저에서 http://localhost:8080 접속
2. **학생 ID**와 **퀴즈 ID** 입력
3. **"퀴즈 불러오기"** 버튼 클릭
4. 우측 하단의 가상 스마트폰 화면에서 Chaos Harmony 시각화 확인

### Moodle과 동기화

처음 퀴즈를 불러올 때는 Moodle에서 데이터를 동기화해야 합니다:

1. **퀴즈 ID** 입력
2. **"Moodle 동기화"** 버튼 클릭
3. 동기화 완료 후 **"퀴즈 불러오기"** 실행

### 데모 모드

Moodle 연동 없이 테스트하려면 브라우저 콘솔에서:

```javascript
enableDemoMode()
```

## 🗂️ 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── api/
│   │   ├── config.php           # 데이터베이스 및 설정
│   │   ├── moodle_api.php       # Moodle API 연동
│   │   └── quiz_api.php         # REST API 엔드포인트
│   └── database/
│       └── schema.sql            # MySQL 데이터베이스 스키마
├── frontend/
│   ├── index.html               # 메인 HTML
│   ├── css/
│   │   ├── style.css            # 메인 스타일
│   │   └── smartphone.css       # 가상 스마트폰 UI 스타일
│   └── js/
│       ├── api-client.js        # API 클라이언트
│       ├── chaos-harmony.js     # 시각화 엔진
│       └── app.js               # 메인 애플리케이션 로직
├── docker-compose.yml           # Docker Compose 설정
├── Dockerfile                   # PHP/Apache 이미지
├── .env.example                 # 환경 변수 예시
└── README.md                    # 이 파일
```

## 🎨 시각화 패턴 설명

### 성공 리듬 (Success Rhythm)
- **색상**: 초록색
- **의미**: 연속된 정답으로 만들어지는 학습의 흐름
- **시각화**: 부드러운 물결 패턴

### 고민의 파동 (Struggle Wave)
- **색상**: 빨간색
- **의미**: 오답과 정답이 교차하며 나타나는 학습의 어려움
- **시각화**: 불규칙한 간섭 패턴

### 속도 패턴 (Speed Pattern)
- **색상**: 파란색
- **의미**: 문제 풀이 속도의 변화
- **시각화**: 맥동하는 원형 패턴

## 🔧 API 엔드포인트

### `GET /backend/api/quiz_api.php?action=questions`
퀴즈 문제 목록 조회

**Parameters:**
- `quiz_id` (required): 퀴즈 ID

### `GET /backend/api/quiz_api.php?action=attempts`
학생 응답 내역 조회

**Parameters:**
- `student_id` (required): 학생 ID
- `quiz_id` (optional): 퀴즈 ID

### `GET /backend/api/quiz_api.php?action=patterns`
학습 패턴 분석 결과 조회

**Parameters:**
- `student_id` (required): 학생 ID

### `POST /backend/api/quiz_api.php?action=sync`
Moodle에서 퀴즈 데이터 동기화

**Body:**
```json
{
  "quiz_id": 123
}
```

## 🐛 문제 해결

### Moodle 연동 실패

**증상**: "Moodle error: Invalid token" 에러

**해결책**:
1. `.env` 파일의 `MOODLE_TOKEN`이 올바른지 확인
2. Moodle에서 해당 토큰이 활성화되어 있는지 확인
3. 웹 서비스가 활성화되어 있는지 확인

### 데이터베이스 연결 실패

**증상**: "Database connection failed" 에러

**해결책**:
```bash
# MySQL 컨테이너 상태 확인
docker-compose ps

# MySQL 로그 확인
docker-compose logs mysql

# 컨테이너 재시작
docker-compose restart mysql
```

### 시각화가 표시되지 않음

**증상**: 가상 스마트폰 화면이 비어있음

**해결책**:
1. 브라우저 콘솔에서 JavaScript 에러 확인
2. 학생 ID와 퀴즈 ID가 올바른지 확인
3. 데모 모드로 테스트: `enableDemoMode()`

## 🔒 보안 고려사항

- **프로덕션 환경**에서는 반드시 다음을 수정하세요:
  - `.env` 파일의 모든 비밀번호 변경
  - `ALLOWED_ORIGINS`를 특정 도메인으로 제한
  - HTTPS 사용
  - Moodle 토큰을 안전하게 보관

## 📝 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.

---

**Chaos Harmony** - 학습의 패턴을 감성으로 표현하다
