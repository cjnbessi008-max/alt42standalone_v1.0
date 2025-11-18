# Geo Spiral - 독립형 웹앱 🌀

**AI 기반 추천 시스템이 탑재된 등비수열 나선형 시각화 독립형 웹 애플리케이션**

수학의 아름다움을 발견하고, 맞춤형 학습 경로로 등비수열과 나선의 세계를 탐험하세요!

---

## ✨ 주요 기능

### 🤖 AI 추천 시스템
- **맞춤형 학습 경로**: 사용자의 레벨, 진도, 성취도를 분석하여 최적의 수열 추천
- **적응형 난이도**: 평균 점수에 따라 도전적이거나 기초적인 문제 제시
- **학습 분석**: 완료한 수열, 평균 점수, 소요 시간 등 상세한 통계

### 📱 몰입형 UI/UX
- **랜딩 페이지**: 매력적인 히어로 섹션과 기능 소개
- **대시보드**: 개인화된 추천, 진도, 통계를 한눈에
- **가상 스마트폰**: 우측 하단에 배치된 실감 나는 3D 스마트폰 UI
- **리더보드**: 상위 20명의 학습자 순위 및 메달 시스템

### 🌀 강력한 시각화
- **15+ 수열**: 등비수열, 피보나치, 황금비 등 다양한 수열
- **3가지 나선 타입**: 로그 나선, 아르키메데스, 피보나치
- **인터랙티브 컨트롤**: 애니메이션, 확대/축소, 회전, 초기화
- **부드러운 곡선**: Catmull-Rom 스플라인 렌더링

### 🔐 완전한 사용자 관리
- **회원가입/로그인**: JWT 기반 인증
- **게스트 모드**: 로그인 없이 체험 가능
- **프로필 관리**: 사용자 정보 업데이트
- **진도 추적**: 각 수열별 완료 상태, 점수, 시간 기록

---

## 🚀 빠른 시작

### 사전 요구사항

- **Docker** & **Docker Compose**
- **Git**

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 독립형 앱 실행

```bash
docker-compose -f docker-compose-standalone.yml up -d
```

서비스:
- **MySQL**: `localhost:3306`
- **Backend API**: `localhost:5000`
- **Frontend**: `localhost:3000`

### 3. 앱 접속

브라우저에서 `http://localhost:3000` 접속

---

## 📖 사용 방법

### 첫 방문자

1. **랜딩 페이지**에서 "시작하기" 또는 "게스트로 체험" 클릭
2. **회원가입** (또는 게스트 로그인)
3. **대시보드**에서 AI가 추천하는 수열 확인
4. 수열 카드를 클릭하여 **시각화 시작**

### 시각화 사용

1. **애니메이션 시작**: 나선이 단계별로 그려지는 과정 관찰
2. **확대/축소**: 디테일 확인 또는 전체 구조 파악
3. **회전**: 다양한 각도에서 나선 탐색
4. **완료**: 학습 완료 시 자동으로 진도 저장

### 추천 시스템

- **완료할수록 레벨 업**: 3개 완료 시 Lv2, 6개 Lv3, 10개 Lv4, 15개 Lv5
- **적응형 추천**:
  - 평균 점수 90% 이상 → 한 단계 높은 난이도
  - 평균 점수 60% 이하 → 한 단계 낮은 난이도
- **진행 중인 수열 우선 표시**

---

## 🏗 아키텍처

### 백엔드 (Node.js + Express)

```
src/backend/
├── server.js                 # 메인 서버
├── config/
│   └── database.js          # MySQL 연결 풀
├── middleware/
│   └── auth.js              # JWT 인증 미들웨어
├── routes/
│   ├── auth.js              # 회원가입, 로그인, 게스트
│   ├── sequences.js         # 수열 조회
│   ├── progress.js          # 진도 저장, 통계
│   ├── recommendations.js   # AI 추천 엔진
│   └── users.js             # 사용자 관리, 리더보드
└── package.json
```

### 프론트엔드 (React + Router)

```
src/frontend/src/
├── App.js                    # 라우팅
├── components/
│   ├── LandingPage.js        # 랜딩 페이지
│   ├── Login.js              # 로그인
│   ├── Register.js           # 회원가입
│   ├── Dashboard.js          # 대시보드 (추천, 통계)
│   ├── VisualizationPage.js  # 시각화 페이지
│   ├── Leaderboard.js        # 리더보드
│   ├── VirtualPhone.js       # 가상 스마트폰 UI
│   ├── SpiralVisualization.js # 나선 렌더링
│   └── SequenceSelector.js   # 수열 선택기
└── utils/
    ├── api.js                # API 클라이언트
    └── spiralEngine.js       # 나선 계산 엔진
```

### 데이터베이스 (MySQL 5.7)

```sql
users                 # 사용자 정보, 레벨, 역할
sequences             # 수열 정의 (15개 샘플 포함)
progress              # 사용자별 진도, 점수, 시간
interactions          # 상호작용 이력
```

