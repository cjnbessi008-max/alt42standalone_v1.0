# 🌟 Sequence Pearls - 독립형 웹앱

**빛나는 구슬로 배우는 수열 학습 앱**

AI 기반 추천 시스템이 탑재된 인터랙티브 수학 학습 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에서 수열의 각 항이 아름답게 빛나는 구슬로 표현됩니다.

![Sequence Pearls](docs/banner.png)

## ✨ 주요 기능

### 🎯 AI 추천 시스템
- **적응형 난이도**: 학생의 실력에 맞춰 자동으로 난이도 조정
- **개인화된 학습**: 취약한 영역을 파악하여 맞춤형 문제 추천
- **학습 속도 분석**: 문제 풀이 시간과 정확도를 기반으로 학습 속도 계산

### 📱 가상 스마트폰 UI
- 우측 하단에 표시되는 세련된 스마트폰 프레임
- 전체 화면 모드 지원
- 반응형 디자인

### 💎 빛나는 구슬 시각화
- HTML5 Canvas 기반 실시간 애니메이션
- 각 수열 항이 다채로운 색상의 구슬로 표현
- 부드러운 글로우 효과와 파티클 애니메이션

### 📊 진행 상황 추적
- 실시간 통계 (해결한 문제, 정확도, 연속 정답)
- 레벨 시스템
- 성취 시스템 (스트릭, 속도, 마일스톤 배지)

### 🧮 지원 수열 유형
- **등차수열** (Arithmetic)
- **등비수열** (Geometric)
- **피보나치 수열** (Fibonacci)

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js**: 14.0 이상
- **MySQL**: 5.7 이상
- **Docker** (선택사항): 컨테이너 배포용

### 설치 방법

#### 방법 1: Docker Compose (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd sequence-pearls-webapp

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 비밀키 설정

# Docker Compose로 실행
docker-compose up -d

# 브라우저에서 열기
open http://localhost:3000
```

#### 방법 2: 수동 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd sequence-pearls-webapp

# 2. 의존성 설치
npm install

# 3. MySQL 데이터베이스 생성
mysql -u root -p < database/schema.sql

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 5. 서버 실행
npm start

# 6. 브라우저에서 열기
open http://localhost:3000
```

## 📂 프로젝트 구조

