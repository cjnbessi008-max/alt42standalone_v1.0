# 🎓 Wrong Move Alert - LMS Integration System

교육용 문제 풀이 시 잘못된 답변에 대해 시각적 피드백(붉은 크랙 효과)을 제공하는 웹 기반 학습 시스템입니다.

## ✨ 주요 기능

### 🔴 Wrong Move Alert 시스템
- **실시간 오답 감지**: 학생이 잘못된 답을 입력하는 순간 즉시 감지
- **시각적 피드백**: 화면에 붉은 크랙(균열) 효과 애니메이션 표시
- **3단계 심각도**:
  - 🟡 **낮음 (Low)**: 3개의 크랙 라인
  - 🟠 **중간 (Medium)**: 5개의 크랙 라인
  - 🔴 **높음 (High)**: 8개의 크랙 라인 + 파편 효과

### 📱 가상 스마트폰 UI
- 우측 하단에 고정된 모바일 화면 시뮬레이션
- 320x640 해상도의 스마트폰 프레임
- 노치 디자인 포함
- 반응형 디자인 지원

### 🔗 Moodle LMS 연동
- **Moodle 3.7** 호환
- **Web Services API** 연동
- 문제 동기화 기능
- 학생 성적 자동 전송
- 활동 로그 기록

### 📊 학습 분석
- 학생별 정답률 통계
- 문제별 난이도 분석
- Wrong Move 패턴 추적
- 학습 세션 기록

## 🛠 기술 스택

### Frontend
- **React 18** + TypeScript
- **Socket.io Client** - 실시간 통신
- **Framer Motion** - 애니메이션
- **Axios** - HTTP 요청

### Backend
- **Node.js** + Express
- **TypeScript**
- **Socket.io** - WebSocket 서버
- **Winston** - 로깅

### Database
- **PostgreSQL 15** - 메인 데이터베이스
- JSONB 지원으로 유연한 데이터 저장
- 분석용 뷰 및 함수 제공

### DevOps
- **Docker** + Docker Compose
- 개발 환경 자동 설정
- 핫 리로드 지원

## 📋 사전 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Docker** & **Docker Compose**: 최신 버전 (선택사항)
- **PostgreSQL**: 15 이상 (Docker 미사용 시)

## 🚀 빠른 시작

### 방법 1: Docker Compose 사용 (권장)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값 수정

# 3. Docker Compose로 전체 시스템 실행
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f

# 5. 브라우저에서 접속
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# pgAdmin: http://localhost:5050 (옵션)
```

### 방법 2: 로컬 개발 환경

#### PostgreSQL 설치 및 설정

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 시작
sudo systemctl start postgresql

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE wrongmove_db;
CREATE USER wrongmove_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wrongmove_db TO wrongmove_user;
\q

# 스키마 및 시드 데이터 로드
psql -U wrongmove_user -d wrongmove_db -f database/schema.sql
psql -U wrongmove_user -d wrongmove_db -f database/seed.sql
```

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=wrongmove_db
# - DB_USER=wrongmove_user
# - DB_PASSWORD=your_password

# 개발 서버 실행 (포트 3001)
npm run dev
```

#### Frontend 설정

```bash
# 새 터미널에서
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정:
# - REACT_APP_BACKEND_URL=http://localhost:3001

# 개발 서버 실행 (포트 3000)
npm start
```

## 📖 사용 방법

### 1. 기본 사용

1. 브라우저에서 `http://localhost:3000` 접속
2. 우측 하단 가상 스마트폰 화면에서 문제 확인
3. 답을 입력하고 "확인" 버튼 클릭
4. **잘못된 답**: 붉은 크랙 효과 표시
5. **정답**: 다음 단계로 진행 또는 완료

### 2. Moodle 연동 설정

#### Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**로 이동
3. 다음 설정 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

#### API 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. 새 토큰 생성
3. 사용자 선택 (충분한 권한 필요)
4. 서비스 선택 또는 생성
5. 토큰 복사

#### 시스템 설정

```bash
# .env 파일 수정
MOODLE_BASE_URL=https://your-moodle-instance.com
MOODLE_API_TOKEN=your_generated_token
MOODLE_COURSE_ID=your_course_id
```

#### 문제 동기화

```bash
# API를 통해 Moodle 문제 가져오기
curl -X POST http://localhost:3001/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"courseId": "course_math_grade3"}'
```

### 3. 문제 생성

#### API를 통한 생성

```bash
curl -X POST http://localhost:3001/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "id": "problem_custom_001",
    "title": "분수의 곱셈",
    "description": "1/2 × 3/4 = ?",
    "type": "input",
    "correctAnswer": "3/8",
    "difficulty": "medium",
    "subject": "수학",
    "gradeLevel": "초등 4학년"
  }'
```

#### 데이터베이스 직접 삽입

