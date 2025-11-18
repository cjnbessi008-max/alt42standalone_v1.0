# 🌅 ALT42 Expansion Mode

> 해가 넓어질수록 화면이 확장되는 인터랙티브 학습 웹 애플리케이션

LMS(Moodle)와 연동하여 문제 정보를 받아 우측 하단 가상 스마트폰 화면에 표시하는 독립형 웹앱입니다. 시간이 지나거나 문제를 해결할수록 화면이 점진적으로 확장되는 독특한 학습 경험을 제공합니다.

## ✨ 주요 기능

### 🎯 Expansion Mode
- **시간 기반 (Time-based)**: 시간이 지날수록 화면이 자동으로 확장
- **진행도 기반 (Progress-based)**: 문제를 풀수록 화면이 확장
- **하이브리드 (Hybrid)**: 시간과 진행도를 결합한 확장

### 📱 가상 스마트폰 화면
- 우측 하단에 실제 스마트폰처럼 보이는 인터페이스
- 부드러운 애니메이션과 함께 점진적으로 확장
- 해 이펙트가 화면 확장과 함께 커짐

### 🔗 Moodle LMS 연동
- Moodle 웹 서비스 API를 통한 문제 가져오기
- 답안 제출 및 자동 채점
- 학습 진행도 추적

### 🎨 아름다운 UI/UX
- 그라데이션 배경과 글래스모피즘 디자인
- 실시간 상태 표시바
- 반응형 디자인 (모바일, 태블릿, 데스크톱)

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 14.x 이상
- npm 6.x 이상
- Moodle 3.7 이상 (선택사항)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 의존성 설치
npm run install:all

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Moodle 설정 입력 (선택사항)
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
# Backend Server Configuration
PORT=3001
NODE_ENV=development

# Moodle LMS Configuration (선택사항)
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token_here

# Expansion Mode Settings
EXPANSION_DURATION=300000      # 5분 (밀리초)
EXPANSION_START_SIZE=180       # 시작 크기 (px)
EXPANSION_END_SIZE=400         # 최대 크기 (px)
```

> **참고**: Moodle 설정이 없어도 작동합니다. 목 데이터(mock data)를 사용하여 테스트할 수 있습니다.

### 실행

#### 개발 모드 (프론트엔드 + 백엔드 동시 실행)

```bash
npm run dev
```

#### 개별 실행

```bash
# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend
```

### 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📖 사용 방법

1. **모드 선택**: 시간 기반, 진행도 기반, 또는 하이브리드 모드 중 선택
2. **시작 버튼 클릭**: Expansion Mode 활성화
3. **문제 풀기**: 우측 하단 스마트폰 화면에서 문제 확인 및 답안 입력
4. **화면 확장 관찰**: 시간이 지나거나 문제를 풀면 화면이 점점 커집니다

### 모드 설명

#### ⏱️ 시간 기반 (Time-based)
- 설정된 시간(기본 5분) 동안 자동으로 화면이 확장됩니다
- 문제 풀이와 무관하게 일정한 속도로 확장
- 시간 제한이 있는 학습에 적합

#### 📊 진행도 기반 (Progress-based)
- 정답을 맞출 때마다 화면이 확장됩니다
- 학습자의 성취도에 따라 확장 속도가 달라짐
- 자기주도 학습에 적합

#### 🔄 하이브리드 (Hybrid)
- 시간과 진행도를 모두 고려합니다
- 가장 균형잡힌 학습 경험 제공
- 대부분의 학습 상황에 추천

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── backend/
│   │   ├── server.js                 # Express 서버
│   │   ├── routes/
│   │   │   ├── moodle.js            # Moodle API 라우트
│   │   │   └── expansion.js         # Expansion Mode 라우트
│   │   └── services/
│   │       └── moodleService.js     # Moodle 연동 서비스
│   └── frontend/
│       ├── public/
│       │   └── index.html           # HTML 템플릿
│       └── src/
│           ├── components/
│           │   ├── SmartphoneScreen.js    # 가상 스마트폰 화면
│           │   ├── ControlPanel.js        # 제어 패널
│           │   └── StatusBar.js           # 상태 표시바
│           ├── services/
│           │   └── apiService.js          # API 클라이언트
│           ├── styles/                    # CSS 스타일
│           ├── App.js                     # 메인 앱 컴포넌트
│           └── index.js                   # 엔트리 포인트
├── docs/                                  # 문서
├── tasks/                                 # 태스크 및 PRD
├── package.json
├── .env.example
└── README.md
```

## 🔌 API 엔드포인트

### Expansion Mode API

#### GET `/api/expansion/config`
Expansion Mode 설정 가져오기

**Response:**
```json
{
  "success": true,
  "data": {
    "duration": 300000,
    "startSize": 180,
    "endSize": 400,
    "expansionRate": "progressive",
    "triggerType": "time-based"
  }
}
```