```
sequence-pearls-webapp/
├── backend/                    # Node.js + Express 백엔드
│   ├── config/
│   │   └── database.js        # MySQL 연결 설정
│   ├── controllers/
│   │   ├── authController.js  # 인증 로직
│   │   └── problemController.js # 문제 관리 로직
│   ├── middleware/
│   │   └── auth.js            # JWT 인증 미들웨어
│   ├── models/                # (미래 확장용)
│   ├── routes/
│   │   ├── auth.js            # 인증 라우트
│   │   └── problems.js        # 문제 라우트
│   ├── utils/
│   │   ├── problemGenerator.js      # 문제 생성 엔진
│   │   └── recommendationEngine.js  # AI 추천 엔진
│   └── server.js              # 메인 서버 파일
│
├── frontend/                   # 프론트엔드 (Vanilla JS)
│   ├── css/
│   │   ├── main.css           # 메인 스타일
│   │   ├── smartphone.css     # 스마트폰 UI 스타일
│   │   └── pearls.css         # 구슬 애니메이션 스타일
│   ├── js/
│   │   ├── api.js             # API 통신 모듈
│   │   ├── pearls.js          # 구슬 렌더링 엔진
│   │   └── app.js             # 메인 앱 로직
│   ├── assets/                # 이미지, 아이콘
│   └── index.html             # 메인 HTML
│
├── database/
│   └── schema.sql             # MySQL 스키마
│
├── docs/                       # 문서
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 정보
- **user_profiles**: 학습 프로필 (레벨, 통계, 선호도)
- **problems**: 문제 데이터
- **attempts**: 문제 풀이 시도 기록
- **sessions**: 학습 세션
- **recommendations**: AI 추천 기록
- **achievements**: 성취 배지

## 🎮 사용법

### 1. 로그인/회원가입

- **회원가입**: 사용자명, 이메일, 비밀번호로 계정 생성
- **로그인**: 기존 계정으로 로그인
- **체험하기**: 게스트 모드로 즉시 체험 (2시간 제한)

### 2. 문제 풀이

1. **문제 로드**: AI가 현재 실력에 맞는 문제 추천
2. **구슬 관찰**: 빛나는 구슬들을 보고 패턴 파악
3. **답안 입력**: 빠진 숫자를 입력창에 입력
4. **힌트 사용**: 어려우면 💡 힌트 버튼 클릭
5. **제출**: 제출 버튼을 눌러 정답 확인
6. **피드백**: 즉시 피드백과 설명 제공
7. **다음 문제**: 계속 학습하며 레벨업!

### 3. 진행 상황 확인

좌측 패널에서 실시간 통계 확인:
- 해결한 문제 수
- 정확도
- 현재 연속 정답
- 최고 연속 기록
- 현재 레벨

## 🤖 AI 추천 시스템 작동 원리

### 1. 난이도 조정 알고리즘

```
정확도 >= 80% AND 빠른 속도 → 난이도 +1
정확도 >= 60% → 난이도 유지
정확도 < 40% → 난이도 -1
```

### 2. 수열 유형 추천

- 최근 10개 문제 분석
- 취약한 유형 우선 추천 (70% 확률)
- 선호 유형 보완 (30% 확률)

### 3. 학습 속도 계산

```
평균 시간 < 30초 AND 정확도 >= 80% → 속도 +0.1
평균 시간 > 90초 OR 정확도 < 50% → 속도 -0.1
```

## 🎨 기술 스택

### Backend
- **Node.js** (v16+)
- **Express.js** (v4.18)
- **MySQL** 5.7+ (mysql2 드라이버)
- **JWT** (jsonwebtoken)
- **bcrypt** (비밀번호 해싱)

### Frontend
- **Vanilla JavaScript** (ES6+)
- **HTML5 Canvas** (구슬 렌더링)
- **CSS3** (Animations, Gradients, Flexbox)

### DevOps
- **Docker** & **Docker Compose**
- **Node.js** 프로세스 관리

## 🔒 보안

- **비밀번호 해싱**: bcrypt (솔트 라운드 10)
- **JWT 인증**: 24시간 만료
- **SQL Injection 방지**: 준비된 문장(Prepared Statements)
- **CORS 설정**: 적절한 출처 제한
- **입력 검증**: express-validator

## 📈 API 엔드포인트

### 인증

```
POST   /api/auth/register      # 회원가입
POST   /api/auth/login         # 로그인
POST   /api/auth/guest         # 게스트 로그인
GET    /api/auth/me            # 현재 사용자 정보
```

### 문제

```
GET    /api/problems/recommended       # 추천 문제 가져오기
POST   /api/problems/:id/submit        # 답안 제출
GET    /api/problems/stats             # 통계 조회
GET    /api/problems/achievements      # 성취 조회
```

### 헬스체크

```
GET    /api/health             # 서버 상태 확인
```

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage
```

## 🔧 환경 변수

`.env` 파일 설정:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sequence_pearls

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h

# Recommendation
RECOMMENDATION_THRESHOLD=0.7
INITIAL_DIFFICULTY=3
```

## 🐛 문제 해결

### MySQL 연결 오류

```bash
# MySQL 서비스 확인
service mysql status

# MySQL 재시작
service mysql restart

# 데이터베이스 재생성
mysql -u root -p < database/schema.sql
```

### 포트 충돌

```bash
# 포트 사용 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### Docker 문제

```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f

# 완전히 재구축
docker-compose down -v
docker-compose up --build
```

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 👥 기여

기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 문의

- 이메일: support@sequencepearls.com
- 이슈 트래커: GitHub Issues

## 🙏 감사

- KAIST Touch Math Academy
- 모든 기여자 및 사용자들

---

**Made with ❤️ by KAIST Touch Math Academy**

*수열을 빛나는 구슬처럼 아름답게!*