---

## 🎨 UI 스크린샷 (개념)

### 랜딩 페이지
- 그라디언트 히어로 섹션
- 6개 기능 카드
- 통계 (15+ 수열, 5 레벨)

### 대시보드
- 사용자 프로필 카드 (아바타, 레벨, 역할)
- 4개 통계 카드 (완료, 평균 점수, 시간, 상호작용)
- AI 추천 수열 그리드
- 진행 중인 수열
- 최근 학습 활동

### 시각화 페이지
- 헤더 (수열 정보, 난이도 배지)
- 가상 스마트폰 (우측 하단)
- 사용 방법 4단계
- 수열 상세 정보

### 리더보드
- 🥇🥈🥉 메달 시스템
- 상위 3명 특별 스타일
- 완료 수, 평균 점수, 레벨 표시

---

## 🤖 추천 알고리즘

### 개인화 로직

```javascript
1. 사용자 레벨 & 평균 점수 분석
2. 완료한 수열 제외
3. 목표 난이도 설정:
   - 평균 90% 이상 → userLevel + 1 (도전)
   - 평균 60~90% → userLevel (유지)
   - 평균 60% 이하 → userLevel - 1 (복습)
4. 목표 난이도 ±1 범위 내 수열 선택
5. 인기도 & 평균 점수 순 정렬
```

### 레벨업 시스템

```javascript
완료 수열 (점수 80% 이상):
- 3개  → Level 2
- 6개  → Level 3
- 10개 → Level 4
- 15개 → Level 5 (최고 레벨)
```

---

## 📊 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/guest` - 게스트 로그인

### 수열
- `GET /api/sequences` - 전체 수열
- `GET /api/sequences/:id` - 특정 수열
- `GET /api/sequences/level/:level` - 레벨별 수열

### 진도
- `GET /api/progress` - 사용자 진도
- `POST /api/progress` - 진도 저장
- `GET /api/progress/stats` - 통계

### 추천
- `GET /api/recommendations` - 맞춤 추천
- `GET /api/recommendations/next` - 다음 추천
- `GET /api/recommendations/path` - 학습 경로

### 사용자
- `GET /api/users/me` - 현재 사용자
- `PUT /api/users/me` - 프로필 업데이트
- `GET /api/users/leaderboard` - 리더보드

---

## 🛠 개발 가이드

### 백엔드 개발

```bash
cd src/backend
npm install
npm run dev  # nodemon으로 자동 재시작
```

### 프론트엔드 개발

```bash
cd src/frontend
npm install
npm start  # http://localhost:3000
```

### 데이터베이스 접속

```bash
docker exec -it geospiral_mysql mysql -u geospiral -pgeospiral123 geospiral_db
```

### 새 수열 추가

```sql
INSERT INTO sequences
(name, description, sequence_type, first_term, common_ratio, num_terms, spiral_type, difficulty_level, tags, created_by)
VALUES
('My Sequence', '설명', 'geometric', 1.0, 2.0, 10, 'logarithmic', 3, '["custom"]', 1);
```

---

## 🧪 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **백엔드** | Node.js + Express | 16+ |
| **프론트엔드** | React + Router | 18.2 |
| **데이터베이스** | MySQL | 5.7 |
| **인증** | JWT | - |
| **시각화** | Canvas API, D3.js | - |
| **스타일링** | CSS3 (Gradient, Flexbox, Grid) | - |
| **인프라** | Docker Compose | - |

---

## 📝 환경 변수

### 백엔드 (src/backend/.env)

```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=mysql
DB_PORT=3306
DB_USER=geospiral
DB_PASSWORD=geospiral123
DB_NAME=geospiral_db

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 프론트엔드 (src/frontend/.env)

```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_USE_MOCK=false
```

---

## 🐛 문제 해결

### 컨테이너 시작 실패

```bash
docker-compose -f docker-compose-standalone.yml down
docker-compose -f docker-compose-standalone.yml up -d --build
```

### 데이터베이스 연결 실패

```bash
# MySQL 컨테이너 상태 확인
docker logs geospiral_mysql

# 컨테이너 재시작
docker-compose -f docker-compose-standalone.yml restart mysql
```

### 프론트엔드 빌드 오류

```bash
cd src/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 향후 계획

- [ ] 소셜 로그인 (Google, GitHub)
- [ ] 실시간 멀티플레이어 모드
- [ ] 사용자 정의 수열 생성
- [ ] 3D 나선 시각화 (Three.js)
- [ ] 모바일 앱 (React Native)
- [ ] 수열 퀴즈 모드
- [ ] 배지 & 업적 시스템

---

## 📄 라이선스

MIT License

---

## 👥 기여

KAIST Touch Math Academy

---

## 📞 문의

GitHub Issues를 통해 문의해주세요.

---

**Geo Spiral Standalone** - 수학을 아름답게, 학습을 개인화하다 ✨🌀
