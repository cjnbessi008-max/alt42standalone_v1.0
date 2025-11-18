# 🎵 Scale Sound - 닮음 배율과 음높이 인터랙티브 수학 교육 앱

닮음 배율이 커질수록 음높이가 높아지는 인터랙티브 수학 교육 웹 애플리케이션입니다.

## 📋 프로젝트 개요

**Scale Sound**는 수학의 닮음 개념을 청각적 피드백과 결합하여 학생들이 직관적으로 이해할 수 있도록 돕는 교육 도구입니다. 도형의 배율을 조정하면 실시간으로 음높이가 변하며, 우측 하단 스마트폰 시뮬레이터에 시각적으로 표시됩니다.

### 주요 기능

- 🎼 **Scale Sound**: 닮음 배율에 따라 음높이가 실시간으로 변화 (Web Audio API)
- 📱 **스마트폰 시뮬레이터**: 우측 하단에 고정된 가상 스마트폰 화면
- 📐 **도형 시각화**: 원본과 확대/축소된 도형을 동시에 표시
- 🎚️ **인터랙티브 컨트롤**: 슬라이더로 배율 조정 (0.5x ~ 3.0x)
- 🔗 **Moodle 연동**: Moodle 3.7 LMS와 REST API로 연동
- 📊 **학습 진행도 추적**: 사용자별 문제 풀이 기록 저장

## 🛠️ 기술 스택

### 프론트엔드
- **React 18+** with TypeScript
- **Web Audio API** - 실시간 음향 생성
- **Canvas API** - 도형 렌더링
- **Axios** - HTTP 클라이언트

### 백엔드
- **Node.js 16+** with Express
- **MySQL 5.7** - 관계형 데이터베이스
- **mysql2** - MySQL 드라이버
- **CORS** - Cross-Origin Resource Sharing

### 연동
- **Moodle 3.7** REST API
- PHP 7.1.9 환경과 호환

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── SmartphoneSimulator/    # 스마트폰 화면
│   │   │   ├── ShapeDisplay/           # 도형 표시
│   │   │   └── ScaleControl/           # 배율 컨트롤
│   │   ├── services/
│   │   │   ├── audioService.ts         # Web Audio API
│   │   │   ├── scaleCalculator.ts      # 배율 계산
│   │   │   └── moodleAPI.ts            # Moodle 연동
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript 타입
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── problems.js             # 문제 API
│   │   │   ├── progress.js             # 진행도 API
│   │   │   └── moodle.js               # Moodle 연동
│   │   ├── config/
│   │   │   └── database.js             # MySQL 설정
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql            # 데이터베이스 스키마
│   └── seed.sql              # 샘플 데이터
│
├── IMPLEMENTATION_PLAN.md    # 상세 구현 계획
└── README.md                 # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Node.js 16.x 이상
- MySQL 5.7
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 생성
source database/schema.sql

# 샘플 데이터 입력 (선택사항)
source database/seed.sql
```

### 3. 백엔드 설정 및 실행

```bash
cd backend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 MySQL 및 Moodle 설정 입력

# 서버 실행
npm start

# 또는 개발 모드 (nodemon)
npm run dev
```

백엔드 서버는 `http://localhost:3001`에서 실행됩니다.

### 4. 프론트엔드 설정 및 실행

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 🎮 사용 방법

1. **웹 브라우저로 접속**: `http://localhost:3000`
2. **배율 조정**: 좌측 패널의 슬라이더를 움직여 도형의 배율 조정
3. **음높이 체험**: 배율이 변할 때마다 자동으로 음높이 변화
4. **도형 선택**: 사각형, 삼각형 등 다양한 도형 선택 가능
5. **스마트폰 화면**: 우측 하단의 가상 스마트폰 화면에서 실시간 확인

## 📊 API 엔드포인트

### 문제 관리
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `PUT /api/problems/:id` - 문제 수정
- `DELETE /api/problems/:id` - 문제 삭제

### 학습 진행도
- `GET /api/progress` - 진행도 조회
- `POST /api/progress` - 진행도 저장
- `GET /api/progress/stats/:user_id` - 사용자 통계

### Moodle 연동
- `POST /api/moodle/webservice` - Moodle API 프록시
- `GET /api/moodle/sync` - Moodle 동기화
- `GET /api/moodle/quizzes/:courseId` - 퀴즈 목록
- `GET /api/moodle/course/:courseId/contents` - 코스 컨텐츠

## 🎼 Scale Sound 알고리즘

닮음 배율을 음높이로 변환하는 알고리즘:

```typescript
// 배율 → 주파수 변환
function scaleToFrequency(scale: number): number {
  const baseFreq = 440; // A4 (라)

  // 0.5x → C4 (261.63 Hz, -12 반음)
  // 1.0x → A4 (440.00 Hz, 0 반음)
  // 2.0x → A5 (880.00 Hz, +12 반음)
  // 3.0x → C#6 (1108.73 Hz, +16 반음)

  const logScale = Math.log2(scale);
  const semitones = (logScale / Math.log2(3/0.5)) * 28 - 12;

  return baseFreq * Math.pow(2, semitones / 12);
}
```

## 🔧 환경 변수 설정

`backend/.env` 파일 예시:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scale_sound

MOODLE_URL=http://localhost/moodle
MOODLE_WS_TOKEN=your_moodle_webservice_token

CORS_ORIGIN=http://localhost:3000
```

## 🎨 UI/UX 특징

### 스마트폰 시뮬레이터
- iPhone SE 스타일 (375px × 667px)
- 상단 노치 (카메라, 스피커)
- 하단 홈 인디케이터
- 그림자 및 3D 효과

### 컬러 스킴
- 주요 색상: `#667eea` (보라-파랑 그라데이션)
- 도형 색상: 파랑(`#3498db`), 빨강(`#e74c3c`), 초록(`#2ecc71`)

### 반응형 디자인
- 데스크톱: 좌측 컨트롤 + 우측 스마트폰
- 태블릿: 세로 레이아웃
- 모바일: 스택 레이아웃

## 📚 추가 문서

- [상세 구현 계획](./IMPLEMENTATION_PLAN.md)
- [API 문서](./docs/API.md) (예정)
- [Moodle 연동 가이드](./docs/MOODLE_INTEGRATION.md) (예정)

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 📄 라이선스

MIT License

## 👥 개발팀

KAIST Touch Math Academy

---

**문의사항**: 프로젝트 이슈 트래커를 이용해주세요.
