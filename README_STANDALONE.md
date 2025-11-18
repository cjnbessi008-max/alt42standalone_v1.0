# 🎓 AI Education System - Standalone Moodle LMS Integration

독립형 웹 애플리케이션: Moodle 3.7 LMS와 연동하여 문제를 역으로 재구성하는 플랫폼

## 개요

이 애플리케이션은 Moodle LMS의 문제 은행에서 문제를 가져와 다양한 교육적 전략으로 재구성합니다:

- **역순 풀이**: 답에서 문제로 거꾸로 구성
- **분해 재조합**: 문제를 구성요소로 분해하고 다시 조립
- **복잡도 변형**: 쉬운/어려운 버전 생성
- **패턴 추출**: 문제 패턴을 추출하여 새로운 맥락에 적용

## 시스템 요구사항

### 필수 요구사항
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Moodle**: 3.7+ (Web Services 활성화)
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 시스템 리소스
- **CPU**: 2 코어 이상
- **RAM**: 4GB 이상
- **디스크**: 10GB 여유 공간

## 빠른 시작 (5분 안에!)

### 1단계: 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (필수!)
nano .env  # 또는 원하는 에디터 사용
```

**필수 설정**:
```bash
MOODLE_BASE_URL=https://your-moodle-site.com
MOODLE_WS_TOKEN=your_webservice_token_here
```

### 3단계: 실행!

```bash
./start.sh
```

서비스가 시작되면 자동으로 다음 주소에서 접속 가능합니다:
- **웹 UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 📖 상세 사용 가이드

### Moodle Web Services 설정

#### 1. Web Services 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 → 고급 기능**
3. **"웹 서비스 활성화"** 체크
4. 변경사항 저장

#### 2. 외부 서비스 생성
1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
2. **"추가"** 클릭
3. 설정:
   - 이름: `AI Education System`
   - 약칭: `ai_education`
   - 활성화됨: 예
4. "서비스 추가" 클릭

#### 3. 필요한 함수 추가
서비스에 다음 함수들을 추가:
- `core_webservice_get_site_info`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_quiz_structure`
- `core_question_get_question_data`
- `core_question_get_random_question_summaries`

#### 4. 사용자 및 역할 설정
1. 전용 사용자 생성: **사이트 관리 → 사용자 → 새 사용자 추가**
2. 역할 할당: Web Services 권한 부여

#### 5. 토큰 생성
1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
2. **"추가"** 클릭
3. 사용자 및 서비스 선택
4. **토큰 복사** (`.env` 파일에 저장)

### 애플리케이션 사용하기

#### 1. 연결 설정