```sql
INSERT INTO problems (
  id, title, description, type,
  correct_answer, difficulty, subject, grade_level
) VALUES (
  'problem_006',
  '소수의 덧셈',
  '0.5 + 0.25 = ?',
  'input',
  '0.75',
  'easy',
  '수학',
  '초등 4학년'
);
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── VirtualPhone/      # 가상 스마트폰 UI
│   │   │   │   ├── VirtualPhone.tsx
│   │   │   │   └── VirtualPhone.css
│   │   │   └── WrongMoveAlert/    # 붉은 크랙 효과
│   │   │       ├── WrongMoveAlert.tsx
│   │   │       └── WrongMoveAlert.css
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── problem.routes.ts     # 문제 API
│   │   │   └── interaction.routes.ts # 상호작용 API
│   │   ├── middleware/
│   │   │   └── moodle.middleware.ts  # Moodle 연동
│   │   └── server.ts                 # 메인 서버
│   ├── logs/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── database/                 # 데이터베이스 스키마
│   ├── schema.sql           # 테이블 정의
│   └── seed.sql             # 초기 데이터
│
├── docker-compose.yml       # Docker 설정
├── .env.example             # 환경 변수 템플릿
├── .gitignore
└── README.md
```

## 🗄 데이터베이스 스키마

### 주요 테이블

#### `problems` - 문제 정보
- 문제 정의, 정답, 단계별 힌트
- Moodle 문제 ID 매핑
- 난이도, 과목, 학년 분류

#### `students` - 학생 정보
- 학생 프로필
- Moodle 사용자 ID 매핑

#### `student_interactions` - 학습 상호작용
- 모든 학생 답변 기록
- 정답/오답 여부
- 소요 시간 측정

#### `wrong_move_events` - 오답 이벤트
- Wrong Move 트리거 기록
- 심각도 레벨
- 오개념 유형 분류

### 분석 뷰

#### `student_performance` - 학생 성적 요약
```sql
SELECT * FROM student_performance
WHERE student_id = 'student_001';
```

#### `problem_difficulty_analysis` - 문제 난이도 분석
```sql
SELECT * FROM problem_difficulty_analysis
WHERE calculated_difficulty != declared_difficulty;
```

## 🔌 API 엔드포인트

### Problems API

```
GET    /api/problems              # 모든 문제 조회
GET    /api/problems/:id          # 특정 문제 조회
POST   /api/problems              # 새 문제 생성
PUT    /api/problems/:id          # 문제 수정
DELETE /api/problems/:id          # 문제 삭제
```

### Interactions API

```
GET    /api/interactions                    # 상호작용 기록 조회
GET    /api/interactions/stats/:studentId   # 학생 통계
GET    /api/interactions/wrong-moves        # Wrong Move 이벤트 조회
```

### Socket.io 이벤트

#### Client → Server
- `problem:request` - 문제 요청
- `interaction:submit` - 답변 제출

#### Server → Client
- `problem:loaded` - 문제 전송
- `problem:validation` - 검증 결과
- `error` - 오류 메시지

## 🎨 커스터마이징

### Wrong Move Alert 효과 조정

`frontend/src/components/WrongMoveAlert/WrongMoveAlert.tsx`:

```typescript
const numCracks = event.severity === 'high' ? 8 :  // 변경 가능
                  event.severity === 'medium' ? 5 :
                  3;

const duration = 2000; // 밀리초 단위로 조정
```

### 크랙 색상 변경

`frontend/src/components/WrongMoveAlert/WrongMoveAlert.css`:

```css
.crack-high {
  stroke: #ff0000;  /* 색상 변경 */
  stroke-width: 3;
}
```

### 가상 스마트폰 크기 조정

`frontend/src/components/VirtualPhone/VirtualPhone.css`:

```css
.virtual-phone {
  width: 320px;   /* 너비 조정 */
  height: 640px;  /* 높이 조정 */
}
```

## 🧪 테스트

### Backend 테스트

```bash
cd backend
npm test
```

### Frontend 테스트

```bash
cd frontend
npm test
```

### E2E 테스트 (예정)

```bash
npm run test:e2e
```

## 📊 모니터링

### 로그 확인

```bash
# Docker 로그
docker-compose logs -f backend
docker-compose logs -f frontend

# 로컬 로그
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### 데이터베이스 모니터링

pgAdmin 접속: `http://localhost:5050`
- Email: admin@example.com
- Password: admin

## 🔒 보안 고려사항

### 운영 환경 배포 전 체크리스트

- [ ] `.env` 파일의 모든 비밀번호 변경
- [ ] PostgreSQL 외부 접근 제한
- [ ] HTTPS 설정
- [ ] CORS 허용 도메인 제한
- [ ] Rate limiting 구현
- [ ] SQL Injection 방어 확인
- [ ] XSS 방어 확인
- [ ] 세션 보안 강화
- [ ] Moodle API 토큰 보안 저장

## 🐛 문제 해결

### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U wrongmove_user -d wrongmove_db -h localhost
```

### Socket.io 연결 끊김

1. Backend 로그 확인: `docker-compose logs backend`
2. CORS 설정 확인: `.env` 파일의 `FRONTEND_URL`
3. 방화벽 설정 확인

### Moodle 연동 오류

1. Moodle Web Services 활성화 확인
2. API 토큰 유효성 확인
3. 통합 로그 확인:
```sql
SELECT * FROM moodle_integration_log
WHERE success = false
ORDER BY timestamp DESC
LIMIT 10;
```

## 📚 참고 자료

- [Moodle Web Services API 문서](https://docs.moodle.org/dev/Web_services)
- [Socket.io 문서](https://socket.io/docs/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [React 문서](https://react.dev/)

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**© 2024 Wrong Move Alert System | KAIST Touch Math Academy**
