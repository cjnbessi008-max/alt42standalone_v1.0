# 🌸 Blossom Sequence - AI 수학 학습 플랫폼

독립형 웹 애플리케이션으로 수열 패턴이 꽃잎처럼 펼쳐지는 인터랙티브 수학 학습 플랫폼입니다.

## ✨ 주요 기능

### 🎯 핵심 기능
- **AI 추천 시스템**: 학생의 학습 패턴을 분석하여 최적의 문제를 추천
- **적응형 난이도**: 성취도에 따라 자동으로 난이도 조절
- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 표시되는 인터랙티브 화면
- **꽃잎 애니메이션**: 수열이 꽃잎처럼 펼쳐지는 아름다운 시각화
- **실시간 피드백**: 즉각적인 정답/오답 피드백 제공
- **성과 추적**: 학습 진도, 정확도, 소요 시간 등 상세 통계

### 📊 수열 유형
1. **피보나치 수열** - 자연의 패턴 학습
2. **등차수열** - 기본 산술 패턴
3. **등비수열** - 지수적 성장 패턴
4. **제곱수** - 기하학적 패턴
5. **소수** - 고급 수 이론
6. **사용자 정의** - 커스텀 수열

## 🛠 기술 스택

### Frontend
- **HTML5/CSS3** - 반응형 UI
- **Vanilla JavaScript** - 프레임워크 없는 순수 JS
- **Canvas API** - 꽃잎 애니메이션
- **Web Animations API** - 부드러운 전환 효과

### Backend
- **Node.js** 14+ - 서버 런타임
- **Express.js** 4.18+ - 웹 프레임워크
- **MySQL 5.7** - 데이터베이스
- **JWT** - 인증 시스템
- **bcrypt** - 비밀번호 암호화

### AI/ML
- **협업 필터링** - 사용자 기반 추천
- **적응형 알고리즘** - 난이도 자동 조절
- **패턴 분석** - 학습 성향 파악

## 📦 설치 방법

### 1. 사전 요구사항
```bash
# Node.js 14+ 설치 확인
node --version  # v14.0.0 이상

# MySQL 5.7 설치 확인
mysql --version  # 5.7 이상
```

### 2. 저장소 클론
```bash
git clone <repository-url>
cd webapp_blossomsequence
```

### 3. 백엔드 설정
```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < ../database/schema.sql
```

### 4. 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 5. 접속
브라우저에서 `http://localhost:3000` 접속

## 🔧 환경 설정

### .env 파일 설정
```env
# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스 (MySQL 5.7)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blossom_sequence
DB_USER=root
DB_PASSWORD=your_password

# JWT 인증
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📱 사용 방법

### 1. 회원가입 / 로그인
- 첫 방문 시 계정 생성
- 기본 테스트 계정: `testuser` / `test123`

### 2. 대시보드
- 학습 통계 확인
- AI 추천 문제 확인
- 직접 문제 선택

### 3. 문제 풀이
- 가상 스마트폰 화면에서 꽃잎 애니메이션 관찰
- 수열 패턴 파악
- 다음 숫자 입력 및 제출

### 4. 결과 확인
- 즉각적인 정답/오답 피드백
- 성과 분석 및 추천

## 🎨 UI 구성

### 화면 구성
```
┌─────────────────────────────────────────────┐
│  Header (로고, 사용자 정보)                      │
├─────────────────────────────────────────────┤
│                                             │
│  대시보드/게임 화면                              │
│                                             │
│                     ┌──────────┐            │
│                     │ 📱 Virtual│            │
│                     │ Smartphone│  ← 우측 하단
│                     │  Display  │            │
│                     └──────────┘            │
└─────────────────────────────────────────────┘
```

### 가상 스마트폰
- 실제 스마트폰 프레임 디자인
- 노치, 카메라, 홈 버튼 시뮬레이션
- Canvas 기반 꽃잎 애니메이션
- 인터랙티브 입력 인터페이스

## 🧠 AI 추천 시스템

### 추천 알고리즘
1. **사용자 프로파일 분석**
   - 강점/약점 수열 타입 파악
   - 최근 성과 추이 분석
   - 선호 난이도 계산

2. **적응형 난이도**
   - 정확도 85% 이상: 난이도 상승
   - 정확도 60% 미만: 난이도 하락
   - 평균 소요 시간 고려

3. **다양성 보장**
   - 강점 강화 (30%)
   - 약점 보완 (50%)
   - 새로운 유형 탐색 (20%)

## 📊 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `user_profiles` - 학습 프로파일
- `attempts` - 학습 세션 기록
- `problem_attempts` - 개별 문제 시도
- `recommendations` - 추천 이력
- `performance_metrics` - 성과 지표
- `achievements` - 업적/배지

## 🚀 배포

### Docker 사용 (추천)
```bash
# Docker 이미지 빌드
docker build -t blossom-sequence .

# 컨테이너 실행
docker-compose up -d
```

### 수동 배포
```bash
# 프로덕션 빌드
NODE_ENV=production npm start

# PM2로 프로세스 관리
pm2 start server.js --name blossom-sequence
```

## 🔒 보안

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해싱
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (Helmet.js)
- CORS 설정
- Rate Limiting (선택사항)

## 📈 성능 최적화

- **프론트엔드**
  - CSS/JS 번들 압축
  - 이미지 최적화
  - Canvas 렌더링 최적화
  - 지연 로딩

- **백엔드**
  - 연결 풀링 (Connection Pool)
  - 쿼리 최적화 및 인덱싱
  - Response 압축 (Compression)
  - 캐싱 전략

## 🧪 테스트

```bash
# 단위 테스트
npm test

# API 테스트
npm run test:api

# E2E 테스트
npm run test:e2e
```

## 📝 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 사용자
- `GET /api/user/stats` - 사용자 통계

### 문제
- `POST /api/problems/generate` - 문제 생성
- `GET /api/problems/recommend` - AI 추천 문제

### 시도
- `POST /api/attempts/submit` - 결과 제출
- `GET /api/attempts/history` - 이력 조회

### 추천
- `GET /api/recommendations/personalized` - 개인화 추천
- `POST /api/recommendations/update-profile` - 프로파일 업데이트

## 🐛 문제 해결

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
systemctl status mysql

# 데이터베이스 생성 확인
mysql -u root -p -e "SHOW DATABASES;"
```

### 포트 충돌
```bash
# 3000 포트 사용 중인 프로세스 확인
lsof -i :3000

# .env에서 포트 변경
PORT=3001
```

## 📚 추가 개발 계획

- [ ] 다국어 지원 (i18n)
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 실시간 멀티플레이어
- [ ] 리더보드 시스템
- [ ] 모바일 앱 (React Native)
- [ ] 음성 피드백
- [ ] VR/AR 지원

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이센스

MIT License - 자유롭게 사용하세요.

## 👨‍💻 개발자

**KAIST Touch Math Academy**
- Email: support@kaist.ac.kr
- Website: https://touchmath.kaist.ac.kr

## 🙏 감사의 말

수학 교육의 미래를 함께 만들어갑니다.

---

**Made with 💜 by KAIST Touch Math Academy**