웹 UI(http://localhost:3000)에 접속하면 **연결 설정** 화면이 나타납니다:

1. **Moodle 사이트 URL** 입력
2. **Web Service Token** 입력
3. **"연결 테스트"** 클릭
4. ✅ 연결 성공 확인

#### 2. 문제 재구성

**단일 문제 재구성**:
1. "단일 문제" 모드 선택
2. Moodle 문제 ID 입력
3. 재구성 전략 선택:
   - 역순 풀이
   - 분해 재조합
   - 복잡도 변형
   - 패턴 추출
4. 언어 설정 (한국어/English)
5. "재구성 시작" 클릭

**Quiz 전체 재구성**:
1. "Quiz 전체" 모드 선택
2. Moodle Quiz ID 입력
3. 재구성 전략 및 언어 선택
4. "재구성 시작" 클릭
5. 전체 통계 확인

#### 3. 결과 확인

재구성 결과는 다음을 포함합니다:
- **원본 문제**
- **재구성된 문제**
- **문제 구조 분석** (주제, 연산, 개체 등)
- **복잡도 지표** (조건 수, 중첩 깊이, 개체 수)
- **가능한 변형**
- **권장사항**

## 🔧 고급 설정

### Docker Compose 커스터마이징

#### 포트 변경
```yaml
# docker-compose.yml
services:
  frontend:
    ports:
      - "3001:3000"  # 호스트 포트 변경
  backend:
    ports:
      - "8001:8000"
```

#### 데이터베이스 지속성 활성화
```bash
# .env
FEATURE_DATABASE_PERSISTENCE=true

# MySQL 비밀번호 설정
MYSQL_ROOT_PASSWORD=secure_root_password
DB_PASSWORD=secure_app_password
```

#### 로그 레벨 조정
```bash
# .env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### 개발 모드 실행

```bash
# 백엔드 개발
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.complexity_api:app --reload

# 프론트엔드 개발
cd frontend
npm install
npm start
```

## 🐛 문제 해결

### 연결 실패

**증상**: "연결 실패" 오류

**해결책**:
1. Moodle URL이 올바른지 확인 (슬래시 없이)
2. Web Services가 활성화되었는지 확인
3. 토큰이 유효한지 확인
4. 방화벽 설정 확인

```bash
# 연결 테스트
curl http://localhost:8000/api/v1/moodle/test-connection
```

### 서비스 시작 실패

**증상**: Docker 컨테이너가 시작되지 않음

**해결책**:
```bash
# 로그 확인
docker-compose logs -f

# 컨테이너 재시작
docker-compose restart

# 완전히 재구성
docker-compose down -v
docker-compose up --build
```

### 포트 충돌

**증상**: "Address already in use" 오류

**해결책**:
```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :8000

# docker-compose.yml에서 포트 변경
```

### 데이터베이스 연결 오류

**증상**: MySQL 연결 실패

**해결책**:
```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# 데이터베이스 초기화
docker-compose down -v
docker-compose up mysql
```

## 📊 명령어 참조

### Docker Compose 명령어

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 로그 보기
docker-compose logs -f [service_name]

# 서비스 재시작
docker-compose restart [service_name]

# 빌드 및 시작
docker-compose up --build

# 볼륨 포함 삭제
docker-compose down -v

# 특정 서비스만 시작
docker-compose up -d frontend backend
```

### 애플리케이션 명령어

```bash
# 시작
./start.sh

# 중지
./stop.sh

# 재시작
./stop.sh && ./start.sh
```

### API 테스트 (curl)

```bash
# Health check
curl http://localhost:8000/health

# Moodle 연결 테스트
curl http://localhost:8000/api/v1/moodle/test-connection

# Quiz 문제 가져오기
curl "http://localhost:8000/api/v1/moodle/quiz/123/questions?language=ko"

# 문제 재구성
curl -X POST http://localhost:8000/api/v1/moodle/reconstruct \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 456,
    "strategy": "reverse_solution",
    "language": "ko"
  }'
```

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│           Web Browser                    │
│      http://localhost:3000              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      React Frontend (Container)         │
│      - MoodleConnection UI              │
│      - ProblemReconstructor UI          │
│      - Complexity Visualization         │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────┐
│      FastAPI Backend (Container)        │
│      - Moodle API Client                │
│      - Reverse Problem Reconstructor    │
│      - Complexity Analyzer              │
└──────┬──────────────────────┬───────────┘
       │                      │
┌──────▼──────┐       ┌───────▼──────────┐
│   Moodle    │       │  MySQL 5.7       │
│   3.7 LMS   │       │  (Optional)      │
└─────────────┘       └──────────────────┘
```

## 📄 파일 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── api/
│   │   └── complexity_api.py        # REST API 엔드포인트
│   ├── services/
│   │   ├── moodle_client.py         # Moodle API 클라이언트
│   │   ├── reverse_problem_reconstructor.py
│   │   └── complexity_analyzer.py
│   ├── database/
│   │   └── moodle_integration_schema.sql
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── MoodleIntegration/
│   │   │       ├── MoodleConnection.tsx
│   │   │       └── ProblemReconstructor.tsx
│   │   ├── services/
│   │   │   └── moodleApi.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── MOODLE_INTEGRATION.md
│
├── docker-compose.yml               # Docker Compose 설정
├── .env.example                     # 환경 변수 템플릿
├── start.sh                         # 시작 스크립트
├── stop.sh                          # 중지 스크립트
└── README_STANDALONE.md             # 이 파일
```

## 🔐 보안 고려사항

### 프로덕션 배포 시

1. **환경 변수 보호**
```bash
# .env 파일 권한 설정
chmod 600 .env

# git에서 제외 (이미 .gitignore에 포함)
```

2. **HTTPS 사용**
```nginx
# Nginx reverse proxy 예제
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

3. **토큰 암호화**
데이터베이스 지속성을 사용하는 경우, 토큰이 암호화되어 저장됩니다.

4. **접근 제한**
```yaml
# docker-compose.yml
# 외부 접근 제한 (내부 네트워크만)
services:
  mysql:
    ports: []  # 포트 노출 제거
```

## 📞 지원 및 문의

- **문서**: [docs/MOODLE_INTEGRATION.md](docs/MOODLE_INTEGRATION.md)
- **API 문서**: http://localhost:8000/docs
- **Moodle 문서**: https://docs.moodle.org/dev/Web_services

## 🎉 기여하기

이 프로젝트는 교육 목적으로 개발되었습니다. 개선 사항이나 버그 리포트는 언제든 환영합니다!

## 📜 라이선스

MIT License - 교육 목적으로 자유롭게 사용하세요.

---

**버전**: 1.0.0
**마지막 업데이트**: 2025-11-18
**호환성**: Moodle 3.7+, PHP 7.1.9+, MySQL 5.7+