#### POST `/api/expansion/calculate`
현재 확장 크기 계산

**Request:**
```json
{
  "startTime": 1700000000000,
  "currentTime": 1700000300000,
  "progressPercentage": 50,
  "mode": "hybrid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentSize": 290,
    "expansionFactor": 0.5,
    "percentage": 50,
    "isFullyExpanded": false
  }
}
```

### Moodle Integration API

#### GET `/api/moodle/questions/:quizId`
퀴즈 문제 목록 가져오기

#### GET `/api/moodle/question/:questionId`
특정 문제 상세 정보

#### POST `/api/moodle/submit`
답안 제출

**Request:**
```json
{
  "questionId": 1,
  "answer": "0.5",
  "userId": "user123"
}
```

#### GET `/api/moodle/progress/:userId/:quizId`
사용자 진행도 확인

#### GET `/api/moodle/test`
Moodle 연결 테스트

## 🎨 커스터마이징

### Expansion Mode 설정 변경

`.env` 파일에서 다음 값을 수정하세요:

```env
EXPANSION_DURATION=300000      # 확장 시간 (밀리초)
EXPANSION_START_SIZE=180       # 시작 크기 (픽셀)
EXPANSION_END_SIZE=400         # 최대 크기 (픽셀)
```

### 스타일 커스터마이징

`src/frontend/src/styles/` 디렉토리의 CSS 파일을 수정하여 디자인을 변경할 수 있습니다.

## 🔧 Moodle 연동 설정

### 1. Moodle 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **Site administration > Plugins > Web services > Manage protocols**
3. REST 프로토콜 활성화

### 2. 웹 서비스 토큰 생성

1. **Site administration > Plugins > Web services > Manage tokens**
2. 새 토큰 생성
3. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 3. 필요한 기능 권한 부여

다음 Moodle 웹 서비스 기능이 필요합니다:
- `mod_quiz_get_quiz_questions`
- `core_question_get_question_data`
- `mod_quiz_process_attempt`
- `mod_quiz_get_user_attempts`

## 🧪 테스트

### 백엔드 테스트

```bash
# Health check
curl http://localhost:3001/api/health

# Moodle 연결 테스트
curl http://localhost:3001/api/moodle/test

# Expansion config 확인
curl http://localhost:3001/api/expansion/config
```

### 목 데이터로 테스트

Moodle 설정 없이도 목 데이터를 사용하여 전체 기능을 테스트할 수 있습니다:

1. `.env` 파일에서 `MOODLE_URL`과 `MOODLE_TOKEN`을 비워두세요
2. 애플리케이션이 자동으로 목 데이터 모드로 전환됩니다
3. 샘플 문제들이 자동으로 제공됩니다

## 🚢 프로덕션 배포

### 빌드

```bash
# 프론트엔드 빌드
npm run build:frontend
```

### 환경 변수

프로덕션 환경에서는 `.env` 파일에 다음을 설정하세요:

```env
NODE_ENV=production
PORT=3001
MOODLE_URL=https://your-production-moodle.com
MOODLE_TOKEN=your_production_token
```

### 실행

```bash
npm start
```

## 📊 기술 스택

### Backend
- **Node.js** - 런타임 환경
- **Express.js** - 웹 프레임워크
- **Axios** - HTTP 클라이언트
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React 18** - UI 라이브러리
- **CSS3** - 스타일링 및 애니메이션
- **Axios** - API 통신

### Integration
- **Moodle 3.7+** - LMS 연동 (선택사항)
- **REST API** - 데이터 통신

## 🤝 기여하기

이 프로젝트는 KAIST Touch Math Academy의 일부입니다. 기여를 원하시면:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 👥 제작

KAIST Touch Math Academy

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

## 🎯 로드맵

### v1.0 (현재)
- ✅ 기본 Expansion Mode 구현
- ✅ Moodle 연동
- ✅ 3가지 확장 모드 (시간/진행도/하이브리드)
- ✅ 반응형 디자인

### v1.1 (예정)
- ⏳ 사운드 이펙트 추가
- ⏳ 다국어 지원 (한국어, 영어)
- ⏳ 학습 통계 대시보드

### v2.0 (예정)
- ⏳ 멀티플레이어 모드
- ⏳ 커스텀 테마
- ⏳ 오프라인 모드 지원

## 🐛 알려진 이슈

현재 알려진 이슈가 없습니다. 문제를 발견하시면 이슈를 등록해주세요.

## 💡 팁

- 처음 사용하는 경우 "하이브리드" 모드를 추천합니다
- 목 데이터 모드에서 먼저 테스트해보세요
- 화면 크기는 브라우저 크기에 맞게 자동 조정됩니다
- 모바일에서도 사용 가능합니다

---

Made with ❤️ by KAIST Touch Math Academy
